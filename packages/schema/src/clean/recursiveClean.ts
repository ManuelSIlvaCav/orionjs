import isUndefined from 'lodash/isUndefined'
import isArray from 'lodash/isArray'
import cleanType from './cleanType'
import isNil from 'lodash/isNil'
import {CurrentNodeInfo, SchemaNode, SchemaNodeArrayType, SchemaNodeType} from '../types/schema'
import getObjectNode from './getObjectNode'

const cleanObjectFields = async function ({
  schema,
  value,
  ...other
}: {
  schema: SchemaNode
  value: object
}): Promise<any> {
  const keys = Object.keys(schema.type).filter(key => !key.startsWith('__'))
  const newDoc: object = {}

  for (const key of keys) {
    try {
      const cleanOptions = {
        ...other,
        schema: schema.type[key],
        value: value[key],
        currentDoc: value
      }
      const newValue = await clean(cleanOptions)
      if (!isUndefined(newValue)) {
        newDoc[key] = newValue
      }
    } catch (error) {
      throw new Error(`Error cleaning field ${key}, error: ${error.message}`)
    }
  }
  return newDoc
}

const cleanArrayItems = async function <T extends SchemaNodeArrayType>({
  schema,
  value,
  ...other
}: {
  schema: Partial<SchemaNode>
  value: T
}): Promise<any> {
  // clean array items

  const schemaType = schema.type[0]

  const promises = value.map(async (item, index) => {
    const newValue = await clean({
      ...other,
      schema: {
        type: schemaType
      },
      value: item,
      currentDoc: value
    })
    return newValue
  })

  const result = await Promise.all(promises)
  return result.filter(value => !isUndefined(value)) as T
}

function getArrayNode<T extends SchemaNodeType>(
  schema: Partial<SchemaNode>,
  value: T | T[]
): SchemaNode | void {
  if (isArray(schema.type) && !isNil(value)) {
    const result = schema as SchemaNode
    return result
  }

  return null
}

const clean = async function <T extends SchemaNodeType>(info: CurrentNodeInfo): Promise<any> {
  let {schema, args = [], value} = info

  const currSchema: SchemaNode =
    schema.type === undefined ? ({type: schema} as SchemaNode) : (schema as SchemaNode)

  const objectSchema = getObjectNode(currSchema, value)
  if (objectSchema) {
    const newDoc = await cleanObjectFields({
      ...info,
      schema: objectSchema,
      value: value as object
    })
    const result = await cleanType('plainObject', objectSchema, newDoc, info, ...args)
    return result as T
  }

  const arraySchema = getArrayNode(currSchema, value)

  if (arraySchema) {
    let updatedValue = value
    if (!isArray(value) && !Array.isArray(value)) {
      updatedValue = [value] as T
    }

    const newDoc = await cleanArrayItems({
      ...info,
      schema: arraySchema,
      value: updatedValue as SchemaNodeArrayType
    })
    const result = await cleanType('array', arraySchema, newDoc, info, ...args)
    return result as T
  }

  const result = await cleanType(currSchema.type, currSchema, value, info, ...args)
  return result
}

export default clean

import getSelector from './getSelector'

it('should find by id when a string is passed', async () => {
  expect(getSelector('hello')).toEqual({_id: 'hello'})
})

it('should return none selector when not an object or a string is passed', async () => {
  expect(getSelector(null)).toEqual({_id: 'shouldReturnNull'})
  expect(getSelector(undefined)).toEqual({_id: 'shouldReturnNull'})
})

it('should return the selector when a valid mongo selector is passed', async () => {
  const selector = {_id: 'hello', number: 123}
  expect(getSelector(selector)).toBe(selector)
})

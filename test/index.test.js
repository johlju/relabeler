// You can import your modules
// const index = require('../index')

const context = describe

beforeEach(() => {
})

afterEach(() => {
})

describe('addition', () => {
  context('When One and Two and Three are added', () => {
    it('Should be 6', () => {
      // your real tests go here
      expect(1 + 2 + 3).toBe(6)
    })
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

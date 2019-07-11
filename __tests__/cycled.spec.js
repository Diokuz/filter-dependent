const path = require('path')
const filterDependent = require('../index.ts')

function mf(fns) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Cycled', () => {
  it('Must not fail when cycled', () => {
    const sources = mf(['cycled/a.js'])
    const result = filterDependent(sources, [])

    expect(result).toEqual([])
  })

  it('Must find deps when cycled', () => {
    const sources = mf(['cycled/a.js'])
    const targets = mf(['cycled/c.js'])
    const result = filterDependent(sources, targets)

    expect(result).toEqual(sources)
  })

  it('Two files require each other in the middle of require chain', () => {
    const sources = mf(['cycled2/a.js'])
    const targets = mf(['cycled2/c.js'])
    const result = filterDependent(sources, targets)

    expect(result).toEqual(sources)
  })
})

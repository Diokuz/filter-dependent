const path = require('path')
const filterDependent = require('../index.ts')

function mf(fns) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Common', () => {
  it('Must remove duplicate sources', () => {
    const sources = mf(['tree/a.js', 'tree/a.js'])
    const result = filterDependent(sources, mf(['tree/ab.js']))

    expect(result).toEqual(mf(['tree/a.js']))
  })
})

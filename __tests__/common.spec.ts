import path from 'path'
import filterDependent from '../index'

function mf(fns: string[]) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Common', () => {
  it('Must remove duplicate sources', () => {
    const sources = mf(['tree/a.js', 'tree/a.js'])
    const result = filterDependent(sources, mf(['tree/ab.js']))

    expect(result).toEqual(mf(['tree/a.js']))
  })
})

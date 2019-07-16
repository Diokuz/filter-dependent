import path from 'path'
import filterDependent from '../index'

function mf(fns: string[]) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Tree', () => {
  it('Returns empty result on empty data', () => {
    const result = filterDependent([], [])

    expect(result).toEqual([])
  })

  it('Returns empty result on empty sources', () => {
    const result = filterDependent([], mf(['tree/a.js']))

    expect(result).toEqual([])
  })

  it('Returns sources if targets === sources', () => {
    const sources = mf(['tree/a.js'])
    const targets = sources
    const result = filterDependent(sources, targets)

    expect(result).toEqual(sources)
  })

  it('Returns only dependent sources', () => {
    const sources = mf(['tree/ab.js', 'tree/ac.js'])
    const targets = mf(['tree/abb.js'])
    const expected = mf(['tree/ab.js'])
    const result = filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('Returns only dependent sources (transitive)', () => {
    const sources = mf(['tree/a.js', 'imports/a.js'])
    const targets = mf(['tree/abb.js'])
    const expected = mf(['tree/a.js'])
    const result = filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 imports', () => {
    const sources = mf(['imports/a.js'])
    const targets = mf(['imports/c.js'])
    const expected = sources
    const result = filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('chain in source files', () => {
    const sources = mf(['imports/a.js', 'imports/b.js'])
    const targets = mf(['imports/c.js'])
    const expected = sources
    const result = filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('Broken imports must throw', () => {
    const sources = mf(['cant-resolve/broken.js'])

    expect(() => filterDependent(sources, [])).toThrow()
  })

  it('ts/tsx/css/jsx', () => {
    const sources = mf(['ts-css/a.js'])
    const targets = mf(['ts-css/d.jsx'])
    const expected = sources
    const result = filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })
})

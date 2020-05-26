import path from 'path'
// @ts-ignore
import { filterDependentSync } from '../src/index.ts'
import { pathToUnixPath } from '../src/utils'

function mf(fns: string[]) {
  return fns.map((f) => pathToUnixPath(path.resolve(process.cwd(), '__tests__', '__fixtures__', f)))
}

describe('Tree', () => {
  it('Returns empty result on empty data', () => {
    const result = filterDependentSync([], [])

    expect(result).toEqual([])
  })

  it('Returns empty result on empty sources', () => {
    const result = filterDependentSync([], mf(['tree/a.js']))

    expect(result).toEqual([])
  })

  it('Returns sources if targets === sources', () => {
    const sources = mf(['tree/a.js'])
    const targets = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(sources)
  })

  it('Returns only dependent sources', () => {
    const sources = mf(['tree/ab.js', 'tree/ac.js'])
    const targets = mf(['tree/abb.js'])
    const expected = mf(['tree/ab.js'])
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('Returns only dependent sources (transitive)', () => {
    const sources = mf(['tree/a.js', 'imports/a.js'])
    const targets = mf(['tree/abb.js'])
    const expected = mf(['tree/a.js'])
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 imports', () => {
    const sources = mf(['imports/a.js'])
    const targets = mf(['imports/c.js'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 and cjs mixed, es6 first - check es6', () => {
    const sources = mf(['imports/d.js'])
    const targets = mf(['imports/a.js'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 and cjs mixed, es6 first - check cjs', () => {
    const sources = mf(['imports/d.js'])
    const targets = mf(['imports/f.js'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 and cjs mixed, es6 first - check es6', () => {
    const sources = mf(['imports/e.js'])
    const targets = mf(['imports/a.js'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 and cjs mixed, es6 first - check cjs', () => {
    const sources = mf(['imports/e.js'])
    const targets = mf(['imports/f.js'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('chain in source files', () => {
    const sources = mf(['imports/a.js', 'imports/b.js'])
    const targets = mf(['imports/c.js'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })

  it('Broken imports must throw', () => {
    const sources = mf(['cant-resolve/broken.js'])

    expect(() => filterDependentSync(sources, [])).toThrow()
  })

  it('ts/tsx/css/jsx', () => {
    const sources = mf(['ts-css/a.js'])
    const targets = mf(['ts-css/d.jsx'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })
})

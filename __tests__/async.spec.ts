import path from 'path'
// @ts-ignore
import filterDependent from '../src/index.ts'
import { pathToUnixPath } from '../src/utils'

function mf(fns: string[]) {
  return fns.map((f) => pathToUnixPath(path.resolve(process.cwd(), '__tests__', '__fixtures__', f)))
}

describe('Tree', () => {
  it('Returns empty result on empty data', async () => {
    const result = await filterDependent([], [])

    expect(result).toEqual([])
  })

  it('Returns empty result on empty sources', async () => {
    const result = await filterDependent([], mf(['tree/a.js']))

    expect(result).toEqual([])
  })

  it('Returns sources if targets === sources', async () => {
    const sources = mf(['tree/a.js'])
    const targets = sources
    const result = await filterDependent(sources, targets)

    expect(result).toEqual(sources)
  })

  it('Returns only dependent sources', async () => {
    const sources = mf(['tree/ab.js', 'tree/ac.js'])
    const targets = mf(['tree/abb.js'])
    const expected = mf(['tree/ab.js'])
    const result = await filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('Returns only dependent sources (transitive)', async () => {
    const sources = mf(['tree/a.js', 'imports/a.js'])
    const targets = mf(['tree/abb.js'])
    const expected = mf(['tree/a.js'])
    const result = await filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('es6 imports', async () => {
    const sources = mf(['imports/a.js'])
    const targets = mf(['imports/c.js'])
    const expected = sources
    const result = await filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  it('chain in source files', async () => {
    const sources = mf(['imports/a.js', 'imports/b.js'])
    const targets = mf(['imports/c.js'])
    const expected = sources
    const result = await filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })

  // @todo fix
  xit('Broken imports must throw', async () => {
    const sources = mf(['cant-resolve/broken.js__qqq'])

    await expect(filterDependent(sources, [])).rejects.toEqual(1 /* wat? */)
  })

  it('ts/tsx/css/jsx', async () => {
    const sources = mf(['ts-css/a.js'])
    const targets = mf(['ts-css/d.jsx'])
    const expected = sources
    const result = await filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })
})

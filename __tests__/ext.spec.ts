import path from 'path'
// @ts-ignore
import { filterDependentSync } from '../src/index.ts'
import { pathToUnixPath } from '../src/utils'

function mf(fns: string[]) {
  return fns.map((f) => pathToUnixPath(path.resolve(process.cwd(), '__tests__', '__fixtures__', f)))
}

describe('Ext', () => {
  it('Must resolve ts, tsx and jsx by default', () => {
    const sources = mf(['ext/a.js'])
    const targets = mf(['ext/d.jsx'])
    const expected = sources
    const result = filterDependentSync(sources, targets)

    expect(result).toEqual(expected)
  })
})

import path from 'path'
// @ts-ignore
import filterDependent from '../index.ts'

function mf(fns: string[]) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Ext', () => {
  it('Must resolve ts, tsx and jsx by default', () => {
    const sources = mf(['ext/a.js'])
    const targets = mf(['ext/d.jsx'])
    const expected = sources
    const result = filterDependent(sources, targets)

    expect(result).toEqual(expected)
  })
})

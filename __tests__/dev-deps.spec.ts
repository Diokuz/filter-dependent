import path from 'path'
// @ts-ignore
import { filterDependentSync } from '../index.ts'

function mf(fns: string[]) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Dev dependencies', () => {
  it('Must not fail when dev dependency of a file in node_modules is absent', () => {
    const sources = mf(['absent-dev-deps/a.js'])

    expect(() => filterDependentSync(sources, [])).not.toThrow()
  })
})

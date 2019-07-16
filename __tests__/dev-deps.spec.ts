import path from 'path'
import filterDependent from '../index'

function mf(fns: string[]) {
  return fns.map(f => path.resolve(process.cwd(), '__tests__', '__fixtures__', f))
}

describe('Dev dependencies', () => {
  it('Must not fail when dev dependency of a file in node_modules is absent', () => {
    const sources = mf(['absent-dev-deps/node_modules/qwe/index.js'])

    expect(() => filterDependent(sources, [])).not.toThrow()
  })
})

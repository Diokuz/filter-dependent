/*
 * Атеншен!
 * Этот пакет, на данный момент, работат весьма неоптимально, но всё же быстро.
 * Что можно ускорить:
 * 1. Строить дерево зависимостей не на каждый файл, а сразу на все
 * 2. Завершать traverse дерева в тот момент, когда мы уткнулись в один из targetFiles
 * 3. Переписать всё на компилируемый язык программирования
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const dependencyTree = require('dependency-tree')
const precinct = require('precinct')
const cabinet = require('filing-cabinet')
// require('./1.js')

const debug = require('debug')

const log = debug('fd')
const depslog = debug('fd:deps')
const tlog = debug('fd:traverse')

const core = new Set(['fs', 'path', 'http', 'child_process', 'util'])

/*
 * Takes two array of files, and returns filtered version of the first one.
 * Filter condition is simple: leave a file if it dependent on any of the files from the second list.
 *
 * @example:
 * a.js: require('./b')
 * b.ts: import './c'
 * c.ts: // no imports
 * d.js: require('./c')
 * filterDependent(['a.js', 'd.js'], ['b.ts'])
 *  –> ['a.js']
 */
function filterDependent(sourceFiles, targetFiles) {
  const map = new Map()
  const tree = {}

  // resolving abs and symlinks
  const sources = sourceFiles.map((f) => fs.realpathSync(path.resolve(f)))
  const targets = targetFiles.map((f) => fs.realpathSync(path.resolve(f)))
  const tset = new Set(targets)

  const result = sources.filter(s => {
    tree[s] = Object.create(null)
    return hasSomeTransitiveDeps(s, tset, tree[s], map)
  })

  console.log(tree)
  return result
}

/*
 * Traversing a filename's dependencies and append them to the `subtree` and `map`.
 * Traverse process is limited by `deadends` – every file in it is a deadend.
 * If deadend is reached, `true` is returned, `false` otherwise.
 */
function hasSomeTransitiveDeps(filename, deadends, subtree, map) {
  tlog(`Start of process "${filename}"`, subtree)

  if (deadends.has(filename)) {
    tlog(`Deadend reached, returning true`)

    return true
  }

  if (map.has(filename)) {
    tlog(`Already processed, returning false`)

    return false
  }

  map.set(filename, subtree)

  const deps = getDeps(filename)
  const result = deps.some(dep => {
    const fnode = map.has(dep) ? map.get(dep) : Object.create(null)

    subtree[dep] = fnode

    return hasSomeTransitiveDeps(dep, deadends, subtree[dep], map)
  })

  tlog(`End of process "${filename}"`)

  return result
}

function getDeps(filename) {
  depslog(`Processing "${filename}"`)

  const dependencies = precinct.paperwork(filename)

  depslog(`Extracted dependencies are`, dependencies)

  const resolved = dependencies
    .filter(dep => !core.has(dep) && !dep.endsWith('.css'))
    .map(dep => {
      const result = cabinet({
        partial: dep,
        filename,
        directory: path.dirname(filename),
        tsConfig: path.resolve(__dirname, '../../tsconfig.json')
      })

      return fs.realpathSync(result)
    })
    .filter(dep => {
      return dep.indexOf('node_modules') === -1
        && fs.existsSync(dep)
        && fs.lstatSync(dep).isFile()
    })

  depslog(`Resolved dependencies are`, resolved)

  return resolved
}

// setTimeout(() => {

// }, 2000)

const result = filterDependent([
  './tests/cases/tree/ab.js',
  './tests/cases/tree/ac.js',
], [
  './tests/cases/tree/a.js',
  './tests/cases/tree/acc.js',
])
console.log('result', result)

module.exports = filterDependent

import fs from 'fs'
import path from 'path'
import precinct from 'precinct'
import resolve from 'resolve'

import debug from 'debug'

// const log = debug('fd')
const depslog = debug('fd:deps')
const tlog = debug('fd:traverse')

const core = new Set(require('module').builtinModules)

type Filename = string

type Tree = {
  parents?: Set<Tree>
  children: Record<Filename, Tree>
  value: Filename
}

type OnMiss = (filename: Filename, missingDep: string) => any

type Options = {
  tsConfig?: Filename
  extensions?: string[]
  onMiss?: OnMiss
}

type InnerOptions = {
  extensions: {
    set: Set<string>
    array: string[]
  }
  onMiss?: OnMiss
}

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
function filterDependent(sourceFiles: string[], targetFiles: string[], options: Options = {}): string[] {
  const map = new Map()
  const rootNode = Object.create(null)

  // resolving abs and symlinks
  const sourcesArg = sourceFiles
    .map((f: string) => fs.realpathSync(path.resolve(f)))
    .filter((f: string) => f.indexOf('node_modules') === -1)
  // dedupe
  const sources = Array.from(new Set(sourcesArg))
  const targets = targetFiles.map((f: string) => fs.realpathSync(path.resolve(f)))
  const deadends = new Set(targets)
  const exts = options.extensions || ['.js', '.jsx', '.ts', '.tsx']
  const innerOptions: InnerOptions = {
    onMiss: options.onMiss,
    extensions: {
      set: new Set(exts),
      array: exts,
    },
  }

  const result = sources.filter((s: Filename) => {
    const fnode = {
      // parents: never, // no link to the pseodu tree's root
      children: Object.create(null),
      value: s,
    }

    rootNode[s] = fnode

    return hasSomeTransitiveDeps(s, deadends, fnode, map, innerOptions)
  })

  return result
}

function markParentsAsDeadends(subtree: Tree, deadends: Set<Filename>): void {
  if (!subtree) {
    console.trace()
  }
  if (typeof subtree.parents === 'undefined') {
    return
  }

  for (let parent of subtree.parents) {
    // If parent already a deadend, there is no point to check grandparents
    if (!deadends.has(parent.value)) {
      deadends.add(parent.value)
      markParentsAsDeadends(parent, deadends)
    }
  }
}

/*
 * Traversing a filename's dependencies and append them to the `subtree` and `map`.
 * Traverse process is limited by `deadends` – every file in it is a deadend.
 * If deadend is reached, `true` is returned, `false` otherwise.
 */
function hasSomeTransitiveDeps(
  filename: Filename,
  deadends: Set<Filename>,
  subtree: Tree,
  map: Map<Filename, Tree>,
  options: InnerOptions
) {
  tlog(`Start of process "${filename}"`, subtree)

  if (deadends.has(filename)) {
    markParentsAsDeadends(subtree, deadends)

    tlog(`Deadend reached, returning true`)

    return true
  }

  // map.set for any filename must be called only after this if
  if (map.has(filename)) {
    tlog(`Already processed, returning`)

    return deadends.has(filename)
  }

  map.set(filename, subtree)

  const deps = getDeps(filename, options)
  const result = deps.some((dep: Filename) => {
    const parentnode = subtree
    const fnode: Tree = map.has(dep)
      ? (map.get(dep) as Tree)
      : {
          parents: new Set(),
          children: Object.create(null),
          value: dep,
        }

    if (typeof fnode.parents !== 'undefined') {
      fnode.parents.add(parentnode)
    }
    parentnode.children[dep] = fnode

    return hasSomeTransitiveDeps(dep, deadends, fnode, map, options)
  })

  tlog(`End of process "${filename}"`)

  return result
}

function getDeps(filename: Filename, options: InnerOptions): Filename[] {
  depslog(`Processing "${filename}"`)

  const dependencies: string[] = precinct.paperwork(filename)

  depslog(`Extracted dependencies are`, dependencies)

  const filteredExt = dependencies.filter((dep: string) => !core.has(dep) && !dep.endsWith('.css'))

  depslog(`filtered by ext dependencies are`, filteredExt)

  const resolvedDeps = filteredExt.map((dep: Filename): Filename | null => {
    try {
      const result = resolve.sync(dep, {
        basedir: path.dirname(filename),
        extensions: options.extensions.array,
      })

      return fs.realpathSync(result)
    } catch (e) {
      depslog(`!!!`)
      if (options.onMiss) {
        options.onMiss(filename, dep)
      } else {
        throw new Error(`Cannot resolve "${dep}" from:\n"${filename}"`)
      }
    }

    return null
  })

  depslog(`Resolved dependencies are`, resolvedDeps)

  const finalDeps = resolvedDeps.filter((dep: Filename | null) => {
    return dep !== null && dep.indexOf('node_modules') === -1 && fs.existsSync(dep) && fs.lstatSync(dep).isFile()
  })

  depslog(`Returning dependencies are`, finalDeps)

  return finalDeps as Filename[]
}

export default filterDependent

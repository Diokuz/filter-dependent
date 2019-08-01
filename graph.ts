/**
 * Graph
 */

import fs from 'fs'
import path from 'path'
import util from 'util'
import resolve from 'resolve'
import precinct from 'precinct'
import debug from 'debug'
import { Options } from '.'

type Fn = string
type NodeId = Fn // absolute filename

interface Node {
  deps: NodeId[]
  parents: NodeId[]
}

export type Graph = Map<string, Node>

const COREM = new Set(require('module').builtinModules)
const EXTS = ['.js', '.jsx', '.ts', '.tsx']

const log = debug('fd:graph')
const tlog = debug('fd:graph:traverse')
const dlog = debug('fd:graph:deps')

let resolveTime = BigInt(0)
let cacheResolveTime = BigInt(0)
let getDepsTime = BigInt(0)
let realpathTime = BigInt(0)

/**
 * Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync
 */

/**
 * Creates a graph of all dependencies of sourceFiles
 * @param sourceFiles filenames – starting nodes for graph
 * @param options { onMiss } – callback for unresolved files
 */
export function collectGraphSync(sourceFiles: string[], options: Options = {}): { graph: Graph; timings: any } {
  log(`got sourceFiles`, sourceFiles)
  resolveTime = BigInt(0)
  cacheResolveTime = BigInt(0)
  getDepsTime = BigInt(0)
  realpathTime = BigInt(0)

  const graph = new Map<string, Node>()
  const sourcesArg = sourceFiles.map((f: Fn) => fs.realpathSync(path.resolve(f)))
  // dedupe
  const sources = Array.from(new Set(sourcesArg))
  let result = sources

  if (options.filter) {
    result = sources.filter(options.filter)
  }

  if (result.length !== sources.length) {
    console.warn(`Some sourceFiles filtered out!`)
  }

  log(`running buid graph with`, result)

  return buildGraphSync(result, graph, options)
}

function buildGraphSync(sources: Fn[], graph: Graph, options: Options, parent?: Fn): { graph: Graph; timings: any } {
  sources.forEach((fn: Fn) => {
    log(`processing "${fn}"`)

    // If file already visited, just add new `parent`
    // (`parent` is always new here, for given `fn`)
    if (graph.has(fn)) {
      log(`already processed, returning "${fn}"`)

      if (parent) {
        // @ts-ignore
        graph.get(fn).parents.push(parent)
      }

      return
    }

    const tx = process.hrtime.bigint()
    let deps = getDepsSync(fn, options)
    getDepsTime += process.hrtime.bigint() - tx

    if (options.filter) {
      deps = deps.filter(options.filter)
    }

    log(`deps:`, deps)

    const node = {
      deps,
      parents: parent == null ? [] : [parent],
    }

    graph.set(fn, node)

    buildGraphSync(deps, graph, options, fn)
  })

  const timings = {
    resolveTime,
    cacheResolveTime,
    getDepsTime,
    realpathTime,
  }

  return { graph, timings }
}

function getDepsSync(fn: Fn, options: any): Fn[] {
  log(`getting deps for "${fn}"`)
  const imports: string[] = precinct.paperwork(fn).filter((dep: string) => !COREM.has(dep))
  log(`imports`, imports)

  const resolvedDeps = imports.map((dep: Fn): Fn | null => {
    try {
      const tx = process.hrtime.bigint()
      const result = cacheResolveSync(dep, {
        basedir: path.dirname(fn),
        extensions: EXTS,
      })
      cacheResolveTime += process.hrtime.bigint() - tx

      const ty = process.hrtime.bigint()
      const ret = fs.realpathSync(result)
      realpathTime += process.hrtime.bigint() - ty

      return ret
    } catch (e) {
      log(`failed to resolve "${dep}"`)
      if (options.onMiss) {
        options.onMiss(fn, dep)
      } else {
        throw new Error(`Cannot resolve "${dep}" from:\n"${fn}"`)
      }
    }

    return null
  })

  log(`resolvedDeps`, resolvedDeps)

  const finalDeps = resolvedDeps.filter((dep: Fn | null) => {
    return dep !== null && fs.existsSync(dep) && fs.lstatSync(dep).isFile()
  }) as Fn[]

  log(`finalDeps`, finalDeps)

  return finalDeps
}

const cache: Record<string, { resolved: string; resolvedRealPath: string }> = {}

const presolve = util.promisify(resolve)

function populateCache(dep: string, basedir: string, resolved: Fn, resolvedRealPath: Fn) {
  // Preventive caching
  // dep:      'react'
  // fn:       '/project/src/utils/qwe.js'
  // resolved: '/project/node_modules/react/index.js'
  // key:      '/project/src/utils/>>>react'
  // key2:     '/project/src/>>>react'
  // key3:     '/project/>>>react'

  if (dep[0] !== '.' && dep[0] !== '/') {
    let base = basedir
    let resolvedBase = resolved.slice(0, resolved.indexOf('/node_modules'))

    while (base.length >= resolvedBase.length) {
      let kkey = base + '>>>' + dep

      if (!cache[kkey]) {
        cache[kkey] = {
          resolved,
          resolvedRealPath,
        }
      }

      base = base.slice(0, base.lastIndexOf('/'))
    }
  } else {
    cache[basedir + '>>>' + dep] = {
      resolved,
      resolvedRealPath,
    }
  }
}

function cacheResolveSync(dep: string, { basedir, extensions }: any): Fn {
  const key = basedir + '>>>' + dep
  let resolved
  let resolvedRealPath

  if (!cache[key]) {
    const tx = process.hrtime.bigint()
    resolved = resolve.sync(dep, {
      basedir,
      extensions,
    })
    resolveTime += process.hrtime.bigint() - tx

    const ty = process.hrtime.bigint()
    resolvedRealPath = fs.realpathSync(resolved)
    realpathTime += process.hrtime.bigint() - ty

    populateCache(dep, basedir, resolved, resolvedRealPath)
  }

  return cache[key].resolvedRealPath
}

/**
 * Async Async Async Async Async Async Async Async Async Async Async Async
 */

const fsp = {
  realpath: util.promisify(fs.realpath),
  exists: util.promisify(fs.exists),
  lstat: util.promisify(fs.lstat),
}

export async function collectGraph(
  sourceFiles: string[],
  options: Options = {}
): Promise<{ graph: Graph; timings: any }> {
  log(`start of collectGraph`)

  const graph = new Map<string, Node>()
  const sourcesArg = await Promise.all(sourceFiles.map(async (f: Fn) => fsp.realpath(path.resolve(f))))
  log(`sourcesArg`, sourcesArg)
  // dedupe
  const sources = Array.from(new Set(sourcesArg))

  log(`start of buildGraph`)

  return await buildGraph(sources, graph, options)
}

async function buildGraph(
  sources: Fn[],
  graph: Graph,
  options: Options,
  parent?: Fn
): Promise<{ graph: Graph; timings: any }> {
  await Promise.all(
    sources.map(async (fn: Fn) => {
      log(`processing "${fn}"`)

      // If file already visited, just add new `parent`
      // (`parent` is always new here, for given `fn`)
      if (graph.has(fn)) {
        log(`already processed, returning "${fn}"`)

        if (parent) {
          // @ts-ignore
          graph.get(fn).parents.push(parent)
        }

        return
      }

      let deps = await getDeps(fn, { onMiss: () => {} })

      if (options.filter) {
        deps = deps.filter(options.filter)
      }

      log(`deps for "${fn}"`, deps)

      const node = {
        deps,
        parents: parent == null ? [] : [parent],
      }

      graph.set(fn, node)

      await buildGraph(deps, graph, options, fn)
    })
  )

  const timings = {} // @todo how to get correct timings for async?

  return { graph, timings }
}

async function cacheResolve(dep: string, fn: Fn): Promise<Fn> {
  const basedir = path.dirname(fn)
  const key = basedir + '>>>' + dep
  let resolved
  let resolvedRealPath

  if (!cache[key]) {
    // @ts-ignore
    resolved = await presolve(dep, {
      basedir,
      extensions: EXTS,
    })

    resolvedRealPath = await fsp.realpath(resolved)

    populateCache(dep, basedir, resolved, resolvedRealPath)
  }

  return cache[key].resolvedRealPath
}

async function getDeps(fn: Fn, options: any): Promise<Fn[]> {
  dlog(`getting deps for "${fn}"`)
  const imports: string[] = precinct.paperwork(fn).filter((dep: string) => !COREM.has(dep))
  dlog(`imports`, imports)

  const resolvedDeps = await Promise.all(
    imports.map(
      async (dep: Fn): Promise<Fn | null> => {
        try {
          // @ts-ignore
          // const result = presolve.sync(dep, {
          //   basedir: path.dirname(fn),
          //   extensions: EXTS,
          // })
          // const retVal = fsp.realpath(result)

          const retVal = await cacheResolve(dep, fn)

          return retVal
        } catch (e) {
          dlog(`failed to resolve "${dep}"`)
          if (options.onMiss) {
            options.onMiss(fn, dep)
          } else {
            throw new Error(`Cannot resolve "${dep}" from:\n"${fn}"`)
          }
        }

        return null
      }
    )
  )

  dlog(`resolvedDeps`, resolvedDeps)

  const promisedDeps = await Promise.all(
    resolvedDeps.map(async (dep: Fn | null) => {
      if (dep == null) {
        return null
      }

      const isExist = await fsp.exists(dep)

      if (isExist) {
        const lstat = await fsp.lstat(dep)
        const isFile = lstat.isFile()

        if (isFile) {
          return dep
        }
      }

      return null
    })
  )
  const retDeps = promisedDeps.filter((dep) => typeof dep === 'string') as Fn[]

  dlog(`retDeps`, retDeps)

  return retDeps
}

/**
 * Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils
 */

export function findChild(fn: NodeId, graph: Graph, callback: (f: Fn) => boolean): NodeId | void {
  const visited = new Set()

  function _findChild(fn: NodeId, graph: Graph, callback: (f: Fn) => boolean): NodeId | void {
    tlog(`Traversing "${fn}"`)

    if (!graph.has(fn)) {
      throw new Error(`"${fn}" is not in graph`)
    }

    if (visited.has(fn)) {
      return
    }

    visited.add(fn)

    const result = callback(fn)

    if (result) {
      return fn
    }

    const { deps } = graph.get(fn) as Node

    tlog(`deps`, deps)

    const found = deps.find((dep: NodeId) => _findChild(dep, graph, callback))

    tlog(`found`, found)

    return found
  }

  return _findChild(fn, graph, callback)
}

export function traverseParents(fn: NodeId, graph: Graph, callback: (f: Fn) => void): void {
  const visited = new Set()

  function _traverseParents(fn: NodeId, graph: Graph, callback: (f: Fn) => void): void {
    if (!graph.has(fn)) {
      throw new Error(`"${fn}" is not in graph`)
    }

    if (visited.has(fn)) {
      return
    }

    visited.add(fn)
    callback(fn)

    const { parents } = graph.get(fn) as Node

    parents.forEach((p: NodeId) => _traverseParents(p, graph, callback))
  }

  _traverseParents(fn, graph, callback)
}

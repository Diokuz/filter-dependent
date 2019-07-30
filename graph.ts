import fs from 'fs'
import path from 'path'
import util from 'util'
import resolve from 'resolve'
import precinct from 'precinct'
import debug from 'debug'
import { OnMiss } from '.'

type Options = {
  onMiss?: OnMiss
}

type Fn = string
type NodeId = Fn // absolute filename

interface Node {
  deps: NodeId[]
  parents: NodeId[]
}

type Graph = Map<string, Node>

const COREM = new Set(require('module').builtinModules)
const EXTS = ['.js', '.jsx', '.ts', '.tsx']

const log = debug('fd:graph')
const dlog = debug('fd:graph:deps')

/**
 * Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync
 */

export function collectGraphSync(sourceFiles: string[], options: Options = {}): Graph {
  const graph = new Map<string, Node>()
  const sourcesArg = sourceFiles.map((f: Fn) => fs.realpathSync(path.resolve(f)))
  // dedupe
  const sources = Array.from(new Set(sourcesArg))

  return buildGraphSync(sources, graph, options)
}

function buildGraphSync(sources: Fn[], graph: Graph, options: Options, parent?: Fn): Graph {
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

    const deps = getDepsSync(fn, { onMiss: () => {} })

    log(`deps:`, deps)

    const node = {
      deps,
      parents: parent == null ? [] : [parent],
    }

    graph.set(fn, node)

    buildGraphSync(deps, graph, options, fn)
  })

  return graph
}

function getDepsSync(fn: Fn, options: any): Fn[] {
  log(`getting deps for "${fn}"`)
  const imports: string[] = precinct.paperwork(fn).filter((dep: string) => !COREM.has(dep))
  log(`imports`, imports)

  const resolvedDeps = imports.map((dep: Fn): Fn | null => {
    try {
      const result = resolve.sync(dep, {
        basedir: path.dirname(fn),
        extensions: EXTS,
      })

      return fs.realpathSync(result)
    } catch (e) {
      log(`failed to resolce "${dep}"`)
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

/**
 * Async Async Async Async Async Async Async Async Async Async Async Async
 */

const fsp = {
  realpath: util.promisify(fs.realpath),
  exists: util.promisify(fs.exists),
  lstat: util.promisify(fs.lstat),
}

const presolve = util.promisify(resolve)

export async function collectGraph(sourceFiles: string[], options: Options = {}): Promise<Graph> {
  const graph = new Map<string, Node>()
  const sourcesArg = await Promise.all(sourceFiles.map(async (f: Fn) => fsp.realpath(path.resolve(f))))
  // dedupe
  const sources = Array.from(new Set(sourcesArg))

  return await buildGraph(sources, graph, options)
}

async function buildGraph(sources: Fn[], graph: Graph, options: Options, parent?: Fn): Promise<Graph> {
  Promise.all(
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

      const deps = await getDeps(fn, { onMiss: () => {} })

      log(`deps for "${fn}"`, deps)

      const node = {
        deps,
        parents: parent == null ? [] : [parent],
      }

      graph.set(fn, node)

      await buildGraph(deps, graph, options, fn)
    })
  )

  return graph
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
          const result = await presolve(dep, {
            basedir: path.dirname(fn),
            extensions: EXTS,
          })

          return fsp.realpath(result)
        } catch (e) {
          dlog(`failed to resolce "${dep}"`)
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

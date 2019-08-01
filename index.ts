import fs from 'fs'
import path from 'path'
import debug from 'debug'

import { collectGraphSync, collectGraph, findChild, traverseParents } from './graph'

const log = debug('fd')
const tlog = debug('timings:fd')

export type OnMiss = (filename: string, missingDep: string) => any

export type Options = {
  extensions?: string[]
  onMiss?: OnMiss
  filter?: (f: string) => boolean
}

const DEFAULT_OPTIONS = {
  filter: (f: string) => f.indexOf('node_modules') === -1 && !f.endsWith('.css'),
}

function prepare(sourceFiles: string[], targetFiles: string[], optionsArg: Options = {}) {
  const options = { ...DEFAULT_OPTIONS, ...optionsArg }
  const sourcesArg = sourceFiles.map((f: string) => fs.realpathSync(path.resolve(f)))
  // dedupe
  const sources = Array.from(new Set(sourcesArg))
  const targets = targetFiles.map((f: string) => fs.realpathSync(path.resolve(f)))
  const deadends = new Set(targets)

  return { sources, deadends, options }
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
export function filterDependentSync(sourceFiles: string[], targetFiles: string[], optionsArg: Options = {}): string[] {
  const { options, sources, deadends } = prepare(sourceFiles, targetFiles, optionsArg)

  log(`collecting graph...`)
  const { graph, timings } = collectGraphSync(sources, options)
  log(`collected`, graph.keys())

  const ret = sources.filter((s) => {
    log(`s`, s)
    const closestDeadend = findChild(s, graph, (f: string) => deadends.has(f))

    log(`closestDeadend`, closestDeadend)

    if (typeof closestDeadend === 'string') {
      traverseParents(s, graph, (f) => deadends.add(f))

      return true
    }

    return false
  })

  tlog(timings)

  return ret
}

async function filterDependent(
  sourceFiles: string[],
  targetFiles: string[],
  optionsArg: Options = {}
): Promise<string[]> {
  const { options, sources, deadends } = prepare(sourceFiles, targetFiles, optionsArg)

  log(`collecting graph...`)
  const { graph, timings } = await collectGraph(sources, options)
  log(`collected`, graph.keys())

  const ret = sources.filter((s) => {
    log(`s`, s)
    const closestDeadend = findChild(s, graph, (f: string) => deadends.has(f))

    log(`closestDeadend`, closestDeadend)

    if (typeof closestDeadend === 'string') {
      traverseParents(s, graph, (f) => deadends.add(f))

      return true
    }

    return false
  })

  tlog(timings)

  return ret
}

export default filterDependent

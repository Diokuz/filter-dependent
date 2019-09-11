import fs from 'fs'
import resolve from 'resolve'
import { pathToUnixPath } from './utils'

const cache: Record<string, { resolved: string; resolvedRealPath: string }> = {}

let resolveTime = BigInt(0)
let realpathTime = BigInt(0)

function populateCache(dep: string, basedir: string, resolved: string, resolvedRealPath: string) {
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

function cacheResolveSync(dep: string, options: any): string {
  const { basedir } = options
  const key = basedir + '>>>' + dep
  let resolved
  let resolvedRealPath

  if (!cache[key]) {
    const tx = process.hrtime.bigint()
    resolved = pathToUnixPath(resolve.sync(dep, options))
    resolveTime += process.hrtime.bigint() - tx

    const ty = process.hrtime.bigint()
    resolvedRealPath = pathToUnixPath(fs.realpathSync(resolved))
    realpathTime += process.hrtime.bigint() - ty

    populateCache(dep, basedir, resolved, resolvedRealPath)
  }

  return cache[key].resolvedRealPath
}

cacheResolveSync.sync = cacheResolveSync

export default cacheResolveSync

export function getTimings() {
  return { resolveTime, realpathTime }
}

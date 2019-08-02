const path = require('path')
const { collectGraphSync } = require('../lib/graph')
const debug = require('debug')
const log = debug('timings')

const sources = [
  path.resolve(process.cwd(), '__tests__', '__fixtures__', 'extra', 'index.js')
]

log('collectGraphSync on 10000 (?) files...')
const { timings } = collectGraphSync(sources)
log('done')
log('resolveTime', Number(timings.resolveTime) / 1000 / 1000 / 1000)
log('cacheResolveTime', Number(timings.cacheResolveTime) / 1000 / 1000 / 1000)
log('getDepsTime', Number(timings.getDepsTime) / 1000 / 1000 / 1000)
log('realpathTime', Number(timings.realpathTime) / 1000 / 1000 / 1000)

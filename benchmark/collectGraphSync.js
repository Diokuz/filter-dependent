const path = require('path')
const { collectGraphSync } = require('../graph')
const debug = require('debug')
const log = debug('pipi')

const sources = [
  path.resolve(process.cwd(), '__tests__', '__fixtures__', 'big', 'index.js')
]

log('collectGraphSync on 1000 files...')
collectGraphSync(sources)
log('done')

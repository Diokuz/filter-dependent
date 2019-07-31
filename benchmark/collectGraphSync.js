const path = require('path')
const { collectGraphSync } = require('../graph')
const debug = require('debug')
const log = debug('pipi')

const sources = [
  path.resolve(process.cwd(), '__tests__', '__fixtures__', 'extra', 'index.js')
]

log('collectGraphSync on 10000 (?) files...')
collectGraphSync(sources)
log('done')

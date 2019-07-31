const path = require('path')
const { collectGraph } = require('../graph')
const debug = require('debug')
const log = debug('pipi')

const sources = [
  path.resolve(process.cwd(), '__tests__', '__fixtures__', 'extra', 'index.js')
]

async function run() {
  log('collectGraph on 10000 (?) files...')
  await collectGraph(sources)
  log('done')
}

run().then(() => {
  log('done')
})

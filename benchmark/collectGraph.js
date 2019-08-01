const path = require('path')
const { collectGraph } = require('../graph')
const debug = require('debug')
const log = debug('timings')

const sources = [
  path.resolve(process.cwd(), '__tests__', '__fixtures__', 'extra', 'index.js')
]

async function run() {
  log('collectGraph on 10000 (?) files...')
  const { timings } = await collectGraph(sources)
  log(timings)
  log('done')
}

run().then(() => {
  log('exiting')
})

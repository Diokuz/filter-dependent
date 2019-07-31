const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const base = path.resolve(process.cwd(), '__tests__', '__fixtures__', 'extra')
const imports = `
import './0'
import './1'
import './2'
import './3'
import './4'
import './5'
import './6'
import './7'
import './8'
import './9'
`
const code = imports + fs.readFileSync(path.resolve(__dirname, './code.js.template'), 'utf8')

write([], 4)

function write(slugs, depth) {
  const data = slugs.length < depth ? code : ''
  const dir = path.resolve(base, ...slugs)
  const index = path.resolve(dir, 'index.js')

  fse.ensureDirSync(dir)
  fs.writeFileSync(index, data)

  if (slugs.length < depth) {
    for (let i = 0; i < 10; i++) {
      write([...slugs, String(i)], depth)
    }
  }
}

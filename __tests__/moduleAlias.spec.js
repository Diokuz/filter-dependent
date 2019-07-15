const path = require('path');
const filterDependent = require('../index.ts');

const resolvePath = files => files.map(f => path.resolve(__dirname, '__fixtures__/module-directory', f));

describe('Module alias', () => {
  it('Should not fail when has moduleDirectory option', () => {
    expect(
      filterDependent(
        resolvePath(['b.js']),
        resolvePath(['a.js']),
        {
          moduleDirectory: path.resolve(__dirname, '__fixtures__')
        }
      )
    ).toEqual(resolvePath(['b.js']));
  });
});

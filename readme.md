Filters a list of files, leaving only those which transitively dependent on any of the files from the second list

## Features

1. Supports js, jsx, ts, tsx.
1. Fast.
2. Resolves all symlinks to real filenames.
3. Skip node_modules.

## Example

Lets say we have four files:

1. `a.js` depends on `b.js` and `c.js`
2. `b.js` depends on `d.js`

Then:

```js
import filterDependent from 'filter-dependent'

const filteredFiles = filterDependent([
    './a.js',
    './b.js',
    './c.js',
    './d.js',
], [
    'a.js',
    'c.js',
])

// → ['/abs/path/to/a.js', '/abs/path/to/b.js', '/abs/path/to/c.js']
// because `d.js` does not depend on `c.js` nor `a.js`
```

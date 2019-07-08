Filters a list of files, leaving only those which transitively dependent on any of the files from the second list.

## Why this package was written?

Because I can! But also, because I failed to find anything like that, except `jest-resolve-dependencies`, which is not exactly what I need, and also have not very good algorithmic complexity (btw mine is _O(n)_, where _n_ is a number of nodes in a dependency graph fragment between sources and targers).

## What problem it solves?

Similiar to [changedSince](https://jestjs.io/docs/en/cli#changedsince) – it allows you to find all files dependent from other files. And, therefore, skip other files.

For example, you can:

1. Find all test files, which affected by git changeset, and should be running.
2. Find all affected .stories.js files to build storybook only with affected components.

By doing that, you skip non-affected files and speed up your CI/build.

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

## API

```js
import filterDependent from 'filter-dependent'

const filteredFiles = filterDependent(sources, targets, options)
```

Where

`sources` – an array of file paths to be filtered.
`targets` – an array of file paths to be used for filtering out sources.
`options.extensions` – an array of strings, default `['.js', '.jsx', '.ts', '.tsx']`, for resolving dependencies

> note: `filter-dependent` fails when any of dependency is not resolved.

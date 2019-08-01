## 2.2.0

- Add _externals_ option to skip traversing some imports

## 2.1.0

- Add cache for `resolve` – speed up sync resolve version 2x

## 2.0.0

- breaking: add `async filterDependent` as default export
- add `filterDependentSync` as named export
- add benckmark (see Makefile)
- refactor to two stages: 1) build graph 2) traverse it

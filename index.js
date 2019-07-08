const fs = require('fs');
const path = require('path');
const precinct = require('precinct');
const resolve = require('resolve');
const debug = require('debug');
const log = debug('fd');
const depslog = debug('fd:deps');
const tlog = debug('fd:traverse');
const core = new Set(['fs', 'path', 'url', 'http', 'child_process', 'util']);
/*
 * Takes two array of files, and returns filtered version of the first one.
 * Filter condition is simple: leave a file if it dependent on any of the files from the second list.
 *
 * @example:
 * a.js: require('./b')
 * b.ts: import './c'
 * c.ts: // no imports
 * d.js: require('./c')
 * filterDependent(['a.js', 'd.js'], ['b.ts'])
 *  –> ['a.js']
 */
function filterDependent(sourceFiles, targetFiles, options = {}) {
    const map = new Map();
    const rootNode = Object.create(null);
    // resolving abs and symlinks
    const sources = sourceFiles.map((f) => fs.realpathSync(path.resolve(f)));
    const targets = targetFiles.map((f) => fs.realpathSync(path.resolve(f)));
    const deadends = new Set(targets);
    const result = sources.filter((s) => {
        const fnode = {
            // parents: never, // no link to the pseodu tree's root
            children: Object.create(null),
            value: s,
        };
        rootNode[s] = fnode;
        return hasSomeTransitiveDeps(s, deadends, fnode, map, options);
    });
    return result;
}
function markParentsAsDeadends(subtree, deadends) {
    if (!subtree) {
        console.trace();
    }
    if (typeof subtree.parents === 'undefined') {
        return;
    }
    for (let parent of subtree.parents) {
        deadends.add(parent.value);
        markParentsAsDeadends(parent, deadends);
    }
}
/*
 * Traversing a filename's dependencies and append them to the `subtree` and `map`.
 * Traverse process is limited by `deadends` – every file in it is a deadend.
 * If deadend is reached, `true` is returned, `false` otherwise.
 */
function hasSomeTransitiveDeps(filename, deadends, subtree, map, options) {
    tlog(`Start of process "${filename}"`, subtree);
    if (deadends.has(filename)) {
        markParentsAsDeadends(subtree, deadends);
        tlog(`Deadend reached, returning true`);
        return true;
    }
    // map.set for any filename must be called only after this if
    if (map.has(filename)) {
        tlog(`Already processed, returning`);
        return deadends.has(filename);
    }
    map.set(filename, subtree);
    const deps = getDeps(filename, options);
    const result = deps.some((dep) => {
        const parentnode = subtree;
        const fnode = map.has(dep)
            ? map.get(dep)
            : {
                parents: new Set(),
                children: Object.create(null),
                value: dep,
            };
        if (typeof fnode.parents !== 'undefined') {
            fnode.parents.add(parentnode);
        }
        parentnode.children[dep] = fnode;
        return hasSomeTransitiveDeps(dep, deadends, fnode, map, options);
    });
    tlog(`End of process "${filename}"`);
    return result;
}
function getDeps(filename, options) {
    depslog(`Processing "${filename}"`);
    const dependencies = precinct.paperwork(filename);
    depslog(`Extracted dependencies are`, dependencies);
    const resolved = dependencies
        .filter((dep) => !core.has(dep) && !dep.endsWith('.css'))
        .map((dep) => {
        const result = resolve.sync(dep, {
            basedir: path.dirname(filename),
            extensions: options.extensions || ['.js', '.jsx', '.ts', '.tsx'],
        });
        if (!result) {
            throw new Error(`Cannot resolve "${dep}" from:\n"${filename}"`);
        }
        return fs.realpathSync(result);
    })
        .filter((dep) => {
        return dep.indexOf('node_modules') === -1 && fs.existsSync(dep) && fs.lstatSync(dep).isFile();
    });
    depslog(`Resolved dependencies are`, resolved);
    return resolved;
}
module.exports = filterDependent;
//# sourceMappingURL=index.js.map
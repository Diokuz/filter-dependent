/*
 * Атеншен!
 * Этот пакет, на данный момент, работат весьма неоптимально, но всё же быстро.
 * Что можно ускорить:
 * 1. Строить дерево зависимостей не на каждый файл, а сразу на все
 * 2. Завершать traverse дерева в тот момент, когда мы уткнулись в один из targetFiles
 * 3. Переписать всё на компилируемый язык программирования
 */
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var fs = require("fs");
var path = require("path");
var execSync = require("child_process").execSync;
var precinct = require("precinct");
var cabinet = require("filing-cabinet");
var debug = require("debug");
var log = debug("fd");
var depslog = debug("fd:deps");
var tlog = debug("fd:traverse");
var core = new Set(["fs", "path", "http", "child_process", "util"]);
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
function filterDependent(sourceFiles, targetFiles, options) {
    if (options === void 0) { options = {}; }
    var map = new Map();
    var rootNode = Object.create(null);
    // resolving abs and symlinks
    var sources = sourceFiles.map(function (f) {
        return fs.realpathSync(path.resolve(f));
    });
    var targets = targetFiles.map(function (f) {
        return fs.realpathSync(path.resolve(f));
    });
    var deadends = new Set(targets);
    var result = sources.filter(function (s) {
        var fnode = {
            // parents: never, // no link to the pseodu tree's root
            children: Object.create(null),
            value: s
        };
        rootNode[s] = fnode;
        return hasSomeTransitiveDeps(s, deadends, fnode, map, options);
    });
    return result;
}
function markParentsAsDeadends(subtree, deadends) {
    var e_1, _a;
    if (!subtree) {
        console.trace();
    }
    if (typeof subtree.parents === "undefined") {
        return;
    }
    try {
        for (var _b = __values(subtree.parents), _c = _b.next(); !_c.done; _c = _b.next()) {
            var parent_1 = _c.value;
            deadends.add(parent_1.value);
            markParentsAsDeadends(parent_1, deadends);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
/*
 * Traversing a filename's dependencies and append them to the `subtree` and `map`.
 * Traverse process is limited by `deadends` – every file in it is a deadend.
 * If deadend is reached, `true` is returned, `false` otherwise.
 */
function hasSomeTransitiveDeps(filename, deadends, subtree, map, options) {
    tlog("Start of process \"" + filename + "\"", subtree);
    if (deadends.has(filename)) {
        markParentsAsDeadends(subtree, deadends);
        tlog("Deadend reached, returning true");
        return true;
    }
    // map.set for any filename must be called only after this if
    if (map.has(filename)) {
        tlog("Already processed, returning");
        return deadends.has(filename);
    }
    map.set(filename, subtree);
    var deps = getDeps(filename, options);
    var result = deps.some(function (dep) {
        var parentnode = subtree;
        var fnode = map.has(dep)
            ? map.get(dep)
            : {
                parents: new Set(),
                children: Object.create(null),
                value: dep
            };
        if (typeof fnode.parents !== "undefined") {
            fnode.parents.add(parentnode);
        }
        parentnode.children[dep] = fnode;
        return hasSomeTransitiveDeps(dep, deadends, fnode, map, options);
    });
    tlog("End of process \"" + filename + "\"");
    return result;
}
function getDeps(filename, options) {
    depslog("Processing \"" + filename + "\"");
    var dependencies = precinct.paperwork(filename);
    depslog("Extracted dependencies are", dependencies);
    var resolved = dependencies
        .filter(function (dep) { return !core.has(dep) && !dep.endsWith(".css"); })
        .map(function (dep) {
        var result = cabinet({
            partial: dep,
            filename: filename,
            directory: path.dirname(filename),
            tsConfig: options.tsConfig
        });
        if (!result) {
            throw new Error("Cannot resolve \"" + dep + "\"");
        }
        return fs.realpathSync(result);
    })
        .filter(function (dep) {
        return (dep.indexOf("node_modules") === -1 &&
            fs.existsSync(dep) &&
            fs.lstatSync(dep).isFile());
    });
    depslog("Resolved dependencies are", resolved);
    return resolved;
}
// setTimeout(() => {
// }, 2000)
// const result = filterDependent([
//   './tests/cases/tree/ab.js',
//   './tests/cases/tree/ac.js',
// ], [
//   './tests/cases/tree/a.js',
//   './tests/cases/tree/acc.js',
// ])
// console.log('result', result)
module.exports = filterDependent;
//# sourceMappingURL=index.js.map
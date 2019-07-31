"use strict";
/**
 * Graph
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const resolve_1 = __importDefault(require("resolve"));
const precinct_1 = __importDefault(require("precinct"));
const debug_1 = __importDefault(require("debug"));
const COREM = new Set(require('module').builtinModules);
const EXTS = ['.js', '.jsx', '.ts', '.tsx'];
const log = debug_1.default('fd:graph');
const tlog = debug_1.default('fd:graph:traverse');
const dlog = debug_1.default('fd:graph:deps');
/**
 * Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync
 */
/**
 * Creates a graph of all dependencies of sourceFiles
 * @param sourceFiles filenames – starting nodes for graph
 * @param options { onMiss } – callback for unresolved files
 */
function collectGraphSync(sourceFiles, options = {}) {
    log(`got sourceFiles`, sourceFiles);
    const graph = new Map();
    const sourcesArg = sourceFiles.map((f) => fs_1.default.realpathSync(path_1.default.resolve(f)));
    // dedupe
    const sources = Array.from(new Set(sourcesArg));
    let result = sources;
    if (options.filter) {
        result = sources.filter(options.filter);
    }
    if (result.length !== sources.length) {
        console.warn(`Some sourceFiles filtered out!`);
    }
    log(`running buid graph with`, result);
    return buildGraphSync(result, graph, options);
}
exports.collectGraphSync = collectGraphSync;
function buildGraphSync(sources, graph, options, parent) {
    sources.forEach((fn) => {
        log(`processing "${fn}"`);
        // If file already visited, just add new `parent`
        // (`parent` is always new here, for given `fn`)
        if (graph.has(fn)) {
            log(`already processed, returning "${fn}"`);
            if (parent) {
                // @ts-ignore
                graph.get(fn).parents.push(parent);
            }
            return;
        }
        let deps = getDepsSync(fn, options);
        if (options.filter) {
            deps = deps.filter(options.filter);
        }
        log(`deps:`, deps);
        const node = {
            deps,
            parents: parent == null ? [] : [parent],
        };
        graph.set(fn, node);
        buildGraphSync(deps, graph, options, fn);
    });
    return graph;
}
function getDepsSync(fn, options) {
    log(`getting deps for "${fn}"`);
    const imports = precinct_1.default.paperwork(fn).filter((dep) => !COREM.has(dep));
    log(`imports`, imports);
    const resolvedDeps = imports.map((dep) => {
        try {
            const result = resolve_1.default.sync(dep, {
                basedir: path_1.default.dirname(fn),
                extensions: EXTS,
            });
            return fs_1.default.realpathSync(result);
        }
        catch (e) {
            log(`failed to resolve "${dep}"`);
            if (options.onMiss) {
                options.onMiss(fn, dep);
            }
            else {
                throw new Error(`Cannot resolve "${dep}" from:\n"${fn}"`);
            }
        }
        return null;
    });
    log(`resolvedDeps`, resolvedDeps);
    const finalDeps = resolvedDeps.filter((dep) => {
        return dep !== null && fs_1.default.existsSync(dep) && fs_1.default.lstatSync(dep).isFile();
    });
    log(`finalDeps`, finalDeps);
    return finalDeps;
}
/**
 * Async Async Async Async Async Async Async Async Async Async Async Async
 */
const fsp = {
    realpath: util_1.default.promisify(fs_1.default.realpath),
    exists: util_1.default.promisify(fs_1.default.exists),
    lstat: util_1.default.promisify(fs_1.default.lstat),
};
const presolve = util_1.default.promisify(resolve_1.default);
function collectGraph(sourceFiles, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        log(`start of collectGraph`);
        const graph = new Map();
        const sourcesArg = yield Promise.all(sourceFiles.map((f) => __awaiter(this, void 0, void 0, function* () { return fsp.realpath(path_1.default.resolve(f)); })));
        log(`sourcesArg`, sourcesArg);
        // dedupe
        const sources = Array.from(new Set(sourcesArg));
        log(`start of buildGraph`);
        return yield buildGraph(sources, graph, options);
    });
}
exports.collectGraph = collectGraph;
function buildGraph(sources, graph, options, parent) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(sources.map((fn) => __awaiter(this, void 0, void 0, function* () {
            log(`processing "${fn}"`);
            // If file already visited, just add new `parent`
            // (`parent` is always new here, for given `fn`)
            if (graph.has(fn)) {
                log(`already processed, returning "${fn}"`);
                if (parent) {
                    // @ts-ignore
                    graph.get(fn).parents.push(parent);
                }
                return;
            }
            let deps = yield getDeps(fn, { onMiss: () => { } });
            if (options.filter) {
                deps = deps.filter(options.filter);
            }
            log(`deps for "${fn}"`, deps);
            const node = {
                deps,
                parents: parent == null ? [] : [parent],
            };
            graph.set(fn, node);
            yield buildGraph(deps, graph, options, fn);
        })));
        return graph;
    });
}
function getDeps(fn, options) {
    return __awaiter(this, void 0, void 0, function* () {
        dlog(`getting deps for "${fn}"`);
        const imports = precinct_1.default.paperwork(fn).filter((dep) => !COREM.has(dep));
        dlog(`imports`, imports);
        const resolvedDeps = yield Promise.all(imports.map((dep) => __awaiter(this, void 0, void 0, function* () {
            try {
                // @ts-ignore
                const result = yield presolve(dep, {
                    basedir: path_1.default.dirname(fn),
                    extensions: EXTS,
                });
                return fsp.realpath(result);
            }
            catch (e) {
                dlog(`failed to resolce "${dep}"`);
                if (options.onMiss) {
                    options.onMiss(fn, dep);
                }
                else {
                    throw new Error(`Cannot resolve "${dep}" from:\n"${fn}"`);
                }
            }
            return null;
        })));
        dlog(`resolvedDeps`, resolvedDeps);
        const promisedDeps = yield Promise.all(resolvedDeps.map((dep) => __awaiter(this, void 0, void 0, function* () {
            if (dep == null) {
                return null;
            }
            const isExist = yield fsp.exists(dep);
            if (isExist) {
                const lstat = yield fsp.lstat(dep);
                const isFile = lstat.isFile();
                if (isFile) {
                    return dep;
                }
            }
            return null;
        })));
        const retDeps = promisedDeps.filter((dep) => typeof dep === 'string');
        dlog(`retDeps`, retDeps);
        return retDeps;
    });
}
/**
 * Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils
 */
function findChild(fn, graph, callback) {
    const visited = new Set();
    function _findChild(fn, graph, callback) {
        tlog(`Traversing "${fn}"`);
        if (!graph.has(fn)) {
            throw new Error(`"${fn}" is not in graph`);
        }
        if (visited.has(fn)) {
            return;
        }
        visited.add(fn);
        const result = callback(fn);
        if (result) {
            return fn;
        }
        const { deps } = graph.get(fn);
        tlog(`deps`, deps);
        const found = deps.find((dep) => _findChild(dep, graph, callback));
        tlog(`found`, found);
        return found;
    }
    return _findChild(fn, graph, callback);
}
exports.findChild = findChild;
function traverseParents(fn, graph, callback) {
    const visited = new Set();
    function _traverseParents(fn, graph, callback) {
        if (!graph.has(fn)) {
            throw new Error(`"${fn}" is not in graph`);
        }
        if (visited.has(fn)) {
            return;
        }
        visited.add(fn);
        callback(fn);
        const { parents } = graph.get(fn);
        parents.forEach((p) => _traverseParents(p, graph, callback));
    }
    _traverseParents(fn, graph, callback);
}
exports.traverseParents = traverseParents;

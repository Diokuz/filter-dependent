"use strict";
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
const dlog = debug_1.default('fd:graph:deps');
/**
 * Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync
 */
function collectGraphSync(sourceFiles, options = {}) {
    const graph = new Map();
    const sourcesArg = sourceFiles.map((f) => fs_1.default.realpathSync(path_1.default.resolve(f)));
    // dedupe
    const sources = Array.from(new Set(sourcesArg));
    return buildGraphSync(sources, graph, options);
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
        const deps = getDepsSync(fn, { onMiss: () => { } });
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
            log(`failed to resolce "${dep}"`);
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
        const graph = new Map();
        const sourcesArg = yield Promise.all(sourceFiles.map((f) => __awaiter(this, void 0, void 0, function* () { return fsp.realpath(path_1.default.resolve(f)); })));
        // dedupe
        const sources = Array.from(new Set(sourcesArg));
        return yield buildGraph(sources, graph, options);
    });
}
exports.collectGraph = collectGraph;
function buildGraph(sources, graph, options, parent) {
    return __awaiter(this, void 0, void 0, function* () {
        Promise.all(sources.map((fn) => __awaiter(this, void 0, void 0, function* () {
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
            const deps = yield getDeps(fn, { onMiss: () => { } });
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

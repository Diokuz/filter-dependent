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
const debug_1 = __importDefault(require("debug"));
const graph_1 = require("./graph");
const log = debug_1.default('fd');
const tlog = debug_1.default('timings:fd');
const DEFAULT_OPTIONS = {
    filter: (f) => f.indexOf('node_modules') === -1 && !f.endsWith('.css'),
};
function prepare(sourceFiles, targetFiles, optionsArg = {}) {
    const options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    const sourcesArg = sourceFiles.map((f) => fs_1.default.realpathSync(path_1.default.resolve(f)));
    // dedupe
    const sources = Array.from(new Set(sourcesArg));
    const targets = targetFiles.map((f) => fs_1.default.realpathSync(path_1.default.resolve(f)));
    const deadends = new Set(targets);
    return { sources, deadends, options };
}
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
function filterDependentSync(sourceFiles, targetFiles, optionsArg = {}) {
    const { options, sources, deadends } = prepare(sourceFiles, targetFiles, optionsArg);
    log(`collecting graph...`);
    const { graph, timings } = graph_1.collectGraphSync(sources, options);
    log(`collected`, graph.keys());
    const ret = sources.filter((s) => {
        log(`s`, s);
        const closestDeadend = graph_1.findChild(s, graph, (f) => deadends.has(f));
        log(`closestDeadend`, closestDeadend);
        if (typeof closestDeadend === 'string') {
            graph_1.traverseParents(s, graph, (f) => deadends.add(f));
            return true;
        }
        return false;
    });
    tlog(timings);
    return ret;
}
exports.filterDependentSync = filterDependentSync;
function filterDependent(sourceFiles, targetFiles, optionsArg = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { options, sources, deadends } = prepare(sourceFiles, targetFiles, optionsArg);
        log(`collecting graph...`);
        const { graph, timings } = yield graph_1.collectGraph(sources, options);
        log(`collected`, graph.keys());
        const ret = sources.filter((s) => {
            log(`s`, s);
            const closestDeadend = graph_1.findChild(s, graph, (f) => deadends.has(f));
            log(`closestDeadend`, closestDeadend);
            if (typeof closestDeadend === 'string') {
                graph_1.traverseParents(s, graph, (f) => deadends.add(f));
                return true;
            }
            return false;
        });
        tlog(timings);
        return ret;
    });
}
exports.default = filterDependent;

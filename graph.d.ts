/**
 * Graph
 */
import { Options } from '.';
declare type Fn = string;
declare type NodeId = Fn;
interface Node {
    deps: NodeId[];
    parents: NodeId[];
}
export declare type Graph = Map<string, Node>;
/**
 * Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync
 */
/**
 * Creates a graph of all dependencies of sourceFiles
 * @param sourceFiles filenames – starting nodes for graph
 * @param options { onMiss } – callback for unresolved files
 */
export declare function collectGraphSync(sourceFiles: string[], options?: Options): Graph;
export declare function collectGraph(sourceFiles: string[], options?: Options): Promise<Graph>;
/**
 * Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils Utils
 */
export declare function findChild(fn: NodeId, graph: Graph, callback: (f: Fn) => boolean): NodeId | void;
export declare function traverseParents(fn: NodeId, graph: Graph, callback: (f: Fn) => void): void;
export {};

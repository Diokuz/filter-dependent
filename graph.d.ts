import { OnMiss } from '.';
declare type Options = {
    onMiss?: OnMiss;
};
declare type Fn = string;
declare type NodeId = Fn;
interface Node {
    deps: NodeId[];
    parents: NodeId[];
}
declare type Graph = Map<string, Node>;
/**
 * Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync Sync
 */
export declare function collectGraphSync(sourceFiles: string[], options?: Options): Graph;
export declare function collectGraph(sourceFiles: string[], options?: Options): Promise<Graph>;
export {};

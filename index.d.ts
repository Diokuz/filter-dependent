declare const fs: any;
declare const path: any;
declare const precinct: any;
declare const resolve: any;
declare const debug: any;
declare const log: any;
declare const depslog: any;
declare const tlog: any;
declare const core: Set<unknown>;
declare type Filename = string;
declare type Tree = {
    parents?: Set<Tree>;
    children: Record<Filename, Tree>;
    value: Filename;
};
declare type Options = {
    tsConfig?: Filename;
    extensions?: string[];
};
declare function filterDependent(sourceFiles: string[], targetFiles: string[], options?: Options): string[];
declare function markParentsAsDeadends(subtree: Tree, deadends: Set<Filename>): void;
declare function hasSomeTransitiveDeps(filename: Filename, deadends: Set<Filename>, subtree: Tree, map: Map<Filename, Tree>, options: Options): boolean;
declare function getDeps(filename: Filename, options: Options): Filename[];

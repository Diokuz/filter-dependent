export declare type OnMiss = (filename: string, missingDep: string) => any;
export declare type Options = {
    extensions?: string[];
    onMiss?: OnMiss;
    filter?: (f: string) => boolean;
    externals?: string[];
    externalsSet?: Set<string>;
};
export declare type ROptions = {
    extensions: string[];
    onMiss: OnMiss;
    filter: (f: string) => boolean;
    externals: string[];
    externalsSet: Set<string>;
};
export declare function filterDependentSync(sourceFiles: string[], targetFiles: string[], optionsArg?: Options): string[];
declare function filterDependent(sourceFiles: string[], targetFiles: string[], optionsArg?: Options): Promise<string[]>;
export default filterDependent;

declare type Filename = string;
export declare type OnMiss = (filename: Filename, missingDep: string) => any;
declare type Options = {
    tsConfig?: Filename;
    extensions?: string[];
    onMiss?: OnMiss;
};
declare function filterDependent(sourceFiles: string[], targetFiles: string[], options?: Options): string[];
export default filterDependent;

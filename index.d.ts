declare type Filename = string;
declare type Options = {
    tsConfig?: Filename;
    extensions?: string[];
};
declare function filterDependent(sourceFiles: string[], targetFiles: string[], options?: Options): string[];
export default filterDependent;

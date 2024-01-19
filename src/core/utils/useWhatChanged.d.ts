/**
 * Exposes a function to help debug react hooks and their dependencies
 * @param hookId string An indentifier for the given hook
 * @param dependency unknown[] The dependency array
 * @param dependencyNames? string[] The depedency names for each dependency in the array (strictly for user readability)
 */
export declare const useWhatChanged: (hookId: string, dependency?: unknown[], dependencyNames?: string[]) => void;

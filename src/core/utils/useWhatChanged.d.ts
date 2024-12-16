/**
 * Exposes a function to help debug react hooks and their dependencies
 * @param {string} hookId - An indentifier for the given hook
 * @param {unknown[]} dependency - The dependency array
 * @param {string[]} dependencyNames? - The optional depedency names for each dependency in the array (strictly for user readability)
 */
export declare const useWhatChanged: (hookId: string, dependency?: unknown[], dependencyNames?: string[]) => void;
export declare const usePerformanceMonitor: (componentName: string) => void;

/**
 * Helper function to read a number in the local storage and if the
 * key can't be found or invalid, automatically set the value to the default value provided.
 * @param key string The key to search for
 * @param defaultValue number The default value to set in the local storage and return when not found or error
 * @returns number The value as number for the key in the local storage
 */
export declare const getItemAsNumberSetValue: (key: string, defaultValue: number) => number;

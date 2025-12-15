export declare abstract class LocalStorage {
    /**
     * Helper function to read a number in the local storage and if the
     * key can't be found or is invalid return the default value provided.
     * @param key {string} The key to search for
     * @param defaultValue {number} The default value when not found or error
     * @returns The value as number for the key in the local storage or the default value provided.
     */
    static getItemAsNumber(key: string, defaultValue?: number): number | undefined;
    /**
     * Helper function to read a number or an array of numbers in the local storage and if the
     * key can't be found or is invalid return the default value provided.
     * @param key {string} The key to search for
     * @param defaultValue {number | number[]} The default value when not found or error
     * @returns The value as number | number[] for the key in the local storage or the default value provided.
     */
    static getItemAsNumberOrNumberArray(key: string, defaultValue?: number | number[]): number | number[] | undefined;
    /**
     * Helper function to read a number in the local storage and if the
     * key can't be found or invalid, automatically set the value to the default value provided and return that value.
     * That way, it'll be stored in local storage for future use.
     * @param key {string} The key to search for
     * @param defaultValue {number} The default value to set in the local storage and return when not found or error
     * @returns The value as number for the key in the local storage
     */
    static getItemAsNumberSetValue(key: string, defaultValue: number): number;
    /**
     * Helper function to read a number or a list of numbers in the local storage and if the
     * key can't be found or invalid, automatically set the value to the default value provided and return that value.
     * That way, it'll be stored in local storage for future use.
     * @param key {string} The key to search for
     * @param defaultValue {number | number[]} The default value to set in the local storage and return when not found or error
     * @returns The value as number | number[] for the key in the local storage
     */
    static getItemAsNumberOrNumberArraySetValue(key: string, defaultValue: number | number[]): number | number[];
}
//# sourceMappingURL=localStorage.d.ts.map
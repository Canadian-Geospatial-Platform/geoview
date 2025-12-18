export abstract class LocalStorage {
  /**
   * Helper function to read a number in the local storage and if the
   * key can't be found or is invalid return the default value provided.
   * @param key {string} The key to search for
   * @param defaultValue {number} The default value when not found or error
   * @returns The value as number for the key in the local storage or the default value provided.
   */
  static getItemAsNumber(key: string, defaultValue?: number): number | undefined {
    try {
      // Read key in the local storage
      const levelValue = localStorage.getItem(key);

      // Read as number
      const levelValueNumber = Number(levelValue);

      // If set and valid: return it; else default will be returned
      if (levelValueNumber && !Number.isNaN(levelValueNumber)) return levelValueNumber;
    } catch {
      // Failed to read localStorage, eat the exception and continue to set the value to the default
    }

    // Not found, return default
    return defaultValue;
  }

  /**
   * Helper function to read a number or an array of numbers in the local storage and if the
   * key can't be found or is invalid return the default value provided.
   * @param key {string} The key to search for
   * @param defaultValue {number | number[]} The default value when not found or error
   * @returns The value as number | number[] for the key in the local storage or the default value provided.
   */
  static getItemAsNumberOrNumberArray(key: string, defaultValue?: number | number[]): number | number[] | undefined {
    try {
      // Read key in the local storage
      const levelValue = localStorage.getItem(key);

      // If the value contains ','
      if (levelValue?.includes(',')) {
        // Split and read the numbers
        return levelValue
          .split(',')
          .map((val) => Number(val.trim()))
          .filter((val) => !!val && !Number.isNaN(val));
      }

      // Read as number
      const levelValueNumber = Number(levelValue);

      // If set and valid: return it; else default will be returned
      if (levelValueNumber && !Number.isNaN(levelValueNumber)) return levelValueNumber;
    } catch {
      // Failed to read localStorage, eat the exception and continue to set the value to the default
    }

    // Not found, return default
    return defaultValue;
  }

  /**
   * Helper function to read a number in the local storage and if the
   * key can't be found or invalid, automatically set the value to the default value provided and return that value.
   * That way, it'll be stored in local storage for future use.
   * @param key {string} The key to search for
   * @param defaultValue {number} The default value to set in the local storage and return when not found or error
   * @returns The value as number for the key in the local storage
   */
  static getItemAsNumberSetValue(key: string, defaultValue: number): number {
    // Read key in the local storage
    const valueFromStorage = this.getItemAsNumber(key);

    // If found, return it
    if (valueFromStorage !== undefined) return valueFromStorage;

    // Set it to default
    localStorage.setItem(key, defaultValue.toString());
    return defaultValue;
  }

  /**
   * Helper function to read a number or a list of numbers in the local storage and if the
   * key can't be found or invalid, automatically set the value to the default value provided and return that value.
   * That way, it'll be stored in local storage for future use.
   * @param key {string} The key to search for
   * @param defaultValue {number | number[]} The default value to set in the local storage and return when not found or error
   * @returns The value as number | number[] for the key in the local storage
   */
  static getItemAsNumberOrNumberArraySetValue(key: string, defaultValue: number | number[]): number | number[] {
    // Read key in the local storage
    const valueFromStorage = this.getItemAsNumberOrNumberArray(key);

    // If found, return it
    if (valueFromStorage !== undefined) return valueFromStorage;

    // Set it to default
    localStorage.setItem(key, defaultValue.toString());
    return defaultValue;
  }
}

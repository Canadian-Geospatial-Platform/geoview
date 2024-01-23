/**
 * Helper function to read a number in the local storage and if the
 * key can't be found or is invalid return the default value provided.
 * @param key {string} The key to search for
 * @param defaultValue {number} The default value when not found or error
 * @returns The value as number for the key in the local storage or the default value provided.
 */
export const getItemAsNumber = (key: string, defaultValue?: number): number | undefined => {
  try {
    // Read key in the local storage
    const levelValue = localStorage.getItem(key);

    // Read as number
    const levelValueNumber = Number(levelValue);

    // If set and valid: return it; else default will be returned
    if (levelValueNumber && !Number.isNaN(levelValueNumber)) return levelValueNumber;
  } catch (e) {
    // Failed to read localStorage, eat the exception and continue to set the value to the default
  }

  // Not found, return default
  return defaultValue;
};

/**
 * Helper function to read a number in the local storage and if the
 * key can't be found or invalid, automatically set the value to the default value provided and return that value.
 * That way, it'll be stored in local storage for future use.
 * @param key {string} The key to search for
 * @param defaultValue {number} The default value to set in the local storage and return when not found or error
 * @returns The value as number for the key in the local storage
 */
export const getItemAsNumberSetValue = (key: string, defaultValue: number): number => {
  // Read key in the local storage
  const valueFromStorage = getItemAsNumber(key);

  // If found
  if (valueFromStorage !== undefined) return valueFromStorage;

  // Set it to default
  localStorage.setItem(key, defaultValue.toString());
  return defaultValue;
};

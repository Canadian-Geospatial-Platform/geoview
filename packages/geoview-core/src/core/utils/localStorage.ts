/**
 * Helper function to read a number in the local storage and if the
 * key can't be found or invalid, automatically set the value to the default value provided.
 * @param key string The key to search for
 * @param defaultValue number The default value to set in the local storage and return when not found or error
 * @returns number The value as number for the key in the local storage
 */
export const getItemAsNumberSetValue = (key: string, defaultValue: number): number => {
  try {
    // Read key in the local storage
    const levelValue = localStorage.getItem(key);

    // Read as number
    const levelValueNumber = Number(levelValue);

    // If set and valid: return it; else it'll be set to default later
    if (levelValueNumber && !Number.isNaN(levelValueNumber)) return levelValueNumber;
  } catch (e) {
    // Failed to read localStorage, eat the exception and continue to set the value to the default
  }

  // Set it to default
  localStorage.setItem(key, defaultValue.toString());
  return defaultValue;
};

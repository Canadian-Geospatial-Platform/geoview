/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

/** Error thrown when a config validation error occurs. */
export class ConfigError extends Error {
  /** Creates an instance of ConfigError. */
  constructor() {
    super(`A config validation error occured.`);

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

/** Error thrown when a map configuration error occurs. */
export class MapConfigError extends ConfigError {
  /**
   * Creates an instance of MapConfigError.
   *
   * @param message - The error message describing the config issue
   */
  constructor(message: string) {
    super();

    // Override the message
    this.message = `Map Config Error: ${message}.`;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, MapConfigError.prototype);
  }
}

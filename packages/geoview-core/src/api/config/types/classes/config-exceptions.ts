/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files
export class ConfigError extends Error {
  constructor() {
    super(`A config validation error occured.`);

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

export class MapConfigError extends ConfigError {
  constructor(message: string) {
    super();

    // Override the message
    this.message = `Map Config Error: ${message}.`;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, MapConfigError.prototype);
  }
}

export class GeoviewLayerConfigError extends ConfigError {
  constructor(message: string) {
    super();

    // Override the message
    this.message = `Geoview layer Config Error: ${message}.`;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, MapConfigError.prototype);
  }
}

export class GeoviewLayerMandatoryError extends ConfigError {
  messageList: Record<string, string> = {
    LayerNameMandatory: 'Property geoviewLayerName is mandatory for GeoView layer',
  };

  messageKey: string;

  messageVariables: string[];

  constructor(messageKey: string, messageVariables: string[]) {
    super();
    this.messageKey = messageKey;
    this.messageVariables = messageVariables;

    // Override the message
    const messageFragments = this.messageList[messageKey].split('<=>');
    const message = messageFragments.reduce((accumulator, stringToAppend, i) => {
      return i < messageVariables.length ? `${accumulator}${stringToAppend}${messageVariables[i]}` : `${accumulator}${stringToAppend}`;
    }, '');
    this.message = message;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, MapConfigError.prototype);
  }
}

export class GeoviewLayerInvalidParameterError extends ConfigError {
  messageList: Record<string, string> = {
    LayerIdNotFound: 'Cannot find layer id <=> in the metadata.',
    LayerIdInvalidType: 'The layerId of entry <=> must be an integer string.',
  };

  messageKey: string;

  messageVariables: string[];

  constructor(messageKey: string, messageVariables: string[]) {
    super();
    this.messageKey = messageKey;
    this.messageVariables = messageVariables;

    // Override the message
    const messageFragments = this.messageList[messageKey].split('<=>');
    const message = messageFragments.reduce((accumulator, stringToAppend, i) => {
      return i < messageVariables.length ? `${accumulator}${stringToAppend}${messageVariables[i]}` : `${accumulator}${stringToAppend}`;
    }, '');
    this.message = message;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, MapConfigError.prototype);
  }
}

export {};

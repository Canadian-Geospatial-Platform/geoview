export class GeoViewError extends Error {
  // The map id
  mapId: string;

  constructor(mapId: string) {
    super(`An error happened on map ${mapId}`);

    // Keep the informations
    this.mapId = mapId;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, GeoViewError.prototype);
  }
}

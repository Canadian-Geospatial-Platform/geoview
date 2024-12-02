/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

export class GeoViewLayerError extends GeoViewError {
  // The layer id
  geoviewLayerId: string;

  constructor(geoviewLayerId: string, mapId: string) {
    super(mapId);

    // Override the message
    this.message = `A generic error happened for layer ${geoviewLayerId} on map ${mapId}`;

    // Keep the informations
    this.geoviewLayerId = geoviewLayerId;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, GeoViewLayerError.prototype);
  }
}

export class GeoViewLayerNotCreatedError extends GeoViewLayerError {
  constructor(geoviewLayerId: string, mapId: string) {
    super(geoviewLayerId, mapId);

    // Override the message
    this.message = `Failed to create the layer ${geoviewLayerId} on map ${mapId}`;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, GeoViewLayerNotCreatedError.prototype);
  }
}

export class GeoViewLayerCreatedTwiceError extends GeoViewLayerError {
  // The layer
  geoviewLayer: AbstractGVLayer;

  constructor(geoviewLayer: AbstractGVLayer, mapId: string) {
    super(geoviewLayer.getGeoviewLayerId(), mapId);

    // Override the message
    this.message = `Can not execute twice the createGeoViewLayers method for layer ${geoviewLayer.getGeoviewLayerId()} on map ${mapId}`;

    // Keep the informations
    this.geoviewLayer = geoviewLayer;

    // Set the prototype explicitly (as recommended by TypeScript doc)
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
    Object.setPrototypeOf(this, GeoViewLayerCreatedTwiceError.prototype);
  }
}

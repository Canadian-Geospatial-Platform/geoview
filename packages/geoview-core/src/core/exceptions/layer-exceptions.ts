/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

export class GeoViewLayerError extends GeoViewError {
  // The layer id
  geoviewLayerId: string;

  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, `A generic error happened for layer ${geoviewLayerId} on map ${mapId}`);

    // Keep the informations
    this.geoviewLayerId = geoviewLayerId;

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerError.prototype);
  }
}

export class GeoViewLayerNotCreatedError extends GeoViewLayerError {
  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, `Failed to create the layer ${geoviewLayerId} on map ${mapId}`);

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerNotCreatedError.prototype);
  }
}

export class GeoViewLayerCreatedTwiceError extends GeoViewLayerError {
  // The layer
  geoviewLayer: AbstractGVLayer;

  constructor(mapId: string, geoviewLayer: AbstractGVLayer) {
    super(mapId, `Can not execute twice the createGeoViewLayers method for layer ${geoviewLayer.getGeoviewLayerId()} on map ${mapId}`);

    // Keep the informations
    this.geoviewLayer = geoviewLayer;

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerCreatedTwiceError.prototype);
  }
}

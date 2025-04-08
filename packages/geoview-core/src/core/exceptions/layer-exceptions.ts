/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { getLocalizedMessage } from '@/core/utils/utilities';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';

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

export class GeoViewLayerLoadedFailedError extends GeoViewLayerError {
  // The layer
  layerConfig: TypeLayerEntryConfig;

  // The inner cause
  causeError: string;

  constructor(mapId: string, layerConfig: TypeLayerEntryConfig, causeError: string) {
    super(mapId, layerConfig.layerId);

    // Keep the layer and inner error
    this.layerConfig = layerConfig;
    this.causeError = causeError;

    // Set the message
    this.message = getLocalizedMessage('validation.layer.loadfailed', AppEventProcessor.getDisplayLanguage(mapId), [
      layerConfig.layerName || layerConfig.geoviewLayerConfig.geoviewLayerName || layerConfig.layerId || layerConfig.layerPath,
    ]);

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerLoadedFailedError.prototype);
  }
}

export class GeoViewLayerCreatedTwiceError extends GeoViewLayerError {
  // The layer
  geoviewLayer: AbstractGVLayer;

  constructor(mapId: string, geoviewLayer: AbstractGVLayer) {
    super(mapId, geoviewLayer.getGeoviewLayerId());

    // Keep the layer
    this.geoviewLayer = geoviewLayer;

    // Set the message
    this.message = getLocalizedMessage('validation.layer.createtwice', AppEventProcessor.getDisplayLanguage(mapId), [this.geoviewLayerId]);

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerCreatedTwiceError.prototype);
  }
}

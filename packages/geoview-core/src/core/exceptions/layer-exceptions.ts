/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { getLocalizedMessage } from '@/core/utils/utilities';
import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';

export class GeoViewLayerError extends GeoViewError {
  // The layer id
  geoviewLayerId: string;

  constructor(
    mapId: string,
    geoviewLayerId: string,
    localizedKeyOrMessage: string | undefined = undefined,
    params: TypeJsonValue[] | TypeJsonArray | string[] | undefined = []
  ) {
    super(mapId, localizedKeyOrMessage || `A generic error happened for layer ${geoviewLayerId} on map ${mapId}`, params);

    // Keep the informations
    this.geoviewLayerId = geoviewLayerId;

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerError.prototype);
  }
}

export class GeoViewLayerNotCreatedError extends GeoViewLayerError {
  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, geoviewLayerId, `Failed to create the layer ${geoviewLayerId} on map ${mapId}`);

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
  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, geoviewLayerId);

    // Set the message
    this.message = getLocalizedMessage('validation.layer.createtwice', AppEventProcessor.getDisplayLanguage(mapId), [this.geoviewLayerId]);

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewLayerCreatedTwiceError.prototype);
  }
}

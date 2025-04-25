/* eslint-disable max-classes-per-file */

import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';
import { getLocalizedMessage } from '@/core/utils/utilities';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

// Custom error class for GeoView-related errors
export class GeoViewError extends Error {
  // The map id related to the error
  mapId: string;

  /**
   * Constructor to initialize the GeoViewError with a map ID.
   * @param mapId - The map ID associated with the error
   */
  constructor(mapId: string, localizedKeyOrMessage: string, params: TypeJsonValue[] | TypeJsonArray | string[] = []) {
    // Call the parent class (Error) constructor with a custom message
    super(`An error happened on map ${mapId}`);

    // Store the map ID
    this.mapId = mapId;

    // Set the message
    this.message = getLocalizedMessage(localizedKeyOrMessage, AppEventProcessor.getDisplayLanguage(mapId), params);

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, GeoViewError.prototype);
  }
}

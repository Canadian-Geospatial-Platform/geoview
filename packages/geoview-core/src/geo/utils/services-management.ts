import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';

/** Handles known service-specific quirks that require special treatment. */
export class ServicesManagement {
  /**
   * Checks if the WFS service at the given URL supports the application/json output format.
   *
   * @param url - The URL of the WFS service
   * @param outputFormats - The output formats to check for support when necessary to check
   * @returns The output formats that are supported, or an empty array if none are supported
   */
  static checkWFSOutputFormats(url: string, outputFormats: string[]): string[] {
    // The geo.weather.gc.ca/geomet service says it supports application/json for WFS, but it doesn't in reality
    // Proof, this url fails: https://geo.weather.gc.ca/geomet?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&typeName=ec-msc%3ACURRENT_CONDITIONS&outputFormat=application/json
    if (url.includes('//geo.weather.gc.ca/geomet')) {
      // Remove the application/json format from its list of supported formats
      return outputFormats.filter((format) => format.toLowerCase() !== 'application/json');
    }

    // All good by default
    return outputFormats;
  }

  /**
   * Converts a WMS service URL to its WFS equivalent by replacing the CGI-bin path segment.
   *
   * @param url - The WMS service URL to convert
   * @returns The URL with 'cgi-bin/wms' replaced by 'cgi-bin/wfs'
   */
  static checkUrlSwitchWMSToWFS(url: string): string {
    // Tweak url
    const parsedUrl = url.replaceAll('cgi-bin/wms', 'cgi-bin/wfs');

    // Return the tweaked url
    return parsedUrl;
  }

  /**
   * Converts a WFS service URL to its WMS equivalent by replacing the CGI-bin path segment.
   *
   * @param url - The WFS service URL to convert
   * @returns The URL with 'cgi-bin/wfs' replaced by 'cgi-bin/wms'
   */
  static checkUrlSwitchWFSToWMS(url: string): string {
    // Tweak url
    const parsedUrl = url.replaceAll('cgi-bin/wfs', 'cgi-bin/wms');

    // Return the tweaked url
    return parsedUrl;
  }

  /**
   * Toggles the MapServer `ms:` prefix on a WFS/WMS layer identifier.
   *
   * @param layerId - The layer identifier to transform
   * @returns The layer identifier with its `ms:` prefix added or removed
   */
  static toggleMsLayerIdPrefix(layerId: string): string {
    return layerId.startsWith('ms:') ? layerId.slice(3) : `ms:${layerId}`;
  }

  /**
   * If no primary-key outfield is configured, marks the first `pk_lyr_id` outfield as type `oid`, falling back to `id`.
   * Field-name matching is case-insensitive; `pk_lyr_id` is preferred for CDTK layers.
   *
   * @param layerConfig - The layer configuration whose outfields are checked and may be modified
   */
  static guessAssignationOfPrimaryKeyField(layerConfig: AbstractBaseLayerEntryConfig): void {
    // If the outfields have no primary key, try to determine one manually
    if (!layerConfig.hasOutfieldsPK()) {
      const outfields = layerConfig.getOutfields();

      // Look for a field named 'pk_lyr_id' first, then 'id' as a fallback (CDTK special-case!)
      const lyrIdField = outfields?.find((field) => field.name.toLowerCase() === 'pk_lyr_id');
      if (lyrIdField) {
        lyrIdField.type = 'oid';
      } else {
        // Look for a field named 'fid' as a fallback if 'pk_lyr_id' is not found
        const fidField = outfields?.find((field) => field.name.toLowerCase() === 'fid');
        if (fidField) {
          fidField.type = 'oid';
        } else {
          // Look for a field named 'id' as a fallback if 'fid' is not found
          const idField = outfields?.find((field) => field.name.toLowerCase() === 'id');
          if (idField) {
            idField.type = 'oid';
          }
        }
      }
    }
  }
}

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
}

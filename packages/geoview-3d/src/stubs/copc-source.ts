/**
 * Point-cloud (COPC) source contract — STUB, not wired into the plugin.
 *
 * TODO(geoview-3d, COPC): implement once loaders.gl v5 ships COPC streaming (issue visgl/loaders.gl#3316; v5 was
 * 5.0.0-alpha.9 and no `@loaders.gl/copc` package existed when this stub was written). Planned path: a COPC source
 * streaming octree nodes for the current viewport into a deck.gl PointCloudLayer, using the same
 * owned-canvas TilesetRenderer lifecycle (abortable requests, request generations) as 3D Tiles.
 * Tracking request: geoview issue #2497 (COPC point clouds).
 */

/** Configuration of a COPC point-cloud source (planned `copcUrl` plugin option). */
export interface TypeCopcSourceConfig {
  /** URL of the .copc.laz file; the server must support HTTP range requests and CORS. */
  copcUrl: string;
  /** Optional point budget for the viewport, to bound memory and GPU load. */
  maxPoints?: number;
}

/** Contract a COPC renderer will satisfy, mirroring TilesetRenderer's public surface. */
export interface CopcRendererContract {
  /** Sets the COPC file to stream, or undefined to clear the view. */
  setSource(config: TypeCopcSourceConfig | undefined): void;
  /** Releases the WebGL resources and aborts pending range requests. */
  destroy(): void;
}

/** Error raised by the COPC stub so a premature call fails loudly instead of rendering nothing. */
export class CopcNotSupportedError extends Error {
  /**
   * Creates the error.
   */
  constructor() {
    super('COPC point clouds are not supported yet: waiting for loaders.gl v5 COPC streaming.');
    this.name = 'CopcNotSupportedError';
  }
}

/**
 * Checks whether COPC rendering is available in this build.
 *
 * @returns Always false until the loaders.gl v5 COPC loader is integrated
 */
export function isCopcSupported(): boolean {
  return false;
}

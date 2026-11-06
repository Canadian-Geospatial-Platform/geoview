import { Deck } from '@deck.gl/core';
import type { MapViewState } from '@deck.gl/core';
import type { TerrainLayer, TileLayer, Tile3DLayerProps } from '@deck.gl/geo-layers';
import { Tiles3DLoader } from '@loaders.gl/3d-tiles';
import { load } from '@loaders.gl/core';

import { logger } from 'geoview-core/core/utils/logger';

import { SafeTile3DLayer } from './safe-tile-3d-layer';
import { createBasemapLayer, DEFAULT_BASEMAP_ID } from './basemap-layer';
import type { TypeBasemapId } from './basemap-layer';
import { createTerrainLayer } from './terrain-layer';
import type { TypeTerrainProgress } from './terrain-layer';
import { refineThroughEmptyTiles } from './tileset-traversal';
import { VertexColorScenegraphLayer } from './vertex-color-scenegraph-layer';
import type { TypeSyncedViewport } from './viewport-sync';

/** The tileset object handed to Tile3DLayer's onTilesetLoad callback. */
type TypeTileset3D = Parameters<NonNullable<Tile3DLayerProps['onTilesetLoad']>>[0];

/** Callbacks reporting the tileset loading lifecycle. */
export interface TilesetRendererCallbacks {
  /** Called once the root tileset.json is loaded (and, if framed, the view is centred on it). */
  onTilesetLoad?: (tilesetUrl: string) => void;
  /** Called when the tileset or one of its tiles fails to load. */
  onError?: (message: string) => void;
  /** Decides whether to frame the camera on a freshly loaded tileset; frames when omitted. */
  shouldFrameTileset?: (tilesetUrl: string) => boolean;
  /** Called with the terrain elevation request counts as they change, at most every TERRAIN_PROGRESS_INTERVAL_MS. */
  onTerrainProgress?: (progress: TypeTerrainProgress) => void;
}

/** Shortest interval between two terrain progress reports, so bursts of tiles do not re-render the panel per tile. */
const TERRAIN_PROGRESS_INTERVAL_MS = 250;

/** Initial camera before any tileset is loaded (Canada-wide, tilted). */
const DEFAULT_VIEW_STATE: MapViewState = { longitude: -95, latitude: 60, zoom: 3, pitch: 45, bearing: 0 };

/** Pitch applied when centring the view on a freshly loaded tileset. */
const TILESET_VIEW_PITCH = 45;

/** Id prefix of the deck.gl layer rendering the tileset; a per-request suffix keeps superseded layers distinct. */
const TILE3D_LAYER_ID = 'geoview-3d-tileset';

/** Parse on the main thread: the default worker setup downloads worker scripts from a public CDN (unpkg). */
const LOAD_OPTIONS = { core: { worker: false } };

/**
 * Renders a 3D Tiles tileset with deck.gl into a canvas owned by the caller.
 *
 * Framework-agnostic: the Deck instance is created, updated and destroyed imperatively so React
 * re-renders never recreate the WebGL context.
 */
export class TilesetRenderer {
  /** The deck.gl instance drawing into the owned canvas. */
  #deck: Deck;

  /** The callbacks reporting the tileset loading lifecycle. */
  #callbacks: TilesetRendererCallbacks;

  /** The tileset URL currently rendered, if any. */
  #tilesetUrl?: string;

  /** Incremented on every tileset change and on destroy, so results of older requests are discarded. */
  #generation = 0;

  /** Aborts the in-flight root tileset validation request. */
  #abortController?: AbortController;

  /** Whether the renderer was destroyed. */
  #destroyed = false;

  /** The camera currently shown, kept in step with user interaction so syncs preserve pitch and bearing. */
  #viewState: MapViewState = DEFAULT_VIEW_STATE;

  /** The basemap currently drawn under the tileset. */
  #basemapId: TypeBasemapId;

  /** The ground basemap layer, kept across tileset changes; undefined when no basemap is drawn. */
  #basemapLayer?: TileLayer;

  /** Ground elevation the basemap is draped on; created once so its tiles stay cached across basemap changes. */
  #terrainLayer: TerrainLayer = createTerrainLayer((progress: TypeTerrainProgress): void => this.#queueTerrainProgress(progress));

  /** The latest terrain progress not yet reported. */
  #queuedTerrainProgress?: TypeTerrainProgress;

  /** Timer spacing terrain progress reports; set while reports are being held back. */
  #terrainProgressTimer?: ReturnType<typeof setTimeout>;

  /** The layer rendering the current tileset, once its root tileset.json is validated. */
  #tilesetLayer?: SafeTile3DLayer;

  /** Whether the tileset is drawn; hidden tilesets keep their loaded tiles. */
  #tilesetVisible = true;

  /**
   * Creates the renderer and its deck.gl instance on the given canvas.
   *
   * @param canvas - The canvas the deck.gl instance draws into
   * @param callbacks - Optional callbacks reporting the tileset loading lifecycle
   * @param basemapId - The basemap drawn under the tileset
   */
  constructor(canvas: HTMLCanvasElement, callbacks: TilesetRendererCallbacks = {}, basemapId: TypeBasemapId = DEFAULT_BASEMAP_ID) {
    this.#callbacks = callbacks;
    this.#basemapId = basemapId;
    this.#basemapLayer = createBasemapLayer(basemapId);
    this.#deck = new Deck({
      canvas,
      initialViewState: DEFAULT_VIEW_STATE,
      controller: true,
      // Nothing in the 3D view is picked yet; with draped terrain, hover picking logs "picking buffer corrupt" errors.
      _pickable: false,
      layers: this.#getLayers(),
      onViewStateChange: ({ viewState }): void => {
        this.#viewState = viewState;
      },
      onError: (error: Error): void => this.#reportError(error.message),
    });
  }

  // #region PUBLIC METHODS

  /**
   * Moves the 3D camera to the 2D map's centre and zoom, keeping the current pitch and bearing.
   *
   * @param viewport - The 2D map viewport converted to deck.gl terms
   */
  setViewport(viewport: TypeSyncedViewport): void {
    if (this.#destroyed) return;
    this.#jumpTo({ ...this.#viewState, ...viewport });
  }

  /**
   * Sets the tileset to render, replacing any previous one.
   *
   * The root tileset.json is fetched and validated first, then replayed to Tile3DLayer: the layer loads the root in an
   * unhandled promise, so a failure there would otherwise never be reported.
   *
   * @param tilesetUrl - The URL of the tileset.json, or undefined to clear the view
   */
  setTilesetUrl(tilesetUrl: string | undefined): void {
    const url = tilesetUrl?.trim() || undefined;
    if (this.#destroyed || url === this.#tilesetUrl) return;
    this.#tilesetUrl = url;

    this.#abortController?.abort();
    this.#abortController = undefined;
    this.#generation += 1;
    this.#tilesetLayer = undefined;
    this.#updateLayers();

    if (!url) return;
    const generation = this.#generation;
    this.#loadTileset(url, generation).catch((error: unknown): void => {
      // A superseded or destroyed request (incl. its abort) is no longer wanted; only the current one is reported.
      if (this.#isCurrent(generation)) this.#reportError(error instanceof Error ? error.message : String(error));
    });
  }

  /**
   * Sets the basemap drawn under the tileset, replacing the current one.
   *
   * @param basemapId - The basemap to draw ('none' for no basemap)
   */
  setBasemap(basemapId: TypeBasemapId): void {
    if (this.#destroyed || basemapId === this.#basemapId) return;
    this.#basemapId = basemapId;
    this.#basemapLayer = createBasemapLayer(basemapId);
    this.#updateLayers();
  }

  /**
   * Shows or hides the tileset, e.g. to look at the ground under it.
   *
   * The layer is hidden rather than removed, so its loaded tiles are kept and showing it again is immediate.
   *
   * @param visible - Whether the tileset is drawn
   */
  setTilesetVisible(visible: boolean): void {
    if (this.#destroyed || visible === this.#tilesetVisible) return;
    this.#tilesetVisible = visible;
    this.#tilesetLayer = this.#tilesetLayer?.clone({ visible });
    this.#updateLayers();
  }

  /**
   * Releases the deck.gl instance and its WebGL resources, and discards any pending tileset load.
   */
  destroy(): void {
    this.#destroyed = true;
    this.#generation += 1;
    this.#abortController?.abort();
    this.#abortController = undefined;
    clearTimeout(this.#terrainProgressTimer);
    this.#terrainProgressTimer = undefined;
    this.#deck.finalize();
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Fetches and validates the root tileset.json, then hands it to a new Tile3DLayer.
   *
   * @param tilesetUrl - The URL of the tileset.json
   * @param generation - The request generation this load belongs to
   * @returns A promise that resolves once the layer is created, or is discarded if superseded
   * @throws {Error} When the root tileset.json cannot be fetched or parsed (propagated from `fetch()` / `load()`)
   */
  async #loadTileset(tilesetUrl: string, generation: number): Promise<void> {
    const abortController = new AbortController();
    this.#abortController = abortController;
    const { signal } = abortController;

    // Raw fetch: loaders.gl needs real Response objects for every tile request, which the core Fetch helper unwraps.
    const rootResponse = await fetch(tilesetUrl, { signal });
    if (!rootResponse.ok) throw new Error(`HTTP ${rootResponse.status} ${rootResponse.statusText}`.trim());
    const rootBytes = await rootResponse.arrayBuffer();
    const rootUrl = rootResponse.url || tilesetUrl;

    const fetchWithRoot = (url: string, init?: RequestInit): Promise<Response> => {
      if (url !== tilesetUrl && url !== rootUrl) return fetch(url, { ...init, signal });
      const contentType = rootResponse.headers.get('content-type') ?? 'application/json';
      const response = new Response(rootBytes.slice(0), { headers: { 'content-type': contentType } });
      // loaders.gl resolves relative tile URLs from response.url, which a constructed Response leaves empty.
      Object.defineProperty(response, 'url', { value: rootUrl });
      return Promise.resolve(response);
    };
    const loadOptions = { core: { ...LOAD_OPTIONS.core, fetch: fetchWithRoot } };

    await load(tilesetUrl, Tiles3DLoader, loadOptions);

    if (!this.#isCurrent(generation)) return;
    this.#tilesetLayer = this.#createLayer(tilesetUrl, generation, loadOptions);
    this.#updateLayers();
  }

  /**
   * Lists the layers to draw: the terrain the basemap is draped on, the basemap, then the tileset, which keeps its own
   * absolute heights.
   *
   * The terrain layer always stays in the list and is only hidden without a basemap: deck.gl finalizes a layer that
   * leaves the list, and a finalized layer instance cannot be added again.
   *
   * @returns The deck.gl layers
   */
  #getLayers(): (TerrainLayer | TileLayer | SafeTile3DLayer)[] {
    const terrainLayer = this.#terrainLayer.clone({ visible: this.#basemapLayer !== undefined });
    return [terrainLayer, this.#basemapLayer, this.#tilesetLayer].filter((layer) => layer !== undefined);
  }

  /**
   * Hands the current basemap and tileset layers to deck.gl.
   */
  #updateLayers(): void {
    this.#deck.setProps({ layers: this.#getLayers() });
  }

  /**
   * Creates the Tile3DLayer for one tileset request.
   *
   * @param tilesetUrl - The URL of the tileset.json
   * @param generation - The request generation the layer belongs to
   * @param loadOptions - The loader options, including the request's fetch function
   * @returns The Tile3DLayer
   */
  #createLayer(tilesetUrl: string, generation: number, loadOptions: Tile3DLayerProps['loadOptions']): SafeTile3DLayer {
    return new SafeTile3DLayer({
      id: `${TILE3D_LAYER_ID}-${generation}`,
      data: tilesetUrl,
      visible: this.#tilesetVisible,
      loader: Tiles3DLoader,
      loadOptions,
      // Draw glTF tiles with a scenegraph layer that honours COLOR_0 vertex colours.
      _subLayerProps: { scenegraph: { type: VertexColorScenegraphLayer } },
      onTilesetLoad: (tileset: TypeTileset3D): void => this.#handleTilesetLoad(tilesetUrl, generation, tileset),
      // loaders.gl calls onTileError(tile, message, url), the reverse of deck.gl's declared (tile, url, message).
      onTileError: (_tile, message: string, url: string): void => {
        if (this.#isCurrent(generation)) this.#reportError(`${url}: ${message}`);
      },
    });
  }

  /**
   * Frames the view on a loaded tileset (when the owner allows it), or destroys it if its request was superseded meanwhile.
   *
   * A layer finalized before its tileset finished loading never destroys that tileset itself.
   *
   * @param tilesetUrl - The URL the tileset was requested with
   * @param generation - The request generation the tileset belongs to
   * @param tileset - The loaded tileset
   */
  #handleTilesetLoad(tilesetUrl: string, generation: number, tileset: TypeTileset3D): void {
    if (!this.#isCurrent(generation)) {
      tileset.destroy();
      return;
    }

    refineThroughEmptyTiles(tileset);

    const center = tileset.cartographicCenter;
    if (center && (this.#callbacks.shouldFrameTileset?.(tilesetUrl) ?? true)) {
      this.#jumpTo({ longitude: center[0], latitude: center[1], zoom: tileset.zoom, pitch: TILESET_VIEW_PITCH, bearing: 0 });
    }
    this.#callbacks.onTilesetLoad?.(tilesetUrl);
  }

  /**
   * Moves the camera to a view state.
   *
   * @param viewState - The view state to show
   */
  #jumpTo(viewState: MapViewState): void {
    this.#viewState = viewState;
    // Deck only resets the camera when initialViewState deep-changes; clear it so a repeated view still applies.
    this.#deck.setProps({ initialViewState: null });
    this.#deck.setProps({ initialViewState: viewState });
  }

  /**
   * Checks whether a request generation is still the one the renderer wants.
   *
   * @param generation - The request generation
   * @returns Whether the generation is current and the renderer is alive
   */
  #isCurrent(generation: number): boolean {
    return !this.#destroyed && generation === this.#generation;
  }

  /**
   * Logs a rendering or loading error and forwards it to the caller.
   *
   * @param message - The error message
   */
  #reportError(message: string): void {
    logger.logError(`geoview-3d - Tileset rendering failed for ${this.#tilesetUrl}`, message);
    this.#callbacks.onError?.(message);
  }

  /**
   * Queues a terrain progress report: the first one goes out at once, later ones at most every
   * TERRAIN_PROGRESS_INTERVAL_MS, and the last one of a burst is always reported.
   *
   * @param progress - The latest elevation request counts
   */
  #queueTerrainProgress(progress: TypeTerrainProgress): void {
    this.#queuedTerrainProgress = progress;
    if (this.#terrainProgressTimer === undefined) this.#flushTerrainProgress();
  }

  /**
   * Reports the queued terrain progress, if any, and holds later reports back for TERRAIN_PROGRESS_INTERVAL_MS.
   */
  #flushTerrainProgress(): void {
    const progress = this.#queuedTerrainProgress;
    this.#queuedTerrainProgress = undefined;
    if (!progress || this.#destroyed) return;
    this.#callbacks.onTerrainProgress?.(progress);
    this.#terrainProgressTimer = setTimeout(() => {
      this.#terrainProgressTimer = undefined;
      this.#flushTerrainProgress();
    }, TERRAIN_PROGRESS_INTERVAL_MS);
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Checks whether the browser can create a WebGL2 context, which deck.gl 9 requires.
   *
   * deck.gl starts its render loop without awaiting it, so a failed context creation rejects unhandled; probing first
   * lets the caller show a message instead of creating a Deck that cannot render.
   *
   * @returns Whether a WebGL2 context (hardware or software) can be created
   */
  static isWebGL2Available(): boolean {
    // A detached canvas: the probe never touches the page.
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  }

  /**
   * Checks whether a configured tileset URL can be requested.
   *
   * Accepts absolute or page-relative http(s) URLs; rejects empty values, the REPLACE_ME placeholder and other schemes.
   *
   * @param tilesetUrl - The configured tileset URL
   * @returns Whether the URL can be requested
   */
  static isValidTilesetUrl(tilesetUrl: string | undefined): tilesetUrl is string {
    const url = tilesetUrl?.trim();
    if (!url || url === 'REPLACE_ME') return false;
    try {
      const { protocol } = new URL(url, window.location.href);
      return protocol === 'https:' || protocol === 'http:';
    } catch {
      return false;
    }
  }

  // #endregion STATIC METHODS
}

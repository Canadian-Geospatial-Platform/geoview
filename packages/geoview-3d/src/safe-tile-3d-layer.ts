import type { LayerContext, UpdateParameters } from '@deck.gl/core';
import { Tile3DLayer } from '@deck.gl/geo-layers';

/** Tile3DLayer's private root loader, reached at runtime only. */
type TypeRootLoader = { _loadTileset: (tilesetUrl: string) => Promise<void> };

/**
 * Tile3DLayer whose root tileset load can never reject unhandled.
 *
 * deck.gl 9.4 starts the root load from updateState without awaiting or catching it, so a tileset the parser rejects,
 * or a request aborted after the layer is replaced, surfaces as an unhandled promise rejection. This layer routes those
 * failures to deck's error handler while the layer is alive, and drops them once it has been finalized.
 */
export class SafeTile3DLayer extends Tile3DLayer {
  static override layerName = 'SafeTile3DLayer';

  /** Whether this instance's root loader has been wrapped. */
  #isLoadGuarded = false;

  /** Whether this instance was finalized; deck.gl does not clear internalState on finalize. */
  #isFinalized = false;

  /**
   * Guards the root tileset load before deck.gl's update logic can start it.
   *
   * @param params - The deck.gl update parameters
   */
  override updateState(params: UpdateParameters<this>): void {
    this.#guardRootLoad();
    super.updateState(params);
  }

  /**
   * Marks the instance as finalized so a late root-load failure is dropped.
   *
   * @param context - The deck.gl layer context
   */
  override finalizeState(context: LayerContext): void {
    this.#isFinalized = true;
    super.finalizeState(context);
  }

  /**
   * Wraps the inherited private root loader so its rejection is handled.
   */
  #guardRootLoad(): void {
    if (this.#isLoadGuarded) return;
    this.#isLoadGuarded = true;

    // The loader is private in deck.gl's typings only; it is a regular method at runtime.
    const layer = this as unknown as TypeRootLoader;
    // eslint-disable-next-line no-underscore-dangle -- deck.gl's own method name
    const loadTileset = layer._loadTileset.bind(this);
    // eslint-disable-next-line no-underscore-dangle -- deck.gl's own method name
    layer._loadTileset = (tilesetUrl: string): Promise<void> =>
      loadTileset(tilesetUrl).catch((error: unknown): void => {
        // A layer that was removed, or whose state moved to a replacement instance, no longer owns this load.
        if (this.#isFinalized || this.getCurrentLayer() !== this) return;
        this.raiseError(error instanceof Error ? error : new Error(String(error)), 'Tileset load failed');
      });
  }
}

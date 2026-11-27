/** A tile as seen by the loaders.gl traverser: only the members this module reads. */
type TypeTraversedTile = { hasChildren: boolean; hasRenderContent: boolean; hasTilesetContent: boolean };

/** A loaders.gl tileset traverser: only the method this module wraps. */
type TypeTraverser = { canTraverse: (tile: TypeTraversedTile, frameState: unknown) => boolean };

/**
 * Makes a loaders.gl tileset always descend into tiles that have nothing to draw.
 *
 * loaders.gl stops refining a tile once its screen-space error is under the threshold, even when the tile has no
 * content. Tilesets whose upper levels are empty and carry small geometric errors (e.g. tyler output) are then never
 * traversed down to the leaves that hold the geometry, and nothing is drawn. An empty tile cannot be a sufficient
 * level of detail, so its children are always visited; tiles with content keep loaders.gl's own rule.
 *
 * Must run before the tileset's first traversal, i.e. from Tile3DLayer's onTilesetLoad.
 *
 * @param tileset - The loaded Tileset3D
 */
export function refineThroughEmptyTiles(tileset: object): void {
  // The traverser is internal to Tileset3D; it exists for every 3D Tiles tileset at load time.
  // eslint-disable-next-line no-underscore-dangle -- loaders.gl's own field name
  const traverser = (tileset as { _traverser?: TypeTraverser })._traverser;
  if (!traverser) return;

  const canTraverse = traverser.canTraverse.bind(traverser);
  // External-tileset tiles keep loaders.gl's rule, which skips expired subtrees.
  traverser.canTraverse = (tile: TypeTraversedTile, frameState: unknown): boolean =>
    (tile.hasChildren && !tile.hasRenderContent && !tile.hasTilesetContent) || canTraverse(tile, frameState);
}

import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@config/utils';
import { GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define the common implementation of a WFS GeoView sublayer to display on the map.
 */
export class WfsGroupLayerConfig extends GroupLayerEntryConfig {
  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /** ***************************************************************************************************************************
   * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    // WFS metadata doesn't provide group definition. So, we fetch the sub-layers immediately.
    await this.fetchListOfLayerMetadata();

    if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
      throw new GeoviewLayerConfigError(
        `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
      );
    }
  }

  /** ***************************************************************************************************************************
   * This method is used to parse the layer metadata and extract the style, source information and other properties.
   * However, since WFS doesn't have groups in its metadata, this routine does nothing for the group nodes.
   *
   * @protected @override
   */
  protected override parseLayerMetadata(): void {}

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}

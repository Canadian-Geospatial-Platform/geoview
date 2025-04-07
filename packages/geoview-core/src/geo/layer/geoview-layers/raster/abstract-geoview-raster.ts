import { TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

/** *****************************************************************************************************************************
 * The AbstractGeoViewRaster class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView raster layers. In addition to the components of the parent class, there is an attribute named
 * olLayers where the raster elements of the class will be kept.
 *
 * The olLayers attribute has a hierarchical structure. Its data type is TypeBaseRasterLayer. Subclasses of this type
 * are TypeRasterLayerGroup and TypeRasterLayer. The TypeRasterLayerGroup is a collection of TypetBaseRasterLayer. It is
 * important to note that a TypetBaseRasterLayer attribute can polymorphically refer to a TypeRasterLayerGroup or a
 * TypeRasterLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the olLayers attribute must be of type TypeRasterLayer. This is where the
 * features are placed.
 */
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // TODO: Refactor Metadata - Maybe call 'commonfetchServiceMetadata'?
    // The url
    const url = this.metadataAccessPath.toLowerCase().endsWith('json') ? this.metadataAccessPath : `${this.metadataAccessPath}?f=json`;

    // Query and read
    this.metadata = null;
    const response = await fetch(url);
    const metadataJson: TypeJsonObject = await response.json();

    // If read
    if (metadataJson && metadataJson !== '' && metadataJson !== '{}') {
      this.metadata = metadataJson;
      const copyrightText = this.metadata.copyrightText as string;
      const attributions = this.getAttributions();
      if (copyrightText && !attributions.includes(copyrightText)) {
        // Add it
        attributions.push(copyrightText);
        this.setAttributions(attributions);
      }
    } else {
      // Log
      logger.logError('Metadata was empty');
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
    }
  }
}

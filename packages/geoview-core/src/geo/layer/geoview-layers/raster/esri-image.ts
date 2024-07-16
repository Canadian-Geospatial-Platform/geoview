import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import BaseLayer from 'ol/layer/Base';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';
import { Extent } from 'ol/extent';

import { getLocalizedValue } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeUniqueValueStyleConfig,
  TypeUniqueValueStyleInfo,
  TypeStyleConfig,
  layerEntryIsGroupLayer,
  codedValueType,
  rangeDomainType,
} from '@/geo/map/map-schema-types';

import {
  commonGetFieldDomain,
  commonGetFieldType,
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
} from '@/geo/layer/geoview-layers/esri-layer-common';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { validateExtent } from '@/geo/utils/utilities';
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';

export interface TypeEsriImageLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_IMAGE;
  listOfLayerEntryConfig: EsriImageLayerEntryConfig[];
}

interface TypeEsriImageLayerLegend {
  layers: {
    layerId: number | string;
    layerName: string;
    layerType: string;
    minScale: number;
    maxScale: number;
    legendType: string;
    legend: {
      label: string;
      url: string;
      imageData: string;
      contentType: string;
      height: number;
      width: number;
      values: string[];
    }[];
  }[];
}

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriImageLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriImage = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriImageLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriImage if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriImage = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriImage => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriImageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_IMAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriImage = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is EsriImageLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_IMAGE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri image layer.
 *
 * @exports
 * @class EsriImage
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class EsriImage extends AbstractGeoViewRaster {
  /** ****************************************************************************************************************************
   * Initialize layer.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriImageLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriImageLayerConfig) {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_IMAGE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer.This routine return null when the layerPath specified is not found. If the legend can't be
   * read, the legend property of the object returned will be null.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  override async getLegend(layerPath: string): Promise<TypeLegend | null> {
    try {
      const layerConfig = this.getLayerConfig(layerPath) as EsriImageLayerEntryConfig | undefined | null;
      if (!layerConfig) return null;
      const legendUrl = `${getLocalizedValue(
        layerConfig.geoviewLayerConfig.metadataAccessPath,
        AppEventProcessor.getDisplayLanguage(this.mapId)
      )}/legend?f=json`;
      const response = await fetch(legendUrl);
      const legendJson: TypeEsriImageLayerLegend = await response.json();
      let legendInfo;
      if (legendJson.layers && legendJson.layers.length === 1) {
        legendInfo = legendJson.layers[0].legend;
      } else if (legendJson.layers.length) {
        const layerInfo = legendJson.layers.find((layer) => layer.layerId === layerConfig.layerId);
        if (layerInfo) legendInfo = layerInfo.legend;
      }
      if (!legendInfo) {
        const legend: TypeLegend = {
          type: CONST_LAYER_TYPES.ESRI_IMAGE,
          styleConfig: this.getStyle(layerPath),
          legend: null,
        };
        return legend;
      }
      const uniqueValueStyleInfo: TypeUniqueValueStyleInfo[] = [];
      legendInfo.forEach((info) => {
        const styleInfo: TypeUniqueValueStyleInfo = {
          label: info.label,
          values: info.label.split(','),
          settings: {
            type: 'iconSymbol',
            mimeType: info.contentType,
            src: info.imageData,
            width: info.width,
            height: info.height,
          },
        };
        uniqueValueStyleInfo.push(styleInfo);
      });
      const styleSettings: TypeUniqueValueStyleConfig = {
        styleType: 'uniqueValue',
        fields: ['default'],
        uniqueValueStyleInfo,
      };
      const styleConfig: TypeStyleConfig = {
        Point: styleSettings,
      };

      // TODO: Refactor - Find a better place to set the style than in a getter or rename this function like another TODO suggests
      // TO.DOCONT: This setter is also dangerous, because it triggers a style changed event which is listened by the legends-layer-set.
      // TO.DOCONT: Fortunately, we have a loop check barrier, but setting a style during a legend fetch getter could lead to be more problematic.
      this.setStyle(layerPath, styleConfig);

      const legend: TypeLegend = {
        type: CONST_LAYER_TYPES.ESRI_IMAGE,
        styleConfig,
        legend: await getLegendStyles(this.getStyle(layerPath)),
      };
      return legend;
    } catch (error) {
      logger.logError(`Get Legend for ${layerPath} error`, error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeLayerEntryConfig[]} A new list of layer entries configuration with deleted error layers.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStatus = 'error';
        }
      }
    });
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    // TODO: Refactor - Layers refactoring. Is this function really valid for an esri-image? Remove?
    return commonGetFieldType(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return the domain of the specified field.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFieldDomain(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): null | codedValueType | rangeDomainType {
    return commonGetFieldDomain(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {EsriImageLayerEntryConfig} layerConfig The layer entry to configure
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: EsriImageLayerEntryConfig): void {
    commonProcessTemporalDimension(this, esriTimeDimension, layerConfig, true);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processFeatureInfoConfig(layerConfig: EsriImageLayerEntryConfig): void {
    commonProcessFeatureInfoConfig(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {EsriImage} this The ESRI layer instance pointer.
   * @param {EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processInitialSettings(layerConfig: EsriImageLayerEntryConfig): void {
    commonProcessInitialSettings(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof EsriImageLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView Esri Image layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns { Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);

    // Instance check
    if (!(layerConfig instanceof EsriImageLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {};
    sourceOptions.attributions = [(this.metadata!.copyrightText ? this.metadata!.copyrightText : '') as string];
    sourceOptions.url = getLocalizedValue(layerConfig.source.dataAccessPath!, AppEventProcessor.getDisplayLanguage(this.mapId));
    sourceOptions.params = { LAYERS: `show:${layerConfig.layerId}` };
    if (layerConfig.source.transparent) Object.defineProperty(sourceOptions.params, 'transparent', layerConfig.source.transparent!);
    if (layerConfig.source.format) Object.defineProperty(sourceOptions.params, 'format', layerConfig.source.format!);
    if (layerConfig.source.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }
    if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

    // Create the source
    const source = new ImageArcGISRest(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: ImageLayer<ImageArcGISRest> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<ImageArcGISRest>;
    }

    // If no olLayer was obtained
    if (!olLayer) {
      // We're working in old LAYERS_HYBRID_MODE (in the new mode the code below is handled in the new classes)
      const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
        source,
        properties: { layerConfig },
      };
      // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerConfig.initialSettings?.className !== undefined) imageLayerOptions.className = layerConfig.initialSettings.className;
      if (layerConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerConfig.initialSettings.extent;
      if (layerConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerConfig.initialSettings.maxZoom;
      if (layerConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerConfig.initialSettings.minZoom;
      if (layerConfig.initialSettings?.states?.opacity !== undefined)
        imageLayerOptions.opacity = layerConfig.initialSettings.states.opacity;
      // If a layer on the map has an initialSettings.visible set to false, its status will never reach the status 'loaded' because
      // nothing is drawn on the map. We must wait until the 'loaded' status is reached to set the visibility to false. The call
      // will be done in the layerConfig.loadedFunction() which is called right after the 'loaded' signal.

      // Create the OpenLayer layer
      olLayer = new ImageLayer(imageLayerOptions);

      // Hook the loaded event
      this.setLayerAndLoadEndListeners(layerConfig, olLayer, 'image');
    }

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    return Promise.resolve(olLayer);
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  override onLoaded(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Call parent
    super.onLoaded(layerConfig);

    // Apply view filter immediately
    this.applyViewFilter(layerConfig.layerPath, (layerConfig as EsriImageLayerEntryConfig).layerFilter || '');
  }

  /** ***************************************************************************************************************************
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  // GV Layers Refactoring - Obsolete (in layers)
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter?: boolean): void {
    // Log
    logger.logTraceCore('ESRIImage - applyViewFilter', layerPath);

    const layerConfig = this.getLayerConfig(layerPath) as EsriImageLayerEntryConfig;
    const olLayer = this.getOLLayer(layerPath) as ImageLayer<ImageArcGISRest>;

    // Get source
    const source = olLayer.getSource();
    if (source) {
      let filterValueToUse = filter;
      layerConfig.legendFilterIsOff = !combineLegendFilter;
      if (combineLegendFilter) layerConfig.layerFilter = filter;

      if (filterValueToUse) {
        filterValueToUse = filterValueToUse.replaceAll(/\s{2,}/g, ' ').trim();
        const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
        const dimension = queryElements[0].trim();
        filterValueToUse = queryElements[1].trim();

        // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
        const searchDateEntry = [
          ...`${filterValueToUse} `.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
        ];
        searchDateEntry.reverse();
        searchDateEntry.forEach((dateFound) => {
          // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
          const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
          const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.externalFragmentsOrder, reverseTimeZone);
          filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index! - 6)}${reformattedDate}${filterValueToUse!.slice(
            dateFound.index! + dateFound[0].length + 2
          )}`;
        });
        source.updateParams({ [dimension]: filterValueToUse.replace(/\s*/g, '') });
        olLayer.changed();

        // Emit event
        this.emitLayerFilterApplied({
          layerPath,
          filter: filterValueToUse,
        });
      }
    }
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   *
   * @returns {Extent | undefined} The new layer bounding box.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(layerPath: string): Extent | undefined {
    // Get the metadata extent
    const metadataExtent = this.getMetadataExtent();

    // If found
    let layerBounds;
    if (metadataExtent) {
      // Get the metadata projection
      const metadataProjection = this.getMetadataProjection();
      layerBounds = this.getMapViewer().convertExtentFromProjToMapProj(metadataExtent, metadataProjection);
      layerBounds = validateExtent(layerBounds, this.getMapViewer().getProjection().getCode());
    }

    // Return the calculated layer bounds
    return layerBounds;
  }
}

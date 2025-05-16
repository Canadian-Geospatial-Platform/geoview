import BaseLayer from 'ol/layer/Base';
import { Map as OLMap, Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { Projection as OLProjection } from 'ol/proj';

import { FilterNodeArrayType, NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { analyzeLayerFilter, getAndCreateFeatureStyle } from '@/geo/utils/renderer/geoview-renderer';
import { createAliasLookup, featureInfoGetFieldType, parseDateTimeValuesVector } from '@/geo/layer/gv-layers/utils';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { getExtentUnion, validateExtent } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { NoExtentError } from '@/core/exceptions/geoview-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';

/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export abstract class AbstractGVVector extends AbstractGVLayer {
  /**
   * Constructs a GeoView Vector layer to manage an OpenLayer layer.
   * @param {VectorSource<Feature<Geometry>>} olSource - The OpenLayer source.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig) {
    super(olSource, layerConfig);

    // Get the style label in case we need it later
    const label = layerConfig.layerName || layerConfig.layerId;

    // Create the vector layer options.
    const layerOptions: VectorLayerOptions<VectorSource<Feature<Geometry>>> = {
      properties: { layerConfig },
      source: olSource,
      style: (feature) => {
        return AbstractGVVector.calculateStyleForFeature(
          this as AbstractGVLayer,
          feature as FeatureLike,
          label,
          layerConfig.filterEquation,
          layerConfig.legendFilterIsOff
        );
      },
    };

    // Init the layer options with initial settings
    AbstractGVVector.initOptionsWithInitialSettings(layerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new VectorLayer<VectorSource<Feature<Geometry>>>(layerOptions);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {VectorLayer<Feature>} The OpenLayers Layer
   */
  override getOLLayer(): VectorLayer<VectorSource> {
    // Call parent and cast
    return super.getOLLayer() as VectorLayer<VectorSource>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {VectorSource} The OpenLayers Layer Source
   */
  override getOLSource(): VectorSource {
    // Get source from OL
    return super.getOLSource() as VectorSource;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {VectorLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): VectorLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as VectorLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override getFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getAllFeatureInfo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config in a loaded phase
    const layerConfig = this.getLayerConfig();
    const features = this.getOLSource().getFeatures();
    return Promise.resolve(this.formatFeatureInfoResult(features, layerConfig));
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(map: OLMap, location: Pixel): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer source
    const layerSource = this.getOLSource();

    // Prepare a filter by layer to know on which layer we want to query features
    const layerFilter = (layerCandidate: BaseLayer): boolean => {
      // We know it's the right layer to query on if the source is the same as the current layer
      const candidateSource = layerCandidate.get('source');
      return layerSource && candidateSource && layerSource === candidateSource;
    };

    // Query the map using the layer filter and a hit tolerance
    const features = map.getFeaturesAtPixel(location, {
      hitTolerance: this.getHitTolerance(),
      layerFilter,
    }) as Feature[];

    // Format and return the features
    return Promise.resolve(this.formatFeatureInfoResult(features, this.getLayerConfig()));
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(map, map.getPixelFromCoordinate(location));
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At LongLat from.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtLongLat(
    map: OLMap,
    lnglat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Convert Coordinates LngLat to map projection
    const projCoordinate = Projection.transformFromLonLat(lnglat, map.getView().getProjection());

    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(map, map.getPixelFromCoordinate(projCoordinate));
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  protected override onLoaded(event: unknown): void {
    // Check if first time
    const firstTime = !this.loadedOnce;

    // Call parent
    super.onLoaded(event);

    // If first time
    if (firstTime) {
      // If there's a filter that should be applied
      if (this.getLayerConfig().layerFilter) {
        // Apply view filter immediately
        this.applyViewFilter(this.getLayerConfig().layerFilter!);
      }
    }
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - A filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(filter: string, combineLegendFilter: boolean = true): void {
    // Log
    logger.logTraceCore('ABSTRACT-GV-VECTOR - applyViewFilter', this.getLayerPath());

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    // Update the layer config on the fly (maybe not ideal to do this?)
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    if (combineLegendFilter) layerConfig.layerFilter = filter;

    // Parse the filter value to use
    let filterValueToUse: string = filter.replaceAll(/\s{2,}/g, ' ').trim();

    try {
      // Parse is some more for the dates
      filterValueToUse = parseDateTimeValuesVector(filterValueToUse, this.getExternalFragmentsOrder());

      // Analyze the layer filter
      const filterEquation = analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue: filterValueToUse }]);
      layerConfig.filterEquation = filterEquation;
    } catch (error: unknown) {
      // Failed
      throw new LayerInvalidLayerFilterError(
        layerConfig.layerPath,
        layerConfig.getLayerName(),
        filterValueToUse,
        this.getLayerFilter(),
        formatError(error)
      );
    }

    olLayer.changed();

    // Emit event
    this.emitLayerFilterApplied({
      filter: filterValueToUse,
    });
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection();

    // Get the layer bounds
    let sourceExtent = this.getOLSource()?.getExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }

  /**
   * Gets the extent of an array of features.
   * @param {string[]} objectIds - The uids of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string?} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Get the feature source
    const source = this.getOLLayer().getSource();

    // Get array of features and only keep the ones we could find by id
    const requestedFeatures = objectIds.map((id) => source?.getFeatureById(id)).filter((feature) => !!feature);

    // Determine max extent from features
    let calculatedExtent: Extent | undefined;
    requestedFeatures.forEach((feature) => {
      // Get the geometry
      const geom = feature.getGeometry();
      if (geom) {
        // Get the extent
        const extent = geom.getExtent();
        if (extent) {
          // If calculatedExtent has not been defined, set it to extent
          if (!calculatedExtent) calculatedExtent = extent;
          else getExtentUnion(calculatedExtent, extent);
        }
      }
    });

    // If no calculated extent
    if (!calculatedExtent) throw new NoExtentError(this.getLayerPath());

    // Resolve
    return Promise.resolve(calculatedExtent);
  }

  /**
   * Calculates a style for the given feature, based on the layer current style and options.
   * @param {AbstractGVLayer} layer - The layer on which to work for the style.
   * @param {FeatureLike} feature - Feature that need its style to be defined.
   * @param {string} label - The style label when one has to be created
   * @param {FilterNodeArrayType} filterEquation - Filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
   * @returns {Style} The style for the feature
   */
  static calculateStyleForFeature(
    layer: AbstractGVLayer,
    feature: FeatureLike,
    label: string,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    // Get the style
    const style = layer.getStyle() || {};

    // Create lookup dictionary of names to alias
    const outfields = (layer.getLayerConfig() as VectorLayerEntryConfig).source?.featureInfo?.outfields;
    const aliasLookup = createAliasLookup(outfields);

    // Get and create Feature style if necessary
    return getAndCreateFeatureStyle(feature, style, label, filterEquation, legendFilterIsOff, aliasLookup, (geometryType, theStyle) => {
      // A new style has been created
      logger.logDebug('A new style has been created on-the-fly', geometryType, layer);
      // Update the layer style
      layer.setStyle({
        ...style,
        [geometryType]: { type: 'simple', hasDefault: false, fields: [], info: [theStyle] },
      });
    });
  }
}

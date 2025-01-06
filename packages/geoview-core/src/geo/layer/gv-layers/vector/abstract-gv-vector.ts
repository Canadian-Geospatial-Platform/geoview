import BaseLayer from 'ol/layer/Base';
import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { ProjectionLike } from 'ol/proj';

import { DateMgt } from '@/core/utils/date-mgt';
import { FilterNodeArrayType, NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { analyzeLayerFilter, getAndCreateFeatureStyle } from '@/geo/utils/renderer/geoview-renderer';
import { featureInfoGetFieldType } from '../utils';
import { AbstractGVLayer } from '../abstract-gv-layer';
import { getExtentUnion } from '@/geo/utils/utilities';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';

/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export abstract class AbstractGVVector extends AbstractGVLayer {
  /**
   * Constructs a GeoView Vector layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {VectorSource<Feature<Geometry>>} olSource - The OpenLayer source.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(mapId: string, olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

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
  // Disabling 'any', because too many renderer types in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): VectorLayer<VectorSource> {
    // Call parent and cast
    // Disabling 'any', because too many renderer types in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getAllFeatureInfo(): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();
      const features = this.getOLSource()!.getFeatures();
      return this.formatFeatureInfoResult(features, layerConfig);
    } catch (error) {
      // Log
      logger.logError('abstract-gv-vector.getAllFeatureInfo()\n', error);
      return Promise.resolve(null);
    }
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {Coordinate} location - The pixel coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer source
      const layerSource = this.getOLSource();

      // Prepare a filter by layer to know on which layer we want to query features
      const layerFilter = (layerCandidate: BaseLayer): boolean => {
        // We know it's the right layer to query on if the source is the same as the current layer
        const candidateSource = layerCandidate.get('source');
        return layerSource && candidateSource && layerSource === candidateSource;
      };

      // Query the map using the layer filter and a hit tolerance
      const features = this.getMapViewer().map.getFeaturesAtPixel(location, { hitTolerance: this.hitTolerance, layerFilter }) as Feature[];

      // Format and return the features
      return this.formatFeatureInfoResult(features, this.getLayerConfig());
    } catch (error) {
      // Log
      logger.logError('abstract-gv-vector.getFeatureInfoAtPixel()\n', error);
      return Promise.resolve(null);
    }
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(this.getMapViewer().map.getPixelFromCoordinate(location));
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtLongLat(lnglat: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Convert Coordinates LngLat to map projection
    const projCoordinate = this.getMapViewer().convertCoordinateLngLatToMapProj(lnglat);

    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(this.getMapViewer().map.getPixelFromCoordinate(projCoordinate));
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  protected override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately
    this.applyViewFilter(this.getLayerConfig().layerFilter || '');
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - A filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(filter: string, combineLegendFilter = true): void {
    // Log
    logger.logTraceCore('ABSTRACT-GV-VECTOR - applyViewFilter', this.getLayerPath());

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    if (combineLegendFilter) layerConfig.layerFilter = filter;

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    // TODO: Standardize the regex across all layer types
    // OLD REGEX, not working anymore, test before standardization
    //   ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
    //     /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
    //   ),
    const searchDateEntry = [
      ...filterValueToUse.matchAll(
        /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/gi
      ),
    ];

    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.getExternalFragmentsOrder(), reverseTimeZone);
      filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
        dateFound.index! + dateFound[0].length
      )}`;
    });

    try {
      const filterEquation = analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue: filterValueToUse }]);
      layerConfig.filterEquation = filterEquation;
    } catch (error) {
      throw new Error(
        `Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${this.getLayerFilter()}\ninternal filter = ${filterValueToUse}`
      );
    }

    olLayer.changed();

    // Emit event
    this.emitLayerFilterApplied({
      filter: filterValueToUse,
    });
  }

  /**
   * Gets the bounds of the layer and returns updated bounds.
   * @returns {Extent | undefined} The layer bounding box.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(): Extent | undefined {
    const sourceExtent = this.getOLSource().getExtent();

    // Return the calculated layer bounds
    return sourceExtent;
  }

  /**
   * Gets the extent of an array of features.
   * @param {string[]} objectIds - The uids of the features to calculate the extent from.
   * @returns {Promise<Extent | undefined>} The extent of the features, if available.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  override getExtentFromFeatures(objectIds: string[]): Promise<Extent | undefined> {
    // Get array of features
    const requestedFeatures = objectIds.map((id) => this.getOLLayer().getSource()?.getFeatureById(id));

    if (requestedFeatures) {
      // Determine max extent from features
      let calculatedExtent: Extent | undefined;
      requestedFeatures.forEach((feature) => {
        if ((feature as unknown as Feature)?.getGeometry()) {
          const extent = (feature as unknown as Feature).getGeometry()?.getExtent();
          if (extent) {
            // If calculatedExtent has not been defined, set it to extent
            if (!calculatedExtent) calculatedExtent = extent;
            else getExtentUnion(calculatedExtent, extent);
          }
        }
      });

      return Promise.resolve(calculatedExtent);
    }
    return Promise.resolve(undefined);
  }

  /**
   * Return the vector layer as a GeoJSON object
   * @returns {JSON} Layer's features as GeoJSON
   */
  getFeaturesAsGeoJSON(): JSON {
    // Get map projection
    const mapProjection: ProjectionLike = this.getMapViewer().getProjection().getCode();

    const format = new FormatGeoJSON();
    const geoJsonStr = format.writeFeatures((this.getOLLayer() as VectorLayer<VectorSource>).getSource()!.getFeatures(), {
      dataProjection: 'EPSG:4326', // Output projection,
      featureProjection: mapProjection,
    });

    return JSON.parse(geoJsonStr);
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

    // Get and create Feature style if necessary
    return getAndCreateFeatureStyle(feature, style, label, filterEquation, legendFilterIsOff, (geometryType, theStyle) => {
      // A new style has been created
      logger.logDebug('A new style has been created on-the-fly', geometryType, layer);
      // Update the layer style
      layer.setStyle({
        ...style,
        ...{ [geometryType]: { type: 'simple', hasDefault: false, fields: [], info: [theStyle] } },
      });
    });
  }
}

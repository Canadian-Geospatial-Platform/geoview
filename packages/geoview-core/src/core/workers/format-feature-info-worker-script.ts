import { expose } from 'comlink';

import Feature from 'ol/Feature';
import { createWorkerLogger } from '@/core/workers/helper/logger-worker';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { getFeatureCanvas } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { codedValueType, rangeDomainType, TypeOutfieldsType } from '@/api/config/types/map-schema-types';

// Initialize the worker logger
const logger = createWorkerLogger('format-feature-info-worker');

/**
 * Converts the feature information to an array of TypeFeatureInfoEntry[] | undefined | null.
 * @param {Feature[]} features - The array of features to convert.
 * @param {AbstractGVLayer} layer - The layer.
 * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The Array of feature information.
 */
async function formatFeatureInfoResult(features: Feature[], layer: AbstractGVLayer): Promise<TypeFeatureInfoEntry[] | undefined | null> {
  const layerConfig = layer.getLayerConfig() as OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig;
  const outfields = layerConfig.source?.featureInfo?.outfields;

  // Loop on the features to build the array holding the promises for their canvas
  const promisedAllCanvasFound: Promise<{ feature: Feature; canvas: HTMLCanvasElement }>[] = [];
  features.forEach((featureNeedingItsCanvas) => {
    promisedAllCanvasFound.push(
      new Promise((resolveCanvas) => {
        // GV: Callback function was added by PR #1997 and removed by #2590
        // The PR added an AsyncSemaphore with a callback on geoview renderer to be able to fetch an image with a dataurl from the kernel function geoview-renderer.getFeatureCanvas()

        // GV: Call the function with layerConfig.legendFilterIsOff = true to force the feature to get is canvas
        // GV: If we don't, it will create canvas only for visible elements and because tables are stored feature will never get its canvas
        getFeatureCanvas(featureNeedingItsCanvas, layer.getStyle()!, layerConfig.filterEquation, true, true)
          .then((canvas) => {
            resolveCanvas({ feature: featureNeedingItsCanvas, canvas });
          })
          .catch((error) => {
            // Log
            logger.logError('getFeatureCanvas in featureNeedingItsCanvas loop in formatFeatureInfoResult in AbstractGVLayer', error);
          });
      })
    );
  });

  // Hold a dictionary built on the fly for the field domains
  const dictFieldDomains: { [fieldName: string]: codedValueType | rangeDomainType | null } = {};
  // Hold a dictionary build on the fly for the field types
  const dictFieldTypes: { [fieldName: string]: TypeOutfieldsType } = {};

  // Loop on the promised feature infos
  let featureKeyCounter = 0;
  let fieldKeyCounter = 0;
  const queryResult: TypeFeatureInfoEntry[] = [];
  const arrayOfFeatureInfo = await Promise.all(promisedAllCanvasFound);
  arrayOfFeatureInfo.forEach(({ feature, canvas }) => {
    let extent;
    if (feature.getGeometry()) extent = feature.getGeometry()!.getExtent();

    const featureInfoEntry: TypeFeatureInfoEntry = {
      // feature key for building the data-grid
      featureKey: featureKeyCounter++,
      geoviewLayerType: layerConfig.geoviewLayerConfig.geoviewLayerType,
      extent,
      geometry: feature,
      featureIcon: canvas.toDataURL(),
      fieldInfo: {},
      nameField: layerConfig.source?.featureInfo?.nameField || null,
    };

    const featureFields = feature.getKeys();
    featureFields.forEach((fieldName) => {
      if (fieldName !== 'geometry') {
        // Calculate the field domain if not already calculated
        if (!(fieldName in dictFieldDomains)) {
          // Calculate it
          dictFieldDomains[fieldName] = layer.getFieldDomain(fieldName);
        }
        const fieldDomain = dictFieldDomains[fieldName];

        // Calculate the field type if not already calculated
        if (!(fieldName in dictFieldTypes)) {
          dictFieldTypes[fieldName] = layer.getFieldType(fieldName);
        }
        const fieldType = dictFieldTypes[fieldName];
        const fieldEntry = outfields?.find((outfield) => outfield.name === fieldName || outfield.alias === fieldName);
        if (fieldEntry) {
          featureInfoEntry.fieldInfo[fieldEntry.name] = {
            fieldKey: fieldKeyCounter++,
            value:
              // If fieldName is the alias for the entry, we will not get a value, so we try the fieldEntry name.
              layer.getFieldValue(feature, fieldName, fieldEntry!.type as 'string' | 'number' | 'date') ||
              layer.getFieldValue(feature, fieldEntry.name, fieldEntry!.type as 'string' | 'number' | 'date'),
            dataType: fieldEntry!.type,
            alias: fieldEntry!.alias,
            domain: fieldDomain,
          };
        } else if (!outfields) {
          featureInfoEntry.fieldInfo[fieldName] = {
            fieldKey: fieldKeyCounter++,
            value: layer.getFieldValue(feature, fieldName, fieldType),
            dataType: fieldType,
            alias: fieldName,
            domain: fieldDomain,
          };
        }
      }
    });

    queryResult.push(featureInfoEntry);
  });

  return queryResult;
}

/**
 * The main worker object containing methods for initialization and processing.
 */
const worker = {
  /**
   * Initializes the worker.
   */
  init(): void {
    try {
      logger.logTrace('FormatFeatureInfoWorker initialized');
    } catch {
      logger.logError('FormatFeatureInfoWorker failed to initialize');
    }
  },

  /**
   * Processes a feature info formatting request.
   * @param {Feature[]} features - The array of features to convert.
   * @param {AbstractGVLayer} layer - The layer.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The Array of feature information.
   */
  process(features: Feature[], layer: AbstractGVLayer): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      logger.logTrace('Starting feature formatting');
      const formattedFeatureInfo = formatFeatureInfoResult(features, layer);
      logger.logTrace('Formatting completed');
      return formattedFeatureInfo;
    } catch (error) {
      logger.logError('Feature formatting failed', error);
      throw error;
    }
  },
};

// Expose the worker methods to be accessible from the main thread
expose(worker);
export default {} as typeof Worker & { new (): Worker };

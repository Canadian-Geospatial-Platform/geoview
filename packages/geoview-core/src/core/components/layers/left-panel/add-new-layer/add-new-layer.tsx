import React, { ChangeEvent, useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectChangeEvent, useTheme } from '@mui/material';
import {
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  ButtonPropsLayerPanel,
  CheckBoxIcon,
  CheckBoxOutlineBlankIcon,
  Checkbox,
  CircularProgressBase,
  FileUploadIcon,
  Paper,
  Select,
  Stepper,
  TextField,
} from '@/ui';
import { Projection } from '@/geo/utils/projection';
import { OgcFeature, TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { TypeWMSLayerConfig, WMS as WmsGeoviewClass } from '@/geo/layer/geoview-layers/raster/wms';
import { TypeWFSLayerConfig, WFS as WfsGeoviewClass } from '@/geo/layer/geoview-layers/vector/wfs';
import { TypeCSVLayerConfig, CSV as CsvGeoviewClass } from '@/geo/layer/geoview-layers/vector/csv';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';
import { EsriImage, TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { GeoCore } from '@/geo/layer/other/geocore';
import { GeoViewLayerAddedResult, LayerApi } from '@/geo/layer/layer';
import {
  CONST_LAYER_TYPES,
  TypeGeoviewLayerTypeWithGeoCore,
  AbstractGeoViewLayer,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { EsriDynamic, TypeEsriDynamicLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeXYZTilesConfig, XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { EsriFeature, TypeEsriFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { GeoJSON, TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { ConfigValidation } from '@/core/utils/config/config-validation';

type EsriOptions = {
  err: string;
  capability: string;
};

export function AddNewLayer(): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-new-layer/add-new-layer');

  const { t } = useTranslation<string>();
  const theme = useTheme();

  // TODO: refactor - add the Geopacakges when refactor is done GEOPACKAGE
  const { CSV, ESRI_DYNAMIC, ESRI_FEATURE, ESRI_IMAGE, GEOJSON, WMS, WFS, OGC_FEATURE, XYZ_TILES } = CONST_LAYER_TYPES;
  const { GEOCORE } = CONST_LAYER_ENTRY_TYPES;

  const [geoviewLayerInstance, setGeoviewLayerInstance] = useState<AbstractGeoViewLayer | undefined>();
  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [displayURL, setDisplayURL] = useState('');
  const [layerType, setLayerType] = useState<TypeGeoviewLayerTypeWithGeoCore | ''>('');
  const [layerList, setLayerList] = useState<TypeLayerEntryConfig[] | TypeGeoviewLayerConfig[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerEntries, setLayerEntries] = useState<TypeLayerEntryConfig[] | TypeGeoviewLayerConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);
  const [hasMetadata, setHasMetadata] = useState<boolean>(false);
  const [stepButtonDisable, setStepButtonDisable] = useState<boolean>(true);

  const dragPopover = useRef(null);
  const uploadBtnRef = useRef<HTMLButtonElement>(null);
  const serviceTypeRef = useRef<HTMLDivElement>(null);
  const isMultipleRef = useRef<HTMLDivElement>(null);
  const isMultipleTextFieldRef = useRef<HTMLDivElement>(null);

  // get values from store
  const mapId = useGeoViewMapId();
  const { setDisplayState } = useLayerStoreActions();

  const isMultiple = (): boolean =>
    hasMetadata && (layerType === ESRI_DYNAMIC || layerType === WFS || layerType === WMS || layerType === GEOJSON);

  /**
   * List of layer types and labels
   */
  const layerOptions = [
    [CSV, 'CSV'],
    [ESRI_DYNAMIC, 'ESRI Dynamic Service'],
    [ESRI_FEATURE, 'ESRI Feature Service'],
    [ESRI_IMAGE, 'ESRI Image Service'],
    [GEOJSON, 'GeoJSON'],
    [WMS, 'OGC Web Map Service (WMS)'],
    [WFS, 'OGC Web Feature Service (WFS)'],
    [OGC_FEATURE, 'OGC API Features'],
    [XYZ_TILES, 'XYZ Raster Tiles'],
    [GEOCORE, 'GeoCore'],
  ];

  const sxClasses = {
    buttonGroup: {
      paddingTop: 12,
      gap: 6,
    },
  };

  /**
   * Returns the appropriate error config for ESRI layer types
   *
   * @param type one of esriDynamic or esriFeature
   * @returns {EsriOptions} an error configuration object for populating dialogues
   */
  const esriOptions = (type: string): EsriOptions => {
    switch (type) {
      case ESRI_DYNAMIC:
        return { err: 'ESRI Map', capability: 'Map' };
      case ESRI_FEATURE:
        return { err: 'ESRI Feature', capability: 'Query' };
      default:
        return { err: '', capability: '' };
    }
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorEmpty = (textField: string): void => {
    setIsLoading(false);
    api.maps[mapId].notifications.showError(`${textField} ${t('layers.errorEmpty')}`, [], false);
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorNone = (): void => {
    setIsLoading(false);
    api.maps[mapId].notifications.showError('layers.errorNone', [], false);
  };

  /**
   * Emits an error dialogue when unsupported files are uploaded
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorFile = (): void => {
    api.maps[mapId].notifications.showError('layers.errorFile', [], false);
  };

  /**
   * Emits an error when the URL does not support the selected service type
   *
   * @param serviceName type of service provided by the URL
   */
  const emitErrorServer = (serviceName: string): void => {
    setIsLoading(false);
    api.maps[mapId].notifications.showError(`${serviceName} ${t('layers.errorServer')}`, [], false);
  };

  /**
   * Emits an error when a service does not support the current map projection
   *
   * @param serviceName type of service provided by the URL
   * @param proj current map projection
   */
  const emitErrorProj = (serviceName: string, proj: string | undefined, supportedProj: TypeJsonArray | string[]): void => {
    setIsLoading(false);
    const message = `${serviceName} ${t('layers.errorProj')} ${proj}, ${t('layers.only')} ${supportedProj.join(', ')}`;
    api.maps[mapId].notifications.showError(message, [], false);
  };

  // TODO: REFACTOR ALL VALIDATION!!!
  // TO.DOCONT: All validation MUST be refactored. For the moment they are creating config entries to be able to produce the needed
  // TO.DOCONT: information for user to select the layer he wants. In the refactor we NEED single function to read metadata from url
  // TO.DOCONT: and service type. At this point no layer or neither config is created, metadata is read to create the selection tree (step 3)
  // TO.DOCONT: Once the user has selected the layers he wants, we create the config snippet and start the config validation process.

  /**
   * Using the layerURL state object, check whether URL is a valid WMS,
   * and add either Name and Entry directly to state if a single layer,
   * or a list of Names / Entries if multiple layer options exist.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  // TODO: Move all the validations in a utility add layer file inside geo. Also delete old utilities that were used
  // TO.DOCONT: in the previous version.
  const wmsValidation = async (): Promise<boolean> => {
    const proj = Projection.PROJECTIONS[api.maps[mapId].getMapState().currentProjection].getCode();
    let supportedProj: string[] = [];

    try {
      const [accessPath, queryString] = layerURL.split('?');
      const urlParams = new URLSearchParams(queryString);
      const paramLayers = urlParams.get('layers')?.split(',') || [];
      // query layers are not sent, as not all services support asking for multiple layers
      const wmsGeoviewLayerConfig = {
        geoviewLayerType: WMS,
        listOfLayerEntryConfig: [] as OgcWmsLayerEntryConfig[],
        metadataAccessPath: accessPath,
      } as TypeWMSLayerConfig;
      const wmsGeoviewLayerInstance = new WmsGeoviewClass(mapId, wmsGeoviewLayerConfig, LayerApi.DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS);
      // Synchronize the geoviewLayerId.
      wmsGeoviewLayerConfig.geoviewLayerId = wmsGeoviewLayerInstance.geoviewLayerId;
      setGeoviewLayerInstance(wmsGeoviewLayerInstance);
      await wmsGeoviewLayerInstance.createGeoViewLayers();
      if (!wmsGeoviewLayerInstance.metadata) throw new Error('Cannot get metadata');
      setHasMetadata(true);
      const wmsMetadata = wmsGeoviewLayerInstance.metadata;

      if (!wmsMetadata) {
        emitErrorServer('OGC WMS');
        return false;
      }

      supportedProj = wmsMetadata.Capability.Layer.CRS as string[];
      if (!supportedProj.includes(proj)) throw new Error('proj');

      const layers: OgcWmsLayerEntryConfig[] = [];

      const hasChildLayers = (layer: TypeJsonObject): void => {
        if (layer.Layer && (layer.Layer as TypeJsonArray).length > 0) {
          (layer.Layer as TypeJsonObject[]).forEach((childLayer: TypeJsonObject) => {
            const name = childLayer.Name as string;

            // if there is no paramLayers, take them all; If there is paramLayers must be included in layers parameter from url
            if (paramLayers.length === 0 || paramLayers.includes(name)) {
              logger.logDebug('NAME', name);
              layers.push(
                new OgcWmsLayerEntryConfig({
                  geoviewLayerConfig: wmsGeoviewLayerConfig,
                  layerId: childLayer.Name as string,
                  layerName: childLayer.Title as string,
                } as unknown as OgcWmsLayerEntryConfig)
              );
            }

            hasChildLayers(childLayer);
          });
        }
      };

      if (wmsMetadata.Capability.Layer) {
        hasChildLayers(wmsMetadata.Capability.Layer);
      }

      if (layers.length === 1) {
        setLayerName(layers[0].layerName!);
        setLayerEntries([layers[0]]);
      } else {
        setLayerList(layers);
      }
    } catch (error) {
      // Log error
      logger.logError(error);
      if ((error as Error).message === 'proj') {
        emitErrorProj('WMS', proj, supportedProj);
      } else {
        emitErrorServer('WMS');
      }
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid WFS,
   * and add either Name and Entry directly to state if a single layer,
   * or a list of Names / Entries if multiple layer options exist.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const wfsValidation = async (): Promise<boolean> => {
    try {
      const wfsGeoviewLayerConfig = {
        geoviewLayerType: WFS,
        listOfLayerEntryConfig: [] as WfsLayerEntryConfig[],
        metadataAccessPath: layerURL,
      } as TypeWFSLayerConfig;
      const wfsGeoviewLayerInstance = new WfsGeoviewClass(mapId, wfsGeoviewLayerConfig);
      // Synchronize the geoviewLayerId.
      wfsGeoviewLayerConfig.geoviewLayerId = wfsGeoviewLayerInstance.geoviewLayerId;
      setGeoviewLayerInstance(wfsGeoviewLayerInstance);
      await wfsGeoviewLayerInstance.createGeoViewLayers();
      if (!wfsGeoviewLayerInstance.metadata) throw new Error('Cannot get metadata');
      setHasMetadata(true);
      const wfsMetadata = wfsGeoviewLayerInstance.metadata;
      const layers = (wfsMetadata.FeatureTypeList.FeatureType as TypeJsonArray).map(
        (aFeatureType) =>
          new WfsLayerEntryConfig({
            geoviewLayerConfig: wfsGeoviewLayerConfig,
            layerId: (aFeatureType.Name['#text'] as string).split(':')[1] as string,
            layerName: aFeatureType.Title['#text'] as string,
          } as WfsLayerEntryConfig)
      );

      if (layers.length === 1) {
        setLayerName(layers[0].layerName as string);
        setLayerEntries([layers[0]]);
      } else {
        setLayerList(layers);
      }
    } catch (error) {
      emitErrorServer('WFS');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid OGC API. You can either provide a single
   * layer URL or the root OGC API where the user can select any number of layers in the collection
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const ogcFeatureValidation = async (): Promise<boolean> => {
    try {
      const ogcFeatureGeoviewLayerConfig = {
        geoviewLayerType: OGC_FEATURE,
        listOfLayerEntryConfig: [] as OgcFeatureLayerEntryConfig[],
        metadataAccessPath: layerURL.split('collections')[0],
      } as TypeOgcFeatureLayerConfig;
      const ogcFeatureInstance = new OgcFeature(mapId, ogcFeatureGeoviewLayerConfig);
      // Synchronize the geoviewLayerId.
      ogcFeatureGeoviewLayerConfig.geoviewLayerId = ogcFeatureInstance.geoviewLayerId;
      setGeoviewLayerInstance(ogcFeatureInstance);
      await ogcFeatureInstance.createGeoViewLayers();
      const ogcFeatureMetadata = ogcFeatureInstance.metadata!;
      if (!ogcFeatureInstance.metadata) throw new Error('Cannot get metadata');
      setHasMetadata(true);

      if (!Object.keys(ogcFeatureMetadata).length) {
        emitErrorServer('OGC API Feature');
        return false;
      }

      // TODO: this type of query is not implemented in the ogc feature class. When we have time, we Should add
      // TODOCONT: it to the code.
      /*
      const keysSingleLayer = ['id', 'title'];
      const isSingleLayerValid = keysSingleLayer.every((key) => Object.keys(ogcFeatureMetadata).includes(key));
      if (isSingleLayerValid) {
        setLayerEntries([
          new TypeOgcFeatureLayerEntryConfig({
            layerId: ogcFeatureMetadata.id as string,
            layerName: ogcFeatureMetadata.title as string,
          } as TypeOgcFeatureLayerEntryConfig),
        ]);
        setLayerName(ogcFeatureMetadata.title as string);
        return true;
      }
      */

      const keys = ['collections', 'links'];
      const isCollectionValid = keys.every((key) => Object.keys(ogcFeatureMetadata).includes(key));
      if (!isCollectionValid) throw new Error('err');

      // If there is collections, only the selected collection is set
      let layers: OgcFeatureLayerEntryConfig[] = [];
      if (layerURL.split('/collections/').length === 2) {
        (ogcFeatureMetadata.collections as TypeJsonArray).forEach((aFeatureType) => {
          if (layerURL.split('/collections/')[1] === aFeatureType.id) {
            layers.push(
              new OgcFeatureLayerEntryConfig({
                geoviewLayerConfig: ogcFeatureGeoviewLayerConfig,
                layerId: aFeatureType.id as string,
                layerName: aFeatureType.title as string,
              } as OgcFeatureLayerEntryConfig)
            );
          }
        });
      }

      // if there is no collections in url, or layers not set properly from provided collection take them all;
      if (layers.length === 0) {
        layers = (ogcFeatureMetadata.collections as TypeJsonArray).map(
          (aFeatureType) =>
            new OgcFeatureLayerEntryConfig({
              geoviewLayerConfig: ogcFeatureGeoviewLayerConfig,
              layerId: aFeatureType.id as string,
              layerName: aFeatureType.title as string,
            } as OgcFeatureLayerEntryConfig)
        );
      }

      if (layers.length === 1) {
        setLayerName(layers[0].layerName!);
        setLayerEntries([layers[0]]);
      } else {
        setLayerList(layers);
      }
    } catch (error) {
      emitErrorServer('OGC API Feature');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid Geocore UUID.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const geocoreValidation = async (): Promise<boolean> => {
    try {
      const isValid = layerURL.indexOf('/') === -1 && layerURL.replaceAll('-', '').length === 32;
      if (!isValid) throw new Error('err');

      const geoCoreGeoviewLayerInstance = new GeoCore(mapId, api.maps[mapId].getDisplayLanguage());
      const layers = await geoCoreGeoviewLayerInstance.createLayersFromUUID(layerURL);
      if (layers.length === 1) {
        if (layers.length === 1) {
          setLayerName(layers[0].geoviewLayerName!);
          setLayerEntries(layers);
        } else {
          setLayerList(layers);
        }
      }
    } catch (error) {
      emitErrorServer('GeoCore UUID');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid ESRI Server,
   * and add either Name and Entry directly to state if a single layer,
   * or a list of Names / Entries if multiple layer options exist.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const esriValidation = async (type: string): Promise<boolean> => {
    try {
      const esriGeoviewLayerConfig =
        type === ESRI_DYNAMIC
          ? ({
              geoviewLayerType: type,
              listOfLayerEntryConfig: [] as EsriDynamicLayerEntryConfig[],
              metadataAccessPath: layerURL,
            } as TypeEsriDynamicLayerConfig)
          : ({
              geoviewLayerType: type,
              listOfLayerEntryConfig: [] as EsriFeatureLayerEntryConfig[],
              metadataAccessPath: layerURL.substring(0, layerURL.lastIndexOf('/')),
            } as TypeEsriFeatureLayerConfig);
      const esriGeoviewLayerInstance =
        type === ESRI_DYNAMIC
          ? new EsriDynamic(mapId, esriGeoviewLayerConfig as TypeEsriDynamicLayerConfig)
          : new EsriFeature(mapId, esriGeoviewLayerConfig as TypeEsriFeatureLayerConfig);
      // Synchronize the geoviewLayerId.
      esriGeoviewLayerConfig.geoviewLayerId = esriGeoviewLayerInstance.geoviewLayerId;
      setGeoviewLayerInstance(esriGeoviewLayerInstance);
      await esriGeoviewLayerInstance.createGeoViewLayers();
      const esriMetadata = esriGeoviewLayerInstance.metadata!;
      if (!esriMetadata) throw new Error('Cannot get metadata');
      setHasMetadata(true);
      if (esriMetadata !== null && (esriMetadata.capabilities as string).includes(esriOptions(type).capability)) {
        if ('layers' in esriMetadata) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layers: any = [];
          if (type === ESRI_DYNAMIC) {
            (esriMetadata.layers as TypeJsonArray).forEach((aLayer) =>
              layers.push(
                new EsriDynamicLayerEntryConfig({
                  geoviewLayerConfig: esriGeoviewLayerConfig,
                  layerId: aLayer.id as string,
                  schemaTag: CONST_LAYER_TYPES.ESRI_DYNAMIC,
                  layerName: aLayer.name as string,
                } as EsriDynamicLayerEntryConfig)
              )
            );
          } else {
            layers.push(
              new EsriFeatureLayerEntryConfig({
                geoviewLayerConfig: esriGeoviewLayerConfig,
                layerId:
                  layerURL.split('/').pop()?.toLowerCase() !== 'mapserver' && layerURL.split('/').pop()?.toLowerCase() !== 'featureserver'
                    ? layerURL.split('/').pop()
                    : (esriMetadata.layers[0].id as string),
                schemaTag: CONST_LAYER_TYPES.ESRI_FEATURE,
                layerName: esriMetadata.layers[0].name as string,
              } as EsriFeatureLayerEntryConfig)
            );
          }

          if (layers.length === 1) {
            setLayerName(layers[0].layerName);
            setLayerEntries([layers[0]]);
          } else {
            setLayerList(layers);
          }
        }
      } else {
        throw new Error('err');
      }
    } catch (error) {
      emitErrorServer(esriOptions(type).err);
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid ESRI Image.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const esriImageValidation = async (): Promise<boolean> => {
    try {
      const esriImageGeoviewLayerConfig = {
        geoviewLayerType: ESRI_IMAGE,
        listOfLayerEntryConfig: [] as EsriImageLayerEntryConfig[],
        metadataAccessPath: layerURL,
      } as TypeEsriImageLayerConfig;
      const esriImageGeoviewLayerInstance = new EsriImage(mapId, esriImageGeoviewLayerConfig);
      // Synchronize the geoviewLayerId.
      esriImageGeoviewLayerConfig.geoviewLayerId = esriImageGeoviewLayerInstance.geoviewLayerId;
      setGeoviewLayerInstance(esriImageGeoviewLayerInstance);
      await esriImageGeoviewLayerInstance.createGeoViewLayers();
      const layers = [
        new EsriImageLayerEntryConfig({
          geoviewLayerConfig: esriImageGeoviewLayerConfig,
          layerId: esriImageGeoviewLayerConfig.geoviewLayerId,
          schemaTag: CONST_LAYER_TYPES.ESRI_IMAGE,
          layerName: typeof esriImageGeoviewLayerInstance.metadata?.name === 'string' ? esriImageGeoviewLayerInstance.metadata?.name : '',
          source: {
            dataAccessPath: layerURL,
          },
        } as EsriImageLayerEntryConfig),
      ];
      setLayerName(layers[0].layerName!);
      setLayerEntries([layers[0]]);
    } catch (error) {
      emitErrorServer('ESRI Image');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid XYZ Server.
   *
   * @returns {boolean} True if layer passes validation
   */
  const xyzValidation = async (): Promise<boolean> => {
    try {
      const tiles = ['{x}', '{y}', '{z}'];
      for (let i = 0; i < tiles.length; i += 1) {
        if (!layerURL.includes(tiles[i])) {
          emitErrorServer('XYZ Tile');
          return false;
        }
      }
      const xyzGeoviewLayerConfig = {
        geoviewLayerType: XYZ_TILES,
        listOfLayerEntryConfig: [] as XYZTilesLayerEntryConfig[],
      } as TypeXYZTilesConfig;
      const xyzGeoviewLayerInstance = new XYZTiles(mapId, xyzGeoviewLayerConfig);
      // Synchronize the geoviewLayerId.
      xyzGeoviewLayerConfig.geoviewLayerId = xyzGeoviewLayerInstance.geoviewLayerId;
      setGeoviewLayerInstance(xyzGeoviewLayerInstance);
      await xyzGeoviewLayerInstance.createGeoViewLayers();
      setHasMetadata(false);
      const layers = [
        new XYZTilesLayerEntryConfig({
          geoviewLayerConfig: xyzGeoviewLayerConfig,
          layerId: xyzGeoviewLayerConfig.geoviewLayerId,
          schemaTag: CONST_LAYER_TYPES.XYZ_TILES,
          layerName: '',
          source: {
            dataAccessPath: layerURL,
          },
        } as XYZTilesLayerEntryConfig),
      ];
      setLayerName(layers[0].layerName!);
      setLayerEntries([layers[0]]);
    } catch (error) {
      emitErrorServer('XYZ Tile');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid CSV file.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const csvValidation = async (): Promise<boolean> => {
    try {
      // We assume a single CSV file is present
      setHasMetadata(false);
      const csvGeoviewLayerConfig = {
        geoviewLayerType: CSV,
        listOfLayerEntryConfig: [] as CsvLayerEntryConfig[],
      } as TypeCSVLayerConfig;
      const csvGeoviewLayerInstance = new CsvGeoviewClass(mapId, csvGeoviewLayerConfig);
      // Synchronize the geoviewLayerId.
      csvGeoviewLayerConfig.geoviewLayerId = csvGeoviewLayerInstance.geoviewLayerId;
      setGeoviewLayerInstance(csvGeoviewLayerInstance);
      await csvGeoviewLayerInstance.createGeoViewLayers();
      const layers = [
        new CsvLayerEntryConfig({
          geoviewLayerConfig: csvGeoviewLayerConfig,
          layerId: csvGeoviewLayerConfig.geoviewLayerId,
          layerName: '',
          schemaTag: CONST_LAYER_TYPES.CSV,
          source: {
            dataAccessPath: layerURL,
          },
        } as CsvLayerEntryConfig),
      ];
      setLayerName(layers[0].layerName!);
      setLayerEntries([layers[0]]);
    } catch (error) {
      emitErrorServer('CSV');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid GeoJSON.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const geoJSONValidation = async (): Promise<boolean> => {
    try {
      const response = await fetch(layerURL);
      const json = await response.json();
      if (!['FeatureCollection', 'Feature'].includes(json.type)) {
        // We assume that a metadata file is present
        const geojsonGeoviewLayerConfig = {
          geoviewLayerType: GEOJSON,
          listOfLayerEntryConfig: [] as GeoJSONLayerEntryConfig[],
          metadataAccessPath: layerURL,
        } as TypeGeoJSONLayerConfig;
        const geojsonGeoviewLayerInstance = new GeoJSON(mapId, geojsonGeoviewLayerConfig);
        // Synchronize the geoviewLayerId.
        geojsonGeoviewLayerConfig.geoviewLayerId = geojsonGeoviewLayerInstance.geoviewLayerId;
        setGeoviewLayerInstance(geojsonGeoviewLayerInstance);
        await geojsonGeoviewLayerInstance.createGeoViewLayers();
        setHasMetadata(true);
        if (!geojsonGeoviewLayerInstance.metadata) throw new Error('Cannot get metadata');
        const geojsonFeatureMetadata = geojsonGeoviewLayerInstance.metadata!;
        geojsonGeoviewLayerConfig.listOfLayerEntryConfig = Cast<GeoJSONLayerEntryConfig[]>(geojsonFeatureMetadata.listOfLayerEntryConfig);
        // validate and instanciate layer configs
        ConfigValidation.validateListOfGeoviewLayerConfig(api.maps[mapId].getDisplayLanguage(), [geojsonGeoviewLayerConfig]);
        const layers = geojsonGeoviewLayerConfig.listOfLayerEntryConfig;
        if (layers.length === 1) {
          setLayerName(layers[0].layerName as string);
          setLayerEntries([Cast<GeoJSONLayerEntryConfig>(layers[0])]);
        } else {
          setLayerList(Cast<GeoJSONLayerEntryConfig[]>(layers));
        }
      } else {
        // We assume a single GeoJSON file is present
        setHasMetadata(false);
        const geojsonGeoviewLayerConfig = {
          geoviewLayerType: GEOJSON,
          listOfLayerEntryConfig: [] as GeoJSONLayerEntryConfig[],
        } as TypeGeoJSONLayerConfig;
        const geojsonGeoviewLayerInstance = new GeoJSON(mapId, geojsonGeoviewLayerConfig);
        // Synchronize the geoviewLayerId.
        geojsonGeoviewLayerConfig.geoviewLayerId = geojsonGeoviewLayerInstance.geoviewLayerId;
        setGeoviewLayerInstance(geojsonGeoviewLayerInstance);
        await geojsonGeoviewLayerInstance.createGeoViewLayers();
        const layers = [
          new GeoJSONLayerEntryConfig({
            geoviewLayerConfig: geojsonGeoviewLayerConfig,
            layerId: geojsonGeoviewLayerConfig.geoviewLayerId,
            schemaTag: CONST_LAYER_TYPES.GEOJSON,
            layerName: '',
            source: {
              dataAccessPath: layerURL,
            },
          } as GeoJSONLayerEntryConfig),
        ];
        setLayerName(layers[0].layerName!);
        setLayerEntries([layers[0]]);
      }
    } catch (error) {
      emitErrorServer('GeoJSON');
      // Log error
      logger.logError(error);
      return false;
    }
    return true;
  };

  // TODO: refactor - add the Geopacakges when refactor is done. We keep code for reference
  /**
   * Using the layerURL state object, check whether URL is a valid GeoPackage.
   *
   * @returns {boolean} True if layer passes validation
   */
  // const geoPackageValidation = (): boolean => {
  // try {
  //   // We assume a single GeoPackage file is present
  //   setHasMetadata(false);
  //   const geoPackageGeoviewLayerConfig = {
  //     geoviewLayerType: GEOPACKAGE,
  //     listOfLayerEntryConfig: [] as GeoPackageLayerEntryConfig[],
  //   } as TypeGeoPackageLayerConfig;
  //   const geopackageGeoviewLayerInstance = new GeoPackage(mapId, geoPackageGeoviewLayerConfig);
  //   // Synchronize the geoviewLayerId.
  //   geoPackageGeoviewLayerConfig.geoviewLayerId = geopackageGeoviewLayerInstance.geoviewLayerId;
  //   setGeoviewLayerInstance(geopackageGeoviewLayerInstance);
  //   const layers = [
  //     new GeoPackageLayerEntryConfig({
  //       geoviewLayerConfig: geoPackageGeoviewLayerConfig,
  //       layerId: geoPackageGeoviewLayerConfig.geoviewLayerId,
  //       layerName: '',
  //       source: {
  //         dataAccessPath: layerURL,
  //       },
  //     } as GeoPackageLayerEntryConfig),
  //   ];
  //   setLayerName(layers[0].layerName!);
  //   setLayerEntries([layers[0]]);
  // } catch (error) {
  //   emitErrorServer('GeoPackage');
  //   // Log error
  //   logger.logError(error);
  //   return false;
  // }
  // return true;
  // };

  /**
   * Attempt to determine the layer type based on the URL format
   */
  const bestGuessLayerType = (): void => {
    const layerTokens = displayURL.toUpperCase().split('/');
    const layerId = parseInt(layerTokens[layerTokens.length - 1], 10);
    if (displayURL.toUpperCase().endsWith('MAPSERVER') || displayURL.toUpperCase().endsWith('MAPSERVER/')) {
      setLayerType(ESRI_DYNAMIC);
    } else if (
      displayURL.toUpperCase().indexOf('FEATURESERVER') !== -1 ||
      (displayURL.toUpperCase().indexOf('MAPSERVER') !== -1 && !Number.isNaN(layerId))
    ) {
      setLayerType(ESRI_FEATURE);
    } else if (displayURL.toUpperCase().indexOf('IMAGESERVER') !== -1) {
      setLayerType(ESRI_IMAGE);
    } else if (layerTokens.indexOf('WFS') !== -1) {
      setLayerType(WFS);
    } else if (displayURL.toUpperCase().endsWith('.JSON') || displayURL.toUpperCase().endsWith('.GEOJSON')) {
      setLayerType(GEOJSON);
    } else if (displayURL.toUpperCase().indexOf('{Z}/{X}/{Y}') !== -1 || displayURL.toUpperCase().indexOf('{Z}/{Y}/{X}') !== -1) {
      setLayerType(XYZ_TILES);
    } else if (displayURL.indexOf('/') === -1 && displayURL.replaceAll('-', '').length === 32) {
      setLayerType(GEOCORE);
    } else if (displayURL.toUpperCase().indexOf('WMS') !== -1) {
      setLayerType(WMS);
    } else if (displayURL.toUpperCase().endsWith('.CSV') || displayURL.toUpperCase().includes('.CSV?')) {
      setLayerType(CSV);
    } else {
      setLayerType('');
      setStepButtonDisable(true);
    }
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep1 = (): void => {
    let valid = true;
    if (layerURL.trim() === '') {
      valid = false;
      emitErrorNone();
    }
    if (valid) {
      bestGuessLayerType();
      setActiveStep(1);
    }
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep2 = (): void => {
    setIsLoading(true);

    let promise;
    if (layerType === undefined) {
      setIsLoading(false);
      emitErrorEmpty(t('layers.service'));
    } else if (layerType === WMS) promise = wmsValidation();
    else if (layerType === WFS) promise = wfsValidation();
    else if (layerType === OGC_FEATURE) promise = ogcFeatureValidation();
    else if (layerType === XYZ_TILES) promise = xyzValidation();
    else if (layerType === ESRI_DYNAMIC) promise = esriValidation(ESRI_DYNAMIC);
    else if (layerType === ESRI_FEATURE) promise = esriValidation(ESRI_FEATURE);
    else if (layerType === ESRI_IMAGE) promise = esriImageValidation();
    else if (layerType === GEOJSON) promise = geoJSONValidation();
    else if (layerType === GEOCORE) promise = geocoreValidation();
    else if (layerType === CSV) promise = csvValidation();

    // If we have a promise of a layer validation
    if (promise) {
      promise
        .then((isValid) => {
          if (isValid) {
            setIsLoading(false);
            setActiveStep(2);

            // disable continue button until a layer entry is selected
            setStepButtonDisable(true);
          }
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('promise of layer validation in handleStep2 in AddNewLayer', error);
        });
    }
  };

  /**
   * Handle the behavior of the 'Step3' button in the Stepper UI
   */
  const handleStep3 = (): void => {
    let valid = true;
    if (layerEntries.length === 0) {
      valid = false;
      emitErrorEmpty(t('layers.layer'));
    }
    if (valid) setActiveStep(3);
  };

  const doneAdding = (): void => {
    // Done adding
    setIsLoading(false);
    setDisplayState('view');
    MapEventProcessor.setLayerZIndices(mapId);
  };

  const doneAddedShowMessage = (layerBeingAdded: AbstractGeoViewLayer): void => {
    if (layerBeingAdded.allLayerStatusAreGreaterThanOrEqualTo('error'))
      api.maps[mapId].notifications.showError('layers.layerAddedWithError', [layerName]);
    else if (layerBeingAdded?.allLayerStatusAreGreaterThanOrEqualTo('loaded'))
      api.maps[mapId].notifications.showMessage('layers.layerAdded', [layerName]);
    else api.maps[mapId].notifications.showMessage('layers.layerAddedAndLoading', [layerName]);
  };

  /**
   * Handle the behavior of the 'Finish' button in the Stepper UI
   */
  const handleStepLast = (): void => {
    setIsLoading(true);
    if (layerType === GEOCORE) {
      // TODO: Refactor - When reworking on this component, fix this weird thing of layerList vs layerEntries confusion for GeoCore
      const addedLayers: GeoViewLayerAddedResult[] = [];
      if (layerList.length > 1) {
        (layerList as TypeGeoviewLayerConfig[]).forEach((geoviewLayerConfig) => {
          const addedLayer = api.maps[mapId].layer.addGeoviewLayer(geoviewLayerConfig);
          if (addedLayer) addedLayers.push(addedLayer);
        });
      } else if (layerEntries.length > 0) {
        (layerEntries as TypeGeoviewLayerConfig[]).forEach((geoviewLayerConfig) => {
          if (layerName !== geoviewLayerConfig.geoviewLayerName) {
            const tempConfig = geoviewLayerConfig;
            if (tempConfig.listOfLayerEntryConfig.length > 1) {
              tempConfig.geoviewLayerName = layerName;
            } else {
              tempConfig.listOfLayerEntryConfig[0].layerName = layerName;
            }
            const addedLayer = api.maps[mapId].layer.addGeoviewLayer(tempConfig);
            if (addedLayer) addedLayers.push(addedLayer);
          } else {
            const addedLayer = api.maps[mapId].layer.addGeoviewLayer(geoviewLayerConfig);
            if (addedLayer) addedLayers.push(addedLayer);
          }
        });
      }

      // When each promise is done
      Promise.allSettled(addedLayers.map((addedLayer) => addedLayer.promiseLayer))
        .then(() => {
          // Done adding
          doneAdding();
          addedLayers.forEach((addedLayer) => doneAddedShowMessage(addedLayer.layer));
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('Promise.allSettled in handleStepLast in AddNewLayer', error);
        });
    } else if (geoviewLayerInstance) {
      // Get config
      const { geoviewLayerConfig } = layerEntries[0] as TypeLayerEntryConfig;

      // Have to massage this so the `setListOfLayerEntryConfig` inside the layer constructor works
      // TODO: Refactor - Try to find a way to simplify/clarify what's going on in the layer constructor's call to `setListOfLayerEntryConfig`.
      // TO.DOCONT: The recursion is necessary, but can the root be a derived type of the branches/leaves or something?
      // TO.DOCONT: Maybe just me, but seems a bit hard to understand what needs to be set in the `geoviewLayerConfig.listOfLayerEntryConfig`.
      // TO.DOCONT: Anyways, this works as-it-was before the refactor for now.
      geoviewLayerConfig.listOfLayerEntryConfig = layerEntries as TypeLayerEntryConfig[];

      // TODO: Bug - Fix this layer naming not working, wasn't working before the refactor either, leaving it as-is
      geoviewLayerConfig.geoviewLayerName = layerName;
      if (layerType === XYZ_TILES) (layerEntries[0] as TypeLayerEntryConfig).layerName = layerName;
      if (geoviewLayerConfig.listOfLayerEntryConfig.length === 1)
        geoviewLayerConfig.listOfLayerEntryConfig[0].layerName = geoviewLayerConfig.geoviewLayerName;

      // Add the layer using the proper function
      const addedLayer = api.maps[mapId].layer.addGeoviewLayer(geoviewLayerConfig);
      if (addedLayer) {
        // Wait on the promise
        addedLayer.promiseLayer
          .then(() => {
            // Done adding
            doneAdding();
            doneAddedShowMessage(addedLayer.layer);
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('addedLayer.promiseLayer in handleStepLast in AddNewLayer', error);
          });
      } else {
        // Failed to add, remove spinning, but stay on the add ui
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle the behavior of the 'Back' button in the Stepper UI
   */
  const handleBack = (): void => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);

    // We assume previous step ok, so enable continue button
    setStepButtonDisable(false);
  };

  /**
   * Set layer URL from file input
   *
   * @param {File} file - Uploaded file
   */
  const handleFile = (file: File): void => {
    const fileURL = URL.createObjectURL(file);
    setDisplayURL(file.name);
    setLayerURL(fileURL);
    const fileName = file.name.split('.')[0];
    setLayerType('');
    setLayerList([]);
    setLayerName(fileName);
    setLayerEntries([]);
    setStepButtonDisable(false);
  };

  /**
   * Set layer URL from form input
   *
   * @param {ChangeEvent<HTMLInputElement>} event - TextField event
   */
  const handleInput = (event: ChangeEvent<HTMLInputElement>): void => {
    setDisplayURL(event.target.value.trim());
    setLayerURL(event.target.value.trim());
    setLayerType('');
    setLayerList([]);
    setLayerName('');
    setLayerEntries([]);

    // TODO: create a utilities function to test valid URL before we enable the continue button
    // TO.DOCONT: This function should try to ping the server for an answer...
    // Check if url or geocore is provided
    setStepButtonDisable(
      !(
        event.target.value.trim().startsWith('https://') ||
        event.target.value.trim().startsWith('http://') ||
        event.target.value.trim().length !== 35
      )
    );
  };

  /**
   * Set layerType from form input
   *
   * @param {SelectChangeEvent<unknown>} event - TextField event
   */
  const handleSelectType = (event: SelectChangeEvent<unknown>): void => {
    setLayerType(event.target.value as TypeGeoviewLayerTypeWithGeoCore);
    setLayerList([]);
    setLayerEntries([]);

    setStepButtonDisable(false);
  };

  /**
   * Set the currently selected layer from a list
   *
   * @param {Event} event - Select event
   * @param {TypeLayerEntryConfig[] | TypeLayerEntryConfig} newValue - The new layer entry config value
   *
   * @param newValue value/label pairs of select options
   */
  const handleSelectLayer = (event: Event, newValue: TypeLayerEntryConfig[] | TypeLayerEntryConfig): void => {
    setStepButtonDisable(true);

    if (isMultiple()) {
      if (!((newValue as TypeLayerEntryConfig[]).length === 0)) {
        setLayerEntries(newValue as TypeLayerEntryConfig[]);
        setLayerName((newValue as TypeLayerEntryConfig[]).map((layerConfig) => layerConfig.layerName).join(', '));

        setStepButtonDisable(false);
      }
    } else {
      setLayerEntries([newValue as TypeLayerEntryConfig]);
      setLayerName((newValue as TypeLayerEntryConfig).layerName!);

      setStepButtonDisable(false);
    }
  };

  /**
   * Set the layer name from form input
   *
   * @param {ChangeEvent<HTMLInputElement>} event - TextField event
   */
  const handleNameLayer = (event: ChangeEvent<HTMLInputElement>): void => {
    setStepButtonDisable(false);
    setLayerName(event.target.value);
  };

  // To set the button enable when validation set the layerName
  useEffect(() => {
    if (activeStep === 2 && layerEntries.length > 0) setStepButtonDisable(false);
  }, [layerName, activeStep, layerEntries]);

  useEffect(() => {
    if (activeStep === 0) {
      uploadBtnRef.current?.focus();
    }
    if (activeStep === 1) {
      (serviceTypeRef.current?.getElementsByTagName('input')[0].previousSibling as HTMLDivElement).focus();
    }
    if (activeStep === 2) {
      if (isMultipleRef.current) {
        // handle is Multiple fields focus
        const id = isMultipleRef.current?.dataset?.id;
        const elem = isMultipleRef.current?.querySelector('#service-layer-label') as HTMLInputElement;
        if (id === 'autocomplete' && elem) {
          elem.focus();
        } else {
          isMultipleTextFieldRef.current?.getElementsByTagName('input')[0]?.focus();
        }
      }
    }
    if (activeStep === 3) {
      isMultipleTextFieldRef.current?.getElementsByTagName('input')[0]?.focus();
    }
  }, [activeStep]);
  /**
   * Handle file dragged into dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== dragPopover.current) {
      setDrag(true);
    }
  };

  /**
   * Handle file dragged out of dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === dragPopover.current) setDrag(false);
  };

  /**
   * Prevent default behaviour when file dragged over dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle file drop
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setDrag(false);
    if (event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      const upFilename = file.name.toUpperCase();
      if (upFilename.endsWith('.JSON') || upFilename.endsWith('.GEOJSON') || upFilename.endsWith('.CSV')) {
        handleFile(file);
      } else {
        emitErrorFile();
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter') {
      handleBack();
      event.preventDefault();
    }
  };

  /**
   * Creates a set of Continue / Back buttons
   *
   * @param param0 specify if button is first or last in the list
   * @returns {JSX.Element} React component
   */
  // TODO: refactor - remove the unstable nested component
  // eslint-disable-next-line react/no-unstable-nested-components
  function NavButtons({ isFirst = false, isLast = false, handleNext }: ButtonPropsLayerPanel): JSX.Element {
    return isLoading ? (
      <Box sx={{ padding: 10 }}>
        <CircularProgressBase />
      </Box>
    ) : (
      <ButtonGroup sx={sxClasses.buttonGroup}>
        <Button
          variant="contained"
          className="buttonOutlineFilled"
          size="small"
          type="text"
          disabled={stepButtonDisable}
          onClick={handleNext}
        >
          {isLast ? t('layers.finish') : t('layers.continue')}
        </Button>
        {!isFirst && (
          <Button
            variant="contained"
            className="buttonOutlineFilled"
            size="small"
            type="text"
            onClick={handleBack}
            onKeyDown={(e) => handleKeyDown(e)}
          >
            {t('layers.back')}
          </Button>
        )}
      </ButtonGroup>
    );
  }

  const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize={theme.palette.geoViewFontSize.sm} />;
  const checkedIcon = <CheckBoxIcon fontSize={theme.palette.geoViewFontSize.sm} />;

  return (
    <Paper sx={{ padding: '20px', gap: '8' }}>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        steps={[
          {
            stepLabel: {
              children: t('layers.stepOne'),
            },
            stepContent: {
              children: (
                <Box
                  className="dropzone"
                  style={{ position: 'relative' }}
                  onDrop={(e) => handleDrop(e)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDragEnter={(e) => handleDragEnter(e)}
                  onDragLeave={(e) => handleDragLeave(e)}
                >
                  {drag && (
                    <Box
                      ref={dragPopover}
                      style={{
                        backgroundColor: 'rgba(128,128,128,.95)',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        textAlign: 'center',
                        color: 'black',
                        fontSize: 24,
                      }}
                    >
                      <h3>
                        <br />
                        <br />
                        {t('layers.dropzone')}
                      </h3>
                    </Box>
                  )}
                  <Box>
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) handleFile(e.target.files[0]);
                      }}
                      accept=".json, .geojson, .csv"
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ width: '100%' }}
                    type="text"
                    onClick={() => document.getElementById('fileUpload')?.click()}
                    className="buttonOutlineFilled"
                    ref={uploadBtnRef}
                  >
                    <FileUploadIcon />
                    <Box component="span">{t('layers.upload')}</Box>
                  </Button>
                  <p style={{ textAlign: 'center' }}>
                    <small>{t('layers.drop')}</small>
                  </p>
                  <p style={{ textAlign: 'center' }}>{t('layers.or')}</p>
                  <TextField
                    sx={{ width: '100%' }}
                    label={t('layers.url')}
                    variant="standard"
                    value={displayURL}
                    onChange={handleInput}
                    multiline
                  />
                  <br />
                  <NavButtons isFirst handleNext={handleStep1} />
                </Box>
              ),
            },
          },
          {
            stepLabel: {
              children: t('layers.stepTwo'),
            },
            stepContent: {
              children: (
                <>
                  <Select
                    fullWidth
                    labelId="service-type-label"
                    value={layerType}
                    onChange={handleSelectType}
                    label={t('layers.service')}
                    variant="standard"
                    inputLabel={{
                      id: 'service-type-label',
                    }}
                    ref={serviceTypeRef}
                    menuItems={layerOptions.map(([value, label]) => ({
                      key: value,
                      item: {
                        value,
                        children: label,
                      },
                    }))}
                  />
                  <NavButtons handleNext={handleStep2} />
                </>
              ),
            },
          },
          {
            stepLabel: {
              children: t('layers.stepThree'),
            },
            stepContent: {
              children: (
                <>
                  {layerList.length === 0 && (
                    <TextField
                      label={t('layers.name')}
                      variant="standard"
                      value={layerName}
                      onChange={handleNameLayer}
                      ref={isMultipleTextFieldRef}
                    />
                  )}
                  {layerList.length > 1 && (layerList[0] as TypeLayerEntryConfig).layerName && (
                    <Autocomplete
                      fullWidth
                      multiple={isMultiple()}
                      disableClearable={!isMultiple()}
                      disableCloseOnSelect
                      id="service-layer-label"
                      options={layerList as TypeLayerEntryConfig[]}
                      getOptionLabel={(option) =>
                        `${(option as TypeLayerEntryConfig).layerName} (${(option as TypeLayerEntryConfig).layerId})`
                      }
                      renderOption={(props, option, { selected }) => (
                        <li {...props} key={(option as TypeLayerEntryConfig).layerName}>
                          <Checkbox icon={uncheckedIcon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                          {(option as TypeLayerEntryConfig).layerName}
                        </li>
                      )}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={handleSelectLayer as any}
                      ref={isMultipleRef}
                      renderInput={(params) => <TextField {...params} label={t('layers.layerSelect')} />}
                    />
                  )}
                  {layerList.length > 1 && (layerList[0] as TypeGeoviewLayerConfig).geoviewLayerName && (
                    <Autocomplete
                      fullWidth
                      multiple={isMultiple()}
                      disableClearable={!isMultiple()}
                      id="service-layer-label"
                      options={layerList as TypeGeoviewLayerConfig[]}
                      getOptionLabel={(option) =>
                        `${(option as TypeGeoviewLayerConfig).geoviewLayerName} (${(option as TypeGeoviewLayerConfig).geoviewLayerId})`
                      }
                      disableCloseOnSelect
                      renderOption={(props, option, { selected }) => (
                        <li {...props} key={(option as TypeGeoviewLayerConfig).geoviewLayerName}>
                          <Checkbox icon={uncheckedIcon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                          {(option as TypeGeoviewLayerConfig).geoviewLayerName}
                        </li>
                      )}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={handleSelectLayer as any}
                      ref={isMultipleRef}
                      renderInput={(params) => <TextField {...params} label={t('layers.layerSelect')} />}
                    />
                  )}
                  <br />
                  <NavButtons isLast={!isMultiple()} handleNext={isMultiple() ? handleStep3 : handleStepLast} />
                </>
              ),
            },
          },
          isMultiple()
            ? {
                stepLabel: {
                  children: t('layers.stepFour'),
                },
                stepContent: {
                  children: (
                    <>
                      <TextField
                        sx={{ width: '100%' }}
                        label={t('layers.name')}
                        variant="standard"
                        value={layerName}
                        onChange={handleNameLayer}
                        ref={isMultipleTextFieldRef}
                      />
                      <br />
                      <NavButtons isLast handleNext={handleStepLast} />
                    </>
                  ),
                },
              }
            : null,
        ]}
      />
    </Paper>
  );
}

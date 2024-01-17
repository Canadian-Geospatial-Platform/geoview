import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, Button, ButtonGroup, CircularProgressBase, FileUploadIcon, Paper, Select, Stepper, TextField } from '@/ui';
import { CONST_LAYER_TYPES, GeoUtilities, TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeListOfLayerEntryConfig } from '@/geo';
import { ButtonPropsLayerPanel, SelectChangeEvent, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { generateId } from '@/core/utils/utilities';
import { useLayersList } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { api } from '@/app';

type EsriOptions = {
  err: string;
  capability: string;
};

export function AddNewLayer(): JSX.Element {
  const { t } = useTranslation<string>();

  const { ESRI_DYNAMIC, ESRI_FEATURE, GEOJSON, GEOPACKAGE, WMS, WFS, OGC_FEATURE, XYZ_TILES, GEOCORE } = CONST_LAYER_TYPES;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [displayURL, setDisplayURL] = useState('');
  const [layerType, setLayerType] = useState<TypeGeoviewLayerType | ''>('');
  const [layerList, setLayerList] = useState<TypeJsonArray[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerEntries, setLayerEntries] = useState<TypeListOfLayerEntryConfig>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);

  const dragPopover = useRef(null);

  // get values from store
  const mapId = useGeoViewMapId();
  const layersList = useLayersList();

  const isMultiple = () => layerType === ESRI_DYNAMIC || layerType === WFS || layerType === WMS;

  const geoUtilities = new GeoUtilities();

  const newLayerId = generateId();

  /**
   * List of layer types and labels
   */
  const layerOptions = [
    [ESRI_DYNAMIC, 'ESRI Dynamic Service'],
    [ESRI_FEATURE, 'ESRI Feature Service'],
    [GEOJSON, 'GeoJSON'],
    [GEOPACKAGE, 'GeoPackage'],
    [WMS, 'OGC Web Map Service (WMS)'],
    [WFS, 'OGC Web Feature Service (WFS)'],
    [OGC_FEATURE, 'OGC API Features'],
    [XYZ_TILES, 'XYZ Raster Tiles'],
    [GEOCORE, 'GeoCore'],
  ];

  // const acceptedFiles = ["*.json"];

  useEffect(() => {
    console.log('layersList ', layersList);
    // setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layersList]);

  const sxClasses = {
    buttonGroup: {
      paddingTop: 12,
      gap: 6,
    },
  };

  /*
  const onDrop = useCallback((acceptedFiles: any) => {
    // Do something with the files
    console.log('acceptedFiles ', acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const dropAreaSx = {
    boxShadow: 'inset 0px 3px 6px #00000029',
    width: '100%',
    background: '#F1F2F5 0% 0% no-repeat padding-box',
    minHeight: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    cursor: 'pointer',
    marginBottom: '20px',
    textAlign: 'center',
  }; */

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
  const emitErrorEmpty = (textField: string) => {
    setIsLoading(false);
    api.utilities.showError(mapId, `${textField} ${t('layers.errorEmpty')}`, false);
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorNone = () => {
    setIsLoading(false);
    api.utilities.showError(mapId, t('layers.errorNone'), false);
  };

  /**
   * Emits an error dialogue when unsupported files are uploaded
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorFile = () => {
    api.utilities.showError(mapId, t('layers.errorFile'), false);
  };

  /**
   * Emits an error when the URL does not support the selected service type
   *
   * @param serviceName type of service provided by the URL
   */
  const emitErrorServer = (serviceName: string) => {
    setIsLoading(false);
    api.utilities.showError(mapId, `${serviceName} ${t('layers.errorServer')}`, false);
  };

  /**
   * Emits an error when a service does not support the current map projection
   *
   * @param serviceName type of service provided by the URL
   * @param proj current map projection
   */
  const emitErrorProj = (serviceName: string, proj: string | undefined, supportedProj: TypeJsonArray | string[]) => {
    setIsLoading(false);
    const message = `${serviceName} ${t('layers.errorProj')} ${proj}, ${t('layers.only')} ${supportedProj.join(', ')}`;
    api.utilities.showError(mapId, message, false);
  };

  /**
   * Using the layerURL state object, check whether URL is a valid WMS,
   * and add either Name and Entry directly to state if a single layer,
   * or a list of Names / Entries if multiple layer options exist.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const wmsValidation = async (): Promise<boolean> => {
    const proj = api.projection.projections[api.maps[mapId].getMapState().currentProjection].getCode();
    let supportedProj: string[] = [];

    try {
      const [baseUrl, queryString] = layerURL.split('?');
      const urlParams = new URLSearchParams(queryString);
      const paramLayers = urlParams.get('layers')?.split(',') || [''];
      // query layers are not sent, as not all services support asking for multiple layers
      const wms = await geoUtilities.getWMSServiceMetadata(baseUrl, '');

      supportedProj = wms.Capability.Layer.CRS as string[];
      if (!supportedProj.includes(proj)) throw new Error('proj');

      const layers: TypeJsonArray[] = [];

      const hasChildLayers = (layer: TypeJsonObject) => {
        if (layer.Layer && (layer.Layer as TypeJsonArray).length > 0) {
          (layer.Layer as TypeJsonObject[]).forEach((childLayer: TypeJsonObject) => {
            hasChildLayers(childLayer);
          });
        } else {
          for (let i = 0; i < paramLayers.length; i++) {
            if ((layer.Name as string) === paramLayers[i]) layers.push([layer.Name, layer.Title] as TypeJsonArray);
          }
        }
      };

      if (wms.Capability.Layer) {
        hasChildLayers(wms.Capability.Layer);
      }

      if (layers.length === 1) {
        setLayerName(layers[0][1] as string);
        setLayerEntries([
          {
            layerId: layers[0][0] as string,
          },
        ] as TypeListOfLayerEntryConfig);
      } else {
        setLayerList(layers);
      }
    } catch (err) {
      if ((err as Error).message === 'proj') {
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
      const wfs = await geoUtilities.getWFSServiceMetadata(layerURL);
      const layers = (wfs.FeatureTypeList.FeatureType as TypeJsonArray).map((aFeatureType) => [
        (aFeatureType.Name['#text'] as string).split(':')[1] as TypeJsonObject,
        aFeatureType.Title['#text'],
      ]);
      if (layers.length === 1) {
        setLayerName(layers[0][1] as string);
        setLayerEntries([
          {
            layerId: layers[0][0] as string,
          },
        ] as TypeListOfLayerEntryConfig);
      } else {
        setLayerList(layers);
      }
    } catch (err) {
      emitErrorServer('WFS');
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
    const keysSingleLayer = ['id', 'title'];
    const responseSingle = await fetch(`${layerURL}/?f=json`);
    if (responseSingle.status !== 200) {
      emitErrorServer('OGC API Feature');
      return false;
    }
    const jsonSingle = await responseSingle.json();
    const isSingleLayerValid = keysSingleLayer.every((key) => Object.keys(jsonSingle).includes(key));
    if (isSingleLayerValid) {
      setLayerEntries([
        {
          layerId: jsonSingle.id,
        },
      ] as TypeListOfLayerEntryConfig);
      setLayerName(jsonSingle.title);
      return true;
    }

    try {
      const keys = ['collections', 'links'];
      const responseCollection = await fetch(`${layerURL}/collections?f=json`);
      const jsonCollection = await responseCollection.json();
      const isCollectionValid = keys.every((key) => Object.keys(jsonCollection).includes(key));
      if (!isCollectionValid) throw new Error('err');
      const layers = (jsonCollection.collections as TypeJsonArray).map((aFeatureType) => [aFeatureType.id, aFeatureType.title]);
      if (layers.length === 1) {
        setLayerName(layers[0][1] as string);
        setLayerEntries([
          {
            layerId: layers[0][0] as string,
          },
        ] as TypeListOfLayerEntryConfig);
      } else {
        setLayerList(layers);
      }
    } catch (err) {
      emitErrorServer('OGC API Feature');
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid Geocore UUID.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const geocoreValidation = (): boolean => {
    try {
      const isValid = layerURL.indexOf('/') === -1 && layerURL.replaceAll('-', '').length === 32;
      if (!isValid) throw new Error('err');
      setLayerName('');
      setLayerEntries([
        {
          layerId: layerURL,
        },
      ] as TypeListOfLayerEntryConfig);
    } catch (err) {
      emitErrorServer('GeoCore UUID');
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
      const esri = await geoUtilities.getESRIServiceMetadata(layerURL);
      if ((esri.capabilities as string).includes(esriOptions(type).capability)) {
        if ('layers' in esri) {
          const layers = (esri.layers as TypeJsonArray).map((aLayer) => [aLayer.id, aLayer.name]);
          if (layers.length === 1) {
            setLayerName(layers[0][1] as string);
            setLayerEntries([
              {
                layerId: layers[0][0] as string,
              },
            ] as TypeListOfLayerEntryConfig);
          } else {
            setLayerList(layers);
          }
        } else {
          setLayerName(esri.name as string);
          setLayerEntries([
            {
              layerId: esri.id as string,
            },
          ] as TypeListOfLayerEntryConfig);
        }
      } else {
        throw new Error('err');
      }
    } catch (err) {
      emitErrorServer(esriOptions(type).err);
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid XYZ Server.
   *
   * @returns {boolean} True if layer passes validation
   */
  const xyzValidation = (): boolean => {
    const tiles = ['{x}', '{y}', '{z}'];
    for (let i = 0; i < tiles.length; i += 1) {
      if (!layerURL.includes(tiles[i])) {
        emitErrorServer('XYZ Tile');
        return false;
      }
    }
    const dataAccessPath = layerURL;
    setLayerName('');
    setLayerEntries([
      {
        layerId: layerURL,
        source: {
          dataAccessPath: {
            en: dataAccessPath,
            fr: dataAccessPath,
          },
        },
      },
    ] as TypeListOfLayerEntryConfig);
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
        throw new Error('err');
      }
      const layerId = layerURL.split('/').pop() as string;
      const dataAccessPath = layerURL.replace(layerId, '');
      if (!layerName) setLayerName(layerId);
      setLayerEntries([
        {
          layerId,
          source: {
            dataAccessPath: {
              en: dataAccessPath,
              fr: dataAccessPath,
            },
          },
        },
      ] as TypeListOfLayerEntryConfig);
    } catch (err) {
      emitErrorServer('GeoJSON');
      return false;
    }
    return true;
  };

  /**
   * Using the layerURL state object, check whether URL is a valid GeoPackage.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const geoPackageValidation = (): boolean => {
    // TODO actual geopackage validation
    const layerId = layerURL.split('/').pop() as string;
    const dataAccessPath = layerURL.replace(layerId, '');
    if (!layerName) setLayerName(layerId);
    setLayerEntries([
      {
        layerId,
        source: {
          dataAccessPath: {
            en: dataAccessPath,
            fr: dataAccessPath,
          },
        },
      },
    ] as TypeListOfLayerEntryConfig);
    return true;
  };

  /**
   * Attempt to determine the layer type based on the URL format
   */
  const bestGuessLayerType = () => {
    const layerTokens = displayURL.toUpperCase().split('/');
    const layerId = parseInt(layerTokens[layerTokens.length - 1], 10);
    if (displayURL.toUpperCase().endsWith('MAPSERVER') || displayURL.toUpperCase().endsWith('MAPSERVER/')) {
      setLayerType(ESRI_DYNAMIC);
    } else if (
      displayURL.toUpperCase().indexOf('FEATURESERVER') !== -1 ||
      (displayURL.toUpperCase().indexOf('MAPSERVER') !== -1 && !Number.isNaN(layerId))
    ) {
      setLayerType(ESRI_FEATURE);
    } else if (layerTokens.indexOf('WFS') !== -1) {
      setLayerType(WFS);
    } else if (displayURL.toUpperCase().endsWith('.JSON') || displayURL.toUpperCase().endsWith('.GEOJSON')) {
      setLayerType(GEOJSON);
    } else if (displayURL.toUpperCase().endsWith('.GPKG')) {
      setLayerType(GEOPACKAGE);
    } else if (displayURL.toUpperCase().indexOf('{Z}/{X}/{Y}') !== -1 || displayURL.toUpperCase().indexOf('{Z}/{Y}/{X}') !== -1) {
      setLayerType(XYZ_TILES);
    } else if (displayURL.indexOf('/') === -1 && displayURL.replaceAll('-', '').length === 32) {
      setLayerType(GEOCORE);
    } else if (displayURL.toUpperCase().indexOf('WMS') !== -1) {
      setLayerType(WMS);
    }
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep1 = () => {
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
  const handleStep2 = async () => {
    setIsLoading(true);
    let valid = true;
    if (layerType === undefined) {
      valid = false;
      setIsLoading(false);
      emitErrorEmpty(t('layers.service'));
    } else if (layerType === WMS) valid = await wmsValidation();
    else if (layerType === WFS) valid = await wfsValidation();
    else if (layerType === OGC_FEATURE) valid = await ogcFeatureValidation();
    else if (layerType === XYZ_TILES) valid = xyzValidation();
    else if (layerType === ESRI_DYNAMIC) valid = await esriValidation(ESRI_DYNAMIC);
    else if (layerType === ESRI_FEATURE) valid = await esriValidation(ESRI_FEATURE);
    else if (layerType === GEOJSON) valid = await geoJSONValidation();
    else if (layerType === GEOPACKAGE) valid = geoPackageValidation();
    else if (layerType === GEOCORE) valid = geocoreValidation();
    if (valid) {
      setIsLoading(false);
      setActiveStep(2);
    }
  };

  /**
   * Handle the behavior of the 'Step3' button in the Stepper UI
   */
  const handleStep3 = () => {
    let valid = true;
    if (layerEntries.length === 0) {
      valid = false;
      emitErrorEmpty(t('layers.layer'));
    }
    if (valid) setActiveStep(3);
  };

  /**
   * Handle the behavior of the 'Finish' button in the Stepper UI
   */
  const handleStepLast = () => {
    setIsLoading(true);
    /* api.event.on(  //TODO - Investigate
      api.eventNames.LAYER.EVENT_LAYER_ADDED,
      () => {
        api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, mapId);
        setIsLoading(false);
        // setAddLayerVisible(false);
      },
      `${mapId}/${geoviewLayerId}`
    ); */

    let valid = true;
    const name = layerName;
    let url = layerURL;

    if (layerType === ESRI_DYNAMIC || layerType === ESRI_FEATURE) {
      url = geoUtilities.getMapServerUrl(layerURL);
    }

    if (layerType === WMS) {
      [url] = layerURL.split('?');
    }

    if (layerName === '') {
      valid = false;
      emitErrorEmpty(isMultiple() ? t('layers.layer') : t('layers.name'));
    }
    const layerConfig: TypeGeoviewLayerConfig = {
      geoviewLayerId: newLayerId,
      geoviewLayerName: {
        en: name,
        fr: name,
      },
      geoviewLayerType: layerType as TypeGeoviewLayerType,
      metadataAccessPath: {
        en: url,
        fr: url,
      },
      listOfLayerEntryConfig: layerEntries as TypeListOfLayerEntryConfig,
    };

    if (layerType === GEOJSON || layerType === XYZ_TILES || layerType === GEOPACKAGE) {
      // TODO probably want an option to add metadata if geojson or geopackage
      // need to clear our metadata path or it will give errors trying to find it
      layerConfig.metadataAccessPath = {
        en: '',
        fr: '',
      };
    }

    if (layerType === GEOCORE) {
      delete layerConfig.metadataAccessPath;
    }

    if (layerType === OGC_FEATURE) {
      // make sure the metadataAccessPath is the root OGC API URL
      layerConfig.metadataAccessPath = {
        en: geoUtilities.getOGCServerUrl(layerURL),
        fr: geoUtilities.getOGCServerUrl(layerURL),
      };
    }

    if (valid) {
      // TODO issue #668 - geocore layers do not have same ID, it is impossible to use the added event
      // workaround - close after 3 sec
      if (layerType === GEOCORE) {
        setTimeout(() => {
          setIsLoading(false);
          // setAddLayerVisible(false); //TODO - Investigate
        }, 3000);
      }

      /* if (layerConfig.geoviewLayerId) {
        api.maps[mapId].layer.layerOrder.push(layerConfig.geoviewLayerId);
      } else if (layerConfig.listOfLayerEntryConfig !== undefined) {
        layerConfig.listOfLayerEntryConfig.forEach((subLayer: TypeLayerEntryConfig) => {
          if (subLayer.layerId) api.maps[mapId].layer.layerOrder.unshift(subLayer.layerId);
        });
      }
      */

      api.maps[mapId].layer.addGeoviewLayer(layerConfig);
    }
  };

  /**
   * Handle the behavior of the 'Back' button in the Stepper UI
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);
  };

  /**
   * Set layer URL from file input
   *
   * @param {File} file uploaded file
   */
  const handleFile = (file: File) => {
    const fileURL = URL.createObjectURL(file);
    setDisplayURL(file.name);
    setLayerURL(fileURL);
    const fileName = file.name.split('.')[0];
    setLayerType('');
    setLayerList([]);
    setLayerName(fileName);
    setLayerEntries([]);
  };

  /**
   * Set layer URL from form input
   *
   * @param e TextField event
   */
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setDisplayURL(event.target.value.trim());
    setLayerURL(event.target.value.trim());
    setLayerType('');
    setLayerList([]);
    setLayerName('');
    setLayerEntries([]);
  };

  /**
   * Set layerType from form input
   *
   * @param {SelectChangeEvent} event TextField event
   */
  const handleSelectType = (event: SelectChangeEvent<unknown>) => {
    setLayerType(event.target.value as TypeGeoviewLayerType);
    setLayerList([]);
    setLayerEntries([]);
  };

  /**
   * Set the currently selected layer from a list
   *
   * @param event Select event
   * @param newValue value/label pairs of select options
   */
  const handleSelectLayer = (event: Event, newValue: string[]) => {
    if (isMultiple()) {
      setLayerEntries(
        newValue.map((x: string) => {
          return { layerId: `${x[0]}` };
        }) as TypeListOfLayerEntryConfig
      );
      setLayerName(newValue.map((x) => x[1]).join(', '));
    } else {
      setLayerEntries([{ layerId: `${newValue[0]}` }] as TypeListOfLayerEntryConfig);
      setLayerName(newValue[1]);
    }
  };

  /**
   * Set the layer name from form input
   *
   * @param e TextField event
   */
  const handleNameLayer = (event: ChangeEvent<HTMLInputElement>) => {
    setLayerName(event.target.value);
  };

  /**
   * Handle file dragged into dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== dragPopover.current) {
      setDrag(true);
    }
  };

  /**
   * Handle file dragged out of dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === dragPopover.current) setDrag(false);
  };

  /**
   * Prevent default behaviour when file dragged over dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle file drop
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDrag(false);
    if (event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      const upFilename = file.name.toUpperCase();
      if (upFilename.endsWith('.JSON') || upFilename.endsWith('.GEOJSON') || upFilename.endsWith('.GPKG')) {
        handleFile(file);
      } else {
        emitErrorFile();
      }
    }
  };

  /**
   * Creates a set of Continue / Back buttons
   *
   * @param param0 specify if button is first or last in the list
   * @returns {JSX.Element} React component
   */
  // eslint-disable-next-line react/no-unstable-nested-components
  function NavButtons({ isFirst = false, isLast = false, handleNext }: ButtonPropsLayerPanel): JSX.Element {
    return isLoading ? (
      <Box sx={{ padding: 10 }}>
        <CircularProgressBase />
      </Box>
    ) : (
      <ButtonGroup sx={sxClasses.buttonGroup}>
        <Button variant="contained" type="text" onClick={handleNext}>
          {isLast ? t('layers.finish') : t('layers.continue')}
        </Button>
        {!isFirst && (
          <Button variant="contained" type="text" onClick={handleBack}>
            {t('layers.back')}
          </Button>
        )}
      </ButtonGroup>
    );
  }

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
                <div
                  className="dropzone"
                  style={{ position: 'relative' }}
                  onDrop={(e) => handleDrop(e)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDragEnter={(e) => handleDragEnter(e)}
                  onDragLeave={(e) => handleDragLeave(e)}
                >
                  {drag && (
                    <div
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
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) handleFile(e.target.files[0]);
                      }}
                      accept=".gpkg, .json, .geojson"
                    />
                  </div>
                  <Button type="text" onClick={() => document.getElementById('fileUpload')?.click()} className="">
                    <FileUploadIcon />
                    <span>{t('layers.upload')}</span>
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
                </div>
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
                    inputLabel={{
                      id: 'service-type-label',
                    }}
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
                    <TextField label={t('layers.name')} variant="standard" value={layerName} onChange={handleNameLayer} />
                  )}
                  {layerList.length > 1 && (
                    <Autocomplete
                      fullWidth
                      multiple={isMultiple()}
                      disableClearable={!isMultiple()}
                      id="service-layer-label"
                      options={layerList}
                      getOptionLabel={(option) => `${option[1]} (${option[0]})`}
                      renderOption={(props, option) => <span {...props}>{option[1] as string}</span>}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={handleSelectLayer as any}
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

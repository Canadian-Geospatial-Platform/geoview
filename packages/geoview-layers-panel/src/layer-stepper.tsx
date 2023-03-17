/* eslint-disable react/require-default-props */
import React, { DragEvent } from 'react';

import {
  TypeWindow,
  TypeJsonArray,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  SelectChangeEvent,
  snackbarMessagePayload,
  ButtonPropsLayerPanel,
  TypeListOfLayerEntryConfig,
  TypeJsonObject,
} from 'geoview-core';

type Event = { target: { value: string } };

interface Props {
  mapId: string;
  setAddLayerVisible: (isVisible: boolean) => void;
}

type EsriOptions = {
  err: string;
  capability: string;
};

const w = window as TypeWindow;

/**
 * A react component that displays the details panel content
 *
 * @returns {JSX.Element} A React JSX Element with the details panel
 */
function LayerStepper({ mapId, setAddLayerVisible }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, react, ui } = cgpv;
  const { displayLanguage } = api.map(mapId);

  const { ESRI_DYNAMIC, ESRI_FEATURE, GEOJSON, GEOPACKAGE, WMS, WFS, OGC_FEATURE, XYZ_TILES, GEOCORE } = api.layerTypes;
  const { useState, useEffect } = react;
  const {
    Select,
    Stepper,
    TextField,
    Button,
    ButtonGroup,
    Autocomplete,
    CircularProgressBase,
    Box,
    IconButton,
    CloseIcon,
    FileUploadIcon,
  } = ui.elements;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [displayURL, setDisplayURL] = useState('');
  const [layerType, setLayerType] = useState<TypeGeoviewLayerType | ''>('');
  const [layerList, setLayerList] = useState<TypeJsonArray[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerEntries, setLayerEntries] = useState<TypeListOfLayerEntryConfig>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);

  const dragPopover = React.useRef(null);

  const sxClasses = {
    buttonGroup: {
      paddingTop: 12,
      gap: 6,
    },
  };

  // TODO see issue #714, removed adding multiple layerType === WMS until resolved
  const isMultiple = () => layerType === ESRI_DYNAMIC || layerType === WFS;

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

  /**
   * Translations object to inject to the viewer translations
   */
  const translations = {
    en: {
      finish: 'Finish',
      continue: 'Continue',
      back: 'Back',
      or: 'or',
      dropzone: 'Drop Here',
      upload: 'Choose a File',
      drop: 'Drop the file to upload',
      url: 'Enter URL or UUID',
      layer: 'Layer',
      stepOne: 'Upload a File or enter URL/UUID',
      stepTwo: 'Select format',
      stepThree: 'Configure layer',
      stepFour: 'Enter Name',
      service: 'Service Type',
      name: 'Name',
      layerSelect: 'Select Layer',
      errorEmpty: 'cannot be empty',
      errorNone: 'No file or source added',
      errorFile: 'Only geoJSON and GeoPackage files can be used',
      errorServer: 'source is not valid',
      errorProj: 'does not support current map projection',
      only: 'only',
    },
    fr: {
      finish: 'Finir',
      continue: 'Continuer',
      back: 'Retour',
      or: 'ou',
      dropzone: 'Déposez ici',
      upload: 'Choisir un fichier',
      drop: 'Déposez le fichier à télécharger',
      url: "Entrer l'URL ou l'UUID",
      layer: 'Couche',
      stepOne: "Ajouter un fichier ou entrer l'URL/UUID",
      stepTwo: 'Sélectionnez le format',
      stepThree: 'Configurer la couche',
      stepFour: 'Entrez le nom',
      service: 'Type de service',
      name: 'Nom',
      layerSelect: 'Sélectionner la couche',
      errorEmpty: 'ne peut être vide',
      errorNone: 'Pas de fichier ou de source ajouté',
      errorFile: 'Seuls les fichiers geoJSON et GeoPackage peuvent être utilisés',
      errorServer: "source n'est pas valide",
      errorProj: 'ne prend pas en charge la projection cartographique actuelle',
      only: 'seulement',
    },
  };

  useEffect(() => {
    api.event.on(
      api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN,
      (payload) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (payload.message && payload.message.value === 'validation.layer.loadfailed') {
          setIsLoading(false);
        }
      },
      mapId
    );
    return () => {
      api.event.off(api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    api.event.emit(
      snackbarMessagePayload(api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
        type: 'string',
        value: `${textField} ${translations[displayLanguage].errorEmpty}`,
      })
    );
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorNone = () => {
    setIsLoading(false);
    api.event.emit(
      snackbarMessagePayload(api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
        type: 'string',
        value: translations[displayLanguage].errorNone,
      })
    );
  };

  /**
   * Emits an error dialogue when unsupported files are uploaded
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorFile = () => {
    api.event.emit(
      snackbarMessagePayload(api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
        type: 'string',
        value: translations[displayLanguage].errorFile,
      })
    );
  };

  /**
   * Emits an error when the URL does not support the selected service type
   *
   * @param serviceName type of service provided by the URL
   */
  const emitErrorServer = (serviceName: string) => {
    setIsLoading(false);
    api.event.emit(
      snackbarMessagePayload(api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
        type: 'string',
        value: `${serviceName} ${translations[displayLanguage].errorServer}`,
      })
    );
  };

  /**
   * Emits an error when a service does not support the current map projection
   *
   * @param serviceName type of service provided by the URL
   * @param proj current map projection
   */
  const emitErrorProj = (serviceName: string, proj: string | undefined, supportedProj: TypeJsonArray | string[]) => {
    setIsLoading(false);
    api.event.emit(
      snackbarMessagePayload(api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
        type: 'string',
        value: `${serviceName} ${translations[displayLanguage].errorProj} ${proj}, ${
          translations[displayLanguage].only
        } ${supportedProj.join(', ')}`,
      })
    );
  };

  /**
   * Using the layerURL state object, check whether URL is a valid WMS,
   * and add either Name and Entry directly to state if a single layer,
   * or a list of Names / Entries if multiple layer options exist.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const wmsValidation = async (): Promise<boolean> => {
    const proj = api.projection.projections[api.map(mapId).currentProjection].getCode();
    let supportedProj: string[] = [];
    try {
      const [baseUrl, queryString] = layerURL.split('?');
      const urlParams = new URLSearchParams(queryString);
      const layersParam = urlParams.get('layers');
      const wms = await api.geoUtilities.getWMSServiceMetadata(baseUrl, layersParam ?? '');
      supportedProj = wms.Capability.Layer.CRS as string[];
      if (!supportedProj.includes(proj)) throw new Error('proj');
      const layers: TypeJsonArray[] = [];
      const hasChildLayers = (layer: TypeJsonObject) => {
        if (layer.Layer && layer.Layer.length > 0) {
          (layer.Layer as TypeJsonObject[]).forEach((childLayer: TypeJsonObject) => {
            hasChildLayers(childLayer);
          });
        } else {
          layers.push([layer.Name, layer.Title] as TypeJsonArray);
        }
      };
      if (wms.Capability.Layer) {
        hasChildLayers(wms.Capability.Layer);
      }
      if (layers.length === 1) {
        setLayerName(layers[0][1] as string);
        setLayerEntries([
          {
            layerId: (layersParam ?? layers[0][0]) as string,
          },
        ]);
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
      const wfs = await api.geoUtilities.getWFSServiceMetadata(layerURL);
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
        ]);
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
      ]);
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
        ]);
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
  const geocoreValidation = async (): Promise<boolean> => {
    try {
      const isValid = layerURL.indexOf('/') === -1 && layerURL.replaceAll('-', '').length === 32;
      if (!isValid) throw new Error('err');
      setLayerName('');
      setLayerEntries([
        {
          layerId: layerURL,
        },
      ]);
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
      const esri = await api.geoUtilities.getESRIServiceMetadata(layerURL);
      if ((esri.capabilities as string).includes(esriOptions(type).capability)) {
        if ('layers' in esri) {
          const layers = (esri.layers as TypeJsonArray).map((aLayer) => [aLayer.id, aLayer.name]);
          if (layers.length === 1) {
            setLayerName(layers[0][1] as string);
            setLayerEntries([
              {
                layerId: layers[0][0] as string,
              },
            ]);
          } else {
            setLayerList(layers);
          }
        } else {
          setLayerName(esri.name as string);
          setLayerEntries([
            {
              layerId: esri.id as string,
            },
          ]);
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
    const proj = api.projection.projections[api.map(mapId).currentProjection].getCode();
    const tiles = ['{x}', '{y}', '{z}'];
    for (let i = 0; i < tiles.length; i += 1) {
      if (!layerURL.includes(tiles[i])) {
        emitErrorServer('XYZ Tile');
        return false;
      }
    }
    if (proj !== 'EPSG:3857') {
      emitErrorProj('XYZ Tiles', proj, ['EPSG:3857']);
      return false;
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
    ]);
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
      ]);
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
    ]);
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
      emitErrorEmpty(translations[displayLanguage].service);
    } else if (layerType === WMS) valid = await wmsValidation();
    else if (layerType === WFS) valid = await wfsValidation();
    else if (layerType === OGC_FEATURE) valid = await ogcFeatureValidation();
    else if (layerType === XYZ_TILES) valid = xyzValidation();
    else if (layerType === ESRI_DYNAMIC) valid = await esriValidation(ESRI_DYNAMIC);
    else if (layerType === ESRI_FEATURE) valid = await esriValidation(ESRI_FEATURE);
    else if (layerType === GEOJSON) valid = await geoJSONValidation();
    else if (layerType === GEOPACKAGE) valid = await geoPackageValidation();
    else if (layerType === GEOCORE) valid = await geocoreValidation();
    if (valid) {
      setIsLoading(false);
      setActiveStep(2);
    }
  };

  /**
   * Handle the behavior of the 'Finish' button in the Stepper UI
   */
  const handleStep3 = () => {
    let valid = true;
    if (layerEntries.length === 0) {
      valid = false;
      emitErrorEmpty(translations[displayLanguage].layer);
    }
    if (valid) setActiveStep(3);
  };

  /**
   * Handle the behavior of the 'Finish' button in the Stepper UI
   */
  const handleStepLast = () => {
    setIsLoading(true);
    const geoviewLayerId = api.generateId();
    api.event.on(
      api.eventNames.LAYER.EVENT_LAYER_ADDED,
      () => {
        api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, mapId);
        setIsLoading(false);
        setAddLayerVisible(false);
      },
      `${mapId}/${geoviewLayerId}`
    );

    let valid = true;
    const name = layerName;
    let url = layerURL;
    if (layerType === ESRI_DYNAMIC || layerType === ESRI_FEATURE) {
      url = api.geoUtilities.getMapServerUrl(layerURL);
    }
    if (layerType === WMS) {
      [url] = layerURL.split('?');
    }

    if (layerName === '') {
      valid = false;
      emitErrorEmpty(isMultiple() ? translations[displayLanguage].layer : translations[displayLanguage].name);
    }
    const layerConfig: TypeGeoviewLayerConfig = {
      geoviewLayerId,
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
        en: api.geoUtilities.getOGCServerUrl(layerURL),
        fr: api.geoUtilities.getOGCServerUrl(layerURL),
      };
    }
    if (valid) {
      // TODO issue #668 - geocore layers do not have same ID, it is impossible to use the added event
      // workaround - close after 3 sec
      if (layerType === GEOCORE) {
        setTimeout(() => {
          setIsLoading(false);
          setAddLayerVisible(false);
        }, 3000);
      }

      if (layerConfig.geoviewLayerId) {
        api.map(mapId).layer.layerOrder.push(layerConfig.geoviewLayerId);
      } else if (layerConfig.listOfLayerEntryConfig !== undefined) {
        layerConfig.listOfLayerEntryConfig.forEach((subLayer) => {
          if (subLayer.layerId) api.map(mapId).layer.layerOrder.unshift(subLayer.layerId);
        });
      }

      api.map(mapId).layer.addGeoviewLayer(layerConfig);
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
  const handleInput = (event: Event) => {
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
        })
      );
      setLayerName(newValue.map((x) => x[1]).join(', '));
    } else {
      setLayerEntries([{ layerId: `${newValue[0]}` }]);
      setLayerName(newValue[1]);
    }
  };

  /**
   * Set the layer name from form input
   *
   * @param e TextField event
   */
  const handleNameLayer = (event: Event) => {
    setLayerName(event.target.value);
  };

  /**
   * Handle file dragged into dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
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
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === dragPopover.current) setDrag(false);
  };

  /**
   * Prevent default behaviour when file dragged over dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle file drop
   *
   * @param {DragEvent<HTMLDivElement>} event Drag event
   */
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
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
          {isLast ? translations[displayLanguage].finish : translations[displayLanguage].continue}
        </Button>
        {!isFirst && (
          <Button variant="contained" type="text" onClick={handleBack}>
            {translations[displayLanguage].back}
          </Button>
        )}
      </ButtonGroup>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'end', zIndex: 2 }}>
        <IconButton color="primary" onClick={() => setAddLayerVisible(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Stepper
        sx={{ position: 'relative', top: '-30px', zIndex: 1 }}
        activeStep={activeStep}
        orientation="vertical"
        steps={[
          {
            stepLabel: {
              children: translations[displayLanguage].stepOne,
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
                        {translations[displayLanguage].dropzone}
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
                    <span>{translations[displayLanguage].upload}</span>
                  </Button>
                  <p style={{ textAlign: 'center' }}>
                    <small>{translations[displayLanguage].drop}</small>
                  </p>
                  <p style={{ textAlign: 'center' }}>{translations[displayLanguage].or}</p>
                  <TextField
                    sx={{ width: '100%' }}
                    label={translations[displayLanguage].url}
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
              children: translations[displayLanguage].stepTwo,
            },
            stepContent: {
              children: (
                <>
                  <Select
                    fullWidth
                    labelId="service-type-label"
                    value={layerType}
                    onChange={handleSelectType}
                    label={translations[displayLanguage].service}
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
              children: translations[displayLanguage].stepThree,
            },
            stepContent: {
              children: (
                <>
                  {layerList.length === 0 && (
                    <TextField label={translations[displayLanguage].name} variant="standard" value={layerName} onChange={handleNameLayer} />
                  )}
                  {layerList.length > 1 && (
                    <Autocomplete
                      fullWidth
                      multiple={isMultiple()}
                      disableCloseOnSelect
                      disableClearable={!isMultiple()}
                      id="service-layer-label"
                      options={layerList}
                      getOptionLabel={(option) => `${option[1]} (${option[0]})`}
                      renderOption={(props, option) => <span {...props}>{option[1]}</span>}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={handleSelectLayer as any}
                      renderInput={(params) => <TextField {...params} label={translations[displayLanguage].layerSelect} />}
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
                  children: translations[displayLanguage].stepFour,
                },
                stepContent: {
                  children: (
                    <>
                      <TextField
                        sx={{ width: '100%' }}
                        label={translations[displayLanguage].name}
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
    </>
  );
}

export default LayerStepper;

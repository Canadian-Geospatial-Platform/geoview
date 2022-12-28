/* eslint-disable react/require-default-props */
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

  const { ESRI_DYNAMIC, ESRI_FEATURE, GEOJSON, GEOPACKAGE, WMS, WFS, OGC_FEATURE, XYZ_TILES, GEOCORE } = api.layerTypes;
  const { useState, useEffect } = react;
  const { Select, Stepper, TextField, Button, ButtonGroup, Autocomplete, CircularProgressBase, Box } = ui.elements;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [layerType, setLayerType] = useState<TypeGeoviewLayerType | ''>('');
  const [layerList, setLayerList] = useState<TypeJsonArray[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerEntries, setLayerEntries] = useState<TypeListOfLayerEntryConfig>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        value: `${textField} cannot be empty`,
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
        value: `URL is not a valid ${serviceName} Server`,
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
        value: `${serviceName} does not support current map projection ${proj}, only ${supportedProj.join(', ')}`,
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
   * Using the layerURL state object, check whether URL is a valid OGC API.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const ogcFeatureValidation = async (): Promise<boolean> => {
    const keys = ['collections', 'links'];
    try {
      const response = await fetch(`${layerURL}/collections?f=json`);
      const json = await response.json();
      const isValid = keys.every((key) => Object.keys(json).includes(key));
      if (!isValid) throw new Error('err');
      const layers = (json.collections as TypeJsonArray).map((aFeatureType) => [aFeatureType.id, aFeatureType.title]);
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
      setLayerName(layerId);
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
  const geoPackageValidation = async (): Promise<boolean> => {
    try {
      const sqlPromise = initSqlJs({
        locateFile: (file) => `./node_modules/sql.js/dist/${file}`,
      });
      const dataPromise = fetch(layerURL).then((res) => res.arrayBuffer());
      const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
      const db = new SQL.Database(new Uint8Array(buf));
    } catch (err) {
      emitErrorServer('GeoPackage');
      return false;
    }
    return true;
  };

  /**
   * Attempt to determine the layer type based on the URL format
   */
  const bestGuessLayerType = () => {
    const layerTokens = layerURL.toUpperCase().split('/');
    const layerId = parseInt(layerTokens[layerTokens.length - 1], 10);
    if (layerURL.toUpperCase().endsWith('MAPSERVER') || layerURL.toUpperCase().endsWith('MAPSERVER/')) {
      setLayerType(ESRI_DYNAMIC);
    } else if (
      layerURL.toUpperCase().indexOf('FEATURESERVER') !== -1 ||
      (layerURL.toUpperCase().indexOf('MAPSERVER') !== -1 && !Number.isNaN(layerId))
    ) {
      setLayerType(ESRI_FEATURE);
    } else if (layerTokens.indexOf('WFS') !== -1) {
      setLayerType(WFS);
    } else if (layerURL.toUpperCase().endsWith('.JSON') || layerURL.toUpperCase().endsWith('.GEOJSON')) {
      setLayerType(GEOJSON);
    } else if (layerURL.toUpperCase().endsWith('.GPKG')) {
      setLayerType(GEOPACKAGE);
    } else if (layerURL.toUpperCase().indexOf('{Z}/{X}/{Y}') !== -1 || layerURL.toUpperCase().indexOf('{Z}/{Y}/{X}') !== -1) {
      setLayerType(XYZ_TILES);
    } else if (layerURL.indexOf('/') === -1 && layerURL.replaceAll('-', '').length === 32) {
      setLayerType(GEOCORE);
    } else if (layerURL.toUpperCase().indexOf('WMS') !== -1) {
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
      emitErrorEmpty('URL');
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
      emitErrorEmpty('Service Type');
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
      emitErrorEmpty('Layer');
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
      mapId,
      geoviewLayerId
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
      emitErrorEmpty(isMultiple() ? 'Name' : 'Layer');
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

    if (layerType === GEOJSON || layerType === XYZ_TILES) {
      // TODO probably want an option to add metadata if geojson
      // need to clear our metadata path or it will give errors trying to find it
      layerConfig.metadataAccessPath = {
        en: '',
        fr: '',
      };
    }
    if (layerType === GEOCORE) {
      delete layerConfig.metadataAccessPath;
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
   * Set layer URL from form input
   *
   * @param e TextField event
   */
  const handleInput = (event: Event) => {
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
    setLayerName('');
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
          {isLast ? 'Finish' : 'Continue'}
        </Button>
        {!isFirst && (
          <Button variant="contained" type="text" onClick={handleBack}>
            Back
          </Button>
        )}
      </ButtonGroup>
    );
  }

  return (
    <Stepper
      activeStep={activeStep}
      orientation="vertical"
      steps={[
        {
          stepLabel: {
            children: 'Enter URL / UUID',
          },
          stepContent: {
            children: (
              <>
                <TextField sx={{ width: '100%' }} label="URL" variant="standard" value={layerURL} onChange={handleInput} multiline />
                <br />
                <NavButtons isFirst handleNext={handleStep1} />
              </>
            ),
          },
        },
        {
          stepLabel: {
            children: 'Select format',
          },
          stepContent: {
            children: (
              <>
                <Select
                  fullWidth
                  labelId="service-type-label"
                  value={layerType}
                  onChange={handleSelectType}
                  label="Service Type"
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
            children: 'Configure layer',
          },
          stepContent: {
            children: (
              <>
                {layerList.length === 0 && <TextField label="Name" variant="standard" value={layerName} onChange={handleNameLayer} />}
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
                    renderInput={(params) => <TextField {...params} label="Select Layer" />}
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
                children: 'Enter Name',
              },
              stepContent: {
                children: (
                  <>
                    <TextField sx={{ width: '100%' }} label="Name" variant="standard" value={layerName} onChange={handleNameLayer} />
                    <br />
                    <NavButtons isLast handleNext={handleStepLast} />
                  </>
                ),
              },
            }
          : null,
      ]}
    />
  );
}

export default LayerStepper;

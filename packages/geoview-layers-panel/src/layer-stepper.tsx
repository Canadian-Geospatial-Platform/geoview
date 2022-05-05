/* eslint-disable react/require-default-props */
import {
  TypeWindow,
  toJsonObject,
  TypeJsonArray,
  TypeDynamicLayerEntry,
  TypeOgcLayerEntry,
  TypeLayerConfig,
  TypeWebLayers,
  TypeSelectChangeEvent,
  snackbarMessagePayload,
} from 'geoview-core';

type Event = { target: { value: string } };

interface Props {
  mapId: string;
  setAddLayerVisible: (isVisible: boolean) => void;
}

interface ButtonProps {
  isFirst?: boolean;
  isLast?: boolean;
  handleNext: () => void;
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

  const { ESRI_DYNAMIC, ESRI_FEATURE, GEOJSON, WMS, WFS, OGC_FEATURE, XYZ_TILES } = api.layerTypes;
  const { useState } = react;
  const { Select, Stepper, TextField, Button, ButtonGroup, Typography, Autocomplete } = ui.elements;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [layerType, setLayerType] = useState<TypeWebLayers | ''>('');
  const [layerList, setLayerList] = useState<TypeJsonArray[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerEntries, setLayerEntries] = useState<(TypeDynamicLayerEntry | TypeOgcLayerEntry)[]>([]);

  const useStyles = ui.makeStyles(() => ({
    buttonGroup: {
      paddingTop: 12,
      gap: 6,
    },
  }));
  const classes = useStyles();

  const isMultiple = () => layerType === ESRI_DYNAMIC;

  /**
   * List of layer types and labels
   */
  const layerOptions = [
    [ESRI_DYNAMIC, 'ESRI Dynamic Service'],
    [ESRI_FEATURE, 'ESRI Feature Service'],
    [GEOJSON, 'GeoJSON'],
    [WMS, 'OGC Web Map Service (WMS)'],
    [WFS, 'OGC Web Feature Service (WFS)'],
    [OGC_FEATURE, 'OGC API Features'],
    [XYZ_TILES, 'XYZ Raster Tiles'],
  ];

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
    const proj = api.map(mapId).projection.getCRS().code!;
    let supportedProj: string[] = [];
    try {
      const wms = await api.geoUtilities.getWMSServiceMetadata(layerURL, '');
      supportedProj = wms.Capability.Layer.CRS as string[];
      if (!supportedProj.includes(proj)) throw new Error('proj');
      const layers = (wms.Capability.Layer.Layer as TypeJsonArray).map((aLayer) => [aLayer.Name, aLayer.Title]);
      if (layers.length === 1) {
        setLayerName(layers[0][1] as string);
        setLayerEntries([
          {
            id: layers[0][0] as string,
          },
        ]);
      } else setLayerList(layers);
    } catch (err) {
      if (err === 'proj') emitErrorProj('WMS', proj, supportedProj);
      else emitErrorServer('WMS');
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
        toJsonObject((aFeatureType.Name['#text'] as string).split(':')[1]),
        aFeatureType.Title['#text'],
      ]);
      if (layers.length === 1) {
        setLayerName(layers[0][1] as string);
        setLayerEntries([
          {
            id: layers[0][0] as string,
          },
        ]);
      } else setLayerList(layers);
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
            id: layers[0][0] as string,
          },
        ]);
      } else setLayerList(layers);
    } catch (err) {
      emitErrorServer('OGC API Feature');
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
                index: layers[0][0] as number,
              },
            ]);
          } else setLayerList(layers);
        } else {
          setLayerName(esri.name as string);
          setLayerEntries([
            {
              index: esri.id as number,
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
    const proj = api.map(mapId).projection.getCRS().code;
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
      if (!['FeatureCollection', 'Feature'].includes(json.type)) throw new Error('err');
    } catch (err) {
      emitErrorServer('GeoJSON');
      return false;
    }
    return true;
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
    if (valid) setActiveStep(1);
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep2 = async () => {
    let valid = true;
    if (layerType === undefined) {
      valid = false;
      emitErrorEmpty('Service Type');
    }
    if (layerType === WMS) valid = await wmsValidation();
    if (layerType === WFS) valid = await wfsValidation();
    if (layerType === OGC_FEATURE) valid = await ogcFeatureValidation();
    else if (layerType === XYZ_TILES) valid = xyzValidation();
    else if (layerType === ESRI_DYNAMIC) valid = await esriValidation(ESRI_DYNAMIC);
    else if (layerType === ESRI_FEATURE) valid = await esriValidation(ESRI_FEATURE);
    else if (layerType === GEOJSON) valid = await geoJSONValidation();
    if (valid) setActiveStep(2);
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
    let valid = true;
    const name = layerName;
    let url = layerURL;
    let entries = layerEntries;
    // if (Array.isArray(entries)) entries = entries.join(',');
    if (layerType === ESRI_DYNAMIC) url = api.geoUtilities.getMapServerUrl(layerURL);
    else if (layerType === ESRI_FEATURE) {
      url = `${api.geoUtilities.getMapServerUrl(layerURL)}/${(layerEntries as TypeDynamicLayerEntry[])[0].index}`;
      entries = [];
    }

    if (layerName === '') {
      valid = false;
      emitErrorEmpty(isMultiple() ? 'Name' : 'Layer');
    }
    const layerConfig: TypeLayerConfig = {
      id: api.generateId(),
      name: {
        en: name,
        fr: name,
      },
      layerType: layerType as TypeWebLayers,
      url: {
        en: url,
        fr: url,
      },
      layerEntries: entries,
    };
    if (valid) {
      api.map(mapId).layer.addLayer(layerConfig);
      setAddLayerVisible(false);
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
    setLayerURL(event.target.value);
    setLayerType('');
    setLayerList([]);
    setLayerName('');
    setLayerEntries([]);
  };

  /**
   * Set layerType from form input
   *
   * @param {TypeSelectChangeEvent} event TextField event
   */
  const handleSelectType = (event: TypeSelectChangeEvent<unknown>) => {
    setLayerType(event.target.value as TypeWebLayers);
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
          if (layerType === ESRI_DYNAMIC) {
            return {
              index: parseInt(x[0], 10),
            } as TypeDynamicLayerEntry;
          }

          return {
            id: x[0] as string,
          } as TypeOgcLayerEntry;
        })
      );
      setLayerName(newValue.map((x) => x[1]).join(', '));
    } else {
      if (layerType === ESRI_DYNAMIC) {
        setLayerEntries([
          {
            index: parseInt(newValue[0], 10),
          } as TypeDynamicLayerEntry,
        ]);
      } else {
        setLayerEntries([
          {
            id: newValue[0],
          } as TypeOgcLayerEntry,
        ]);
      }
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
  function NavButtons({ isFirst = false, isLast = false, handleNext }: ButtonProps): JSX.Element {
    return (
      <ButtonGroup className={classes.buttonGroup}>
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
            children: 'Enter URL',
          },
          stepContent: {
            children: (
              <>
                <TextField sx={{ width: '100%' }} label="URL" variant="standard" value={layerURL} onChange={handleInput} />
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
                    value,
                    children: label,
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
                {layerList.length === 0 && layerEntries.length === 0 && (
                  <TextField label="Name" variant="standard" value={layerName} onChange={handleNameLayer} />
                )}
                {layerList.length === 0 && layerEntries.length > 0 && <Typography>{layerName}</Typography>}
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
                    // value={
                    //   layerType === ESRI_DYNAMIC
                    //     ? layerEntries.map((entry) => {
                    //         return (entry as TypeDynamicLayerEntry).index.toString();
                    //       })
                    //     : layerEntries.map((entry) => {
                    //         return (entry as TypeOgcLayerEntry).id;
                    //       })
                    // }
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

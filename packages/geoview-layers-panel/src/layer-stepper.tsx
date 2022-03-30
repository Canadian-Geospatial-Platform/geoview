interface Props {
  mapId: string;
  setAddLayerVisible: Function;
}
interface ButtonProps {
  isFirst?: boolean;
  isLast?: boolean;
}

type LayerList = [string, string];
type EsriOptions = {
  err: string;
  capability: string;
};

const w = window as any;

/**
 * List of layer types and labels
 */
const layerOptions = [
  ['esriDynamic', 'ESRI Dynamic Service'],
  ['esriFeature', 'ESRI Feature Service'],
  ['geoJSON', 'GeoJSON'],
  ['ogcWMS', 'OGC Web Map Service (WMS)'],
  ['ogcWFS', 'OGC Web Feature Service (WFS)'],
  ['xyzTiles', 'XYZ Raster Tiles'],
];

/**
 * Returns the appropriate error config for ESRI layer types
 *
 * @param type one of esriDynamic or esriFeature
 * @returns {EsriOptions} an error configuration object for populating dialogues
 */
const esriOptions = (type: string): EsriOptions => {
  switch (type) {
    case 'esriDynamic':
      return { err: 'ESRI Map', capability: 'Map' };
    case 'esriFeature':
      return { err: 'ESRI Feature', capability: 'Query' };
    default:
      return { err: '', capability: '' };
  }
};

/**
 * A react component that displays the details panel content
 *
 * @returns {JSX.Element} A React JSX Element with the details panel
 */
const LayerStepper = ({ mapId, setAddLayerVisible }: Props): JSX.Element => {
  const cgpv = w['cgpv'];
  const { api, react, ui, mui } = cgpv;

  const { useState } = react;
  const { Button, ButtonGroup } = ui.elements;
  const { Stepper, Step, StepLabel, StepContent, TextField, Typography, InputLabel, FormControl, Select, MenuItem } = mui;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [layerType, setLayerType] = useState('');
  const [layerList, setLayerList] = useState([]);
  const [layerName, setLayerName] = useState('');
  const [layerEntry, setLayerEntry] = useState('');

  const useStyles = ui.makeStyles(() => ({
    buttonGroup: {
      paddingTop: 12,
      gap: 6,
    },
  }));
  const classes = useStyles();

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorEmpty = (textField: string) => {
    api.event.emit('snackbar/open', mapId, {
      message: {
        type: 'string',
        value: `${textField} cannot be empty`,
      },
    });
  };

  /**
   * Emits an error when the URL does not support the selected service type
   *
   * @param serviceName type of service provided by the URL
   */
  const emitErrorServer = (serviceName: string) => {
    api.event.emit('snackbar/open', mapId, {
      message: {
        type: 'string',
        value: `URL is not a valid ${serviceName} Server`,
      },
    });
  };

  /**
   * Emits an error when a service does not support the current map projection
   *
   * @param serviceName type of service provided by the URL
   * @param proj current map projection
   */
  const emitErrorProj = (serviceName: string, proj: string) => {
    api.event.emit('snackbar/open', mapId, {
      message: {
        type: 'string',
        value: `${serviceName} does not support current map projection ${proj}`,
      },
    });
  };

  /**
   * Using the layerURL state object, check whether URL is a valid WMS,
   * and add either Name and Entry directly to state if a single layer,
   * or a list of Names / Entries if multiple layer options exist.
   *
   * @returns {Promise<boolean>} True if layer passes validation
   */
  const wmsValidation = async (): Promise<boolean> => {
    const proj = api.map(mapId).projection.getCRS().code;
    try {
      const wms = await api.geoUtilities.getWMSServiceMetadata(layerURL, '');
      const supportedProj = wms.Capability.Layer.CRS;
      if (!supportedProj.includes(proj)) throw 'proj';
      const layers = wms.Capability.Layer.Layer.map((x: any) => [x.Name, x.Title]);
      if (layers.length === 1) {
        setLayerName(layers[0][1]);
        setLayerEntry(layers[0][0]);
      } else setLayerList(layers);
    } catch (err) {
      if (err == 'proj') emitErrorProj('WMS', proj);
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
      const layers = wfs.FeatureTypeList.FeatureType.map((x: any) => [x.Name['#text'].split(':')[1], x.Title['#text']]);
      if (layers.length === 1) {
        setLayerName(layers[0][1]);
        setLayerEntry(layers[0][0]);
      } else setLayerList(layers);
    } catch (err) {
      emitErrorServer('WFS');
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
      if (esri.capabilities.includes(esriOptions(type).capability)) {
        if ('layers' in esri) {
          const layers = esri.layers.map(({ id, name }: any) => [String(id), name]);
          if (layers.length === 1) {
            setLayerName(layers[0][1]);
            setLayerEntry(layers[0][0]);
          } else setLayerList(layers);
        } else {
          setLayerName(esri.name);
          setLayerEntry(String(esri.id));
        }
      } else {
        throw 'err';
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
    for (const tile of tiles) {
      if (!layerURL.includes(tile)) {
        emitErrorServer('XYZ Tile');
        return false;
      }
    }
    if (proj !== 'EPSG:3857') {
      emitErrorProj('XYZ Tiles', proj);
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
      if (!['FeatureCollection', 'Feature'].includes(json.type)) throw 'err';
    } catch (err) {
      emitErrorServer('GeoJSON');
      return false;
    }
    return true;
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleNext = async () => {
    if (activeStep === 0) {
      if (layerURL.trim() === '') return emitErrorEmpty('URL');
    }
    if (activeStep === 1) {
      let valid = true;
      if (layerType === '') return emitErrorEmpty('Service Type');
      if (layerType === 'ogcWMS') valid = await wmsValidation();
      if (layerType === 'ogcWFS') valid = await wfsValidation();
      else if (layerType === 'xyzTiles') valid = xyzValidation();
      else if (layerType === 'esriDynamic') valid = await esriValidation('esriDynamic');
      else if (layerType === 'esriFeature') valid = await esriValidation('esriFeature');
      else if (layerType === 'geoJSON') valid = await geoJSONValidation();
      if (!valid) return;
    }
    if (activeStep === 2) {
      let name = layerName;
      let url = layerURL;
      let entries = layerEntry;
      if (layerType === 'esriDynamic') url = api.geoUtilities.getMapServerUrl(layerURL);
      else if (layerType === 'esriFeature') {
        url = api.geoUtilities.getMapServerUrl(layerURL) + '/' + layerEntry;
        entries = '';
      }
      if (layerName === '') return emitErrorEmpty('Layer');
      const layerConfig = { name, type: layerType, url, entries };
      api.map(mapId).layer.addLayer(layerConfig);
      setAddLayerVisible(false);
      handleInput({ target: { value: '' } });
      setActiveStep(-1);
    }
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
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
  const handleInput = (e: any) => {
    setLayerURL(e.target.value);
    setLayerType('');
    setLayerList([]);
    setLayerName('');
    setLayerEntry('');
  };

  /**
   * Set layerType from form input
   *
   * @param e TextField event
   */
  const handleSelectType = (e: any) => {
    setLayerType(e.target.value);
    setLayerList([]);
    setLayerName('');
    setLayerEntry('');
  };

  /**
   * Set the layer name from form input
   *
   * @param e TextField event
   */
  const handleNameLayer = (e: any) => {
    setLayerName(e.target.value);
  };

  /**
   * Set the currently selected layer from a list
   *
   * @param e Select event
   */
  const handleSelectLayer = (e: any) => {
    setLayerEntry(e.target.value);
    const name = layerList.find((x: LayerList) => x[0] === e.target.value)[1];
    setLayerName(name);
  };

  /**
   * Creates a set of Continue / Back buttons
   *
   * @param param0 specify if button is first or last in the list
   * @returns {JSX.Element} React component
   */
  const NavButtons = ({ isFirst = false, isLast = false }: ButtonProps): JSX.Element => (
    <ButtonGroup
      className={classes.buttonGroup}
      children={
        <>
          <Button variant="contained" type="text" onClick={handleNext} children={isLast ? 'Finish' : 'Continue'} />
          {!isFirst && <Button variant="contained" type="text" onClick={handleBack} children="Back" />}
        </>
      }
    />
  );

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step>
        <StepLabel>Enter URL</StepLabel>
        <StepContent>
          <TextField label="URL" variant="standard" value={layerURL} onChange={handleInput} />
          <br />
          <NavButtons isFirst />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>Select format</StepLabel>
        <StepContent>
          <FormControl fullWidth>
            <InputLabel id="service-type-label">Service Type</InputLabel>
            <Select labelId="service-type-label" value={layerType} onChange={handleSelectType} label="Service Type">
              {layerOptions.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <NavButtons />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>Configure layer</StepLabel>
        <StepContent>
          {layerList.length === 0 && layerEntry === '' && (
            <TextField label="Name" variant="standard" value={layerName} onChange={handleNameLayer} />
          )}
          {layerList.length === 0 && layerEntry !== '' && <Typography>{layerName}</Typography>}
          {layerList.length > 1 && (
            <FormControl fullWidth>
              <InputLabel id="service-layer-label">Select Layer</InputLabel>
              <Select labelId="service-layer-label" value={layerEntry} onChange={handleSelectLayer} label="Select Layer">
                {layerList.map(([value, label]: LayerList) => (
                  <MenuItem key={value + label} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <br />
          <NavButtons isLast />
        </StepContent>
      </Step>
    </Stepper>
  );
};

export default LayerStepper;

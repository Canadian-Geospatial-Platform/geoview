import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useState } from 'react';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';
import _ from 'lodash';
import PillsAutoComplete, { PillsAutoCompleteOption } from './PillsAutoComplete';



export function ConfigBuilderTab() {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { configJson, updateConfigProperty } = cgpvContext;

  const [mapInteraction, setMapInteraction] = useState<string>('dynamic');
  const [minZoom, setMinZoom] = useState<number>(0);
  const [maxZoom, setMaxZoom] = useState<number>(0);
  const [projection, setProjection] = useState<string>('3978');
  const [enableRotation, setEnableRotation] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [navBar, setNavBar] = useState<string[]>([]); // options "zoom", "fullscreen", "home", "basemap-select"
  const [useFooterBar, setUseFooterBar] = useState<boolean>(true);
  const [footerBarTabs, setFooterBarTabs] = useState<string[]>([]); // options "legend", "layers", "details", "data-table"
  const [useAppBar, setUseAppBar] = useState<boolean>(true);
  const [appBarTabs, setAppBarTabs] = useState<string[]>([]); // options "legend", "layers", "details", "data-table"
  const [useOverviewMap, setUseOverviewMap] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>('geo.ca');
  const [language, setLanguage] = useState<string>('en');

  const footerTabslist: PillsAutoCompleteOption[] = [
    { title: 'Legend', value: 'legend' },
    { title: 'Layers', value: 'layers' },
    { title: 'Details', value: 'details' },
    { title: 'Data Table', value: 'data-table' }
  ];

  const appBarOptions: PillsAutoCompleteOption[] = [
    { title: 'Legend', value: 'legend' },
    { title: 'Layers', value: 'layers' },
    { title: 'Details', value: 'details' },
    { title: 'Data Table', value: 'data-table' },
    { title: 'Geolocator', value: 'geolocator' },
    { title: 'Export', value: 'export' }
  ];

  //'zoom', 'fullscreen', 'home', 'location', 'basemap-select'
  const navBarList: PillsAutoCompleteOption[] = [
    { title: 'Zoom', value: 'zoom' },
    { title: 'Fullscreen', value: 'fullscreen' },
    { title: 'Home', value: 'home' },
    { title: 'Location', value: 'location' },
    { title: 'Basemap Select', value: 'basemap-select' },
  ];

  const getProperty = (property: string, defaultValue = undefined) => {
    return _.get(configJson, property) ?? defaultValue;
  };

  const updateProperty = (property: string, value: any) => {
    updateConfigProperty(property, value);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ marginBottom: '8px' }}>
        Configurations Builder
      </Typography>

      <FormControl component="fieldset" sx={{ gap: 2 }}>
        <FormGroup aria-label="position">
          <FormLabel component="legend">Map Interaction</FormLabel>
          <RadioGroup
            row
            aria-label="mapInteraction"
            name="mapInteraction"
            value={getProperty('map.interaction')}
            onChange={(event) => updateProperty('map.interaction', event.target.value)}
          >
            <FormControlLabel value="static" control={<Radio />} label="Static" />
            <FormControlLabel value="dynamic" control={<Radio />} label="Dynamic" />
          </RadioGroup>
        </FormGroup>


        <FormGroup aria-label="position">
          <FormLabel component="legend">Zoom Levels</FormLabel>
          
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <FormControl>
              <FormLabel component="legend">Min Zoom</FormLabel>
              <TextField type="number" size="small" value={minZoom} onChange={(event) => setMinZoom(Number(event.target.value))} />
            </FormControl>
            <FormControl>
              <FormLabel component="legend">Max Zoom</FormLabel>
              <TextField type="number" size="small" value={maxZoom} onChange={(event) => setMaxZoom(Number(event.target.value))} />
            </FormControl>
          </Box>
        </FormGroup>
        <FormGroup aria-label="position">
          <FormLabel component="legend">Projection</FormLabel>
          <Select
            labelId="demo-select-small-label"
            size="small"
            id="demo-select-small"
            value={projection}
            label="Display Projection"
            onChange={(event) => setProjection(event.target.value)}
          >
            <MenuItem value={3978}>LCC</MenuItem>
            <MenuItem value={3857}>Web Mercator</MenuItem>
          </Select>
        </FormGroup>
        <FormGroup aria-label="position">
          <FormLabel component="legend">Rotation</FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <FormControl>
              <FormLabel component="legend">Enable Rotation</FormLabel>
              <RadioGroup
                row
                aria-label="enableRotation"
                name="enableRotation"
                value={enableRotation}
                onChange={(event) => setEnableRotation(event.target.value === 'true')}
              >
                <FormControlLabel value={true} control={<Radio />} label="Yes" />
                <FormControlLabel value={false} control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel component="legend">Rotation</FormLabel>
              <TextField type="number" size="small" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} />
            </FormControl>
          </Box>
        </FormGroup>
        <FormGroup aria-label="position">
          <FormLabel component="legend">Navigation Bar</FormLabel>
          <PillsAutoComplete options={navBarList} label="Options" placeholder="" />
        </FormGroup>

        <FormGroup aria-label="position">
          <FormLabel component="legend">
            Footer Bar
            <Switch checked={useFooterBar} onChange={(event) => setUseFooterBar(event.target.checked)} />
          </FormLabel>
          <PillsAutoComplete options={footerTabslist} label="Footer Options" placeholder="" />
        </FormGroup>

        <FormGroup aria-label="position">
          <FormLabel component="legend">
            App Bar
            <Switch checked={useAppBar} onChange={(event) => setUseAppBar(event.target.checked)} />
          </FormLabel>
          <PillsAutoComplete options={appBarOptions} label="App-bar Options" placeholder="" />
        </FormGroup>
      </FormControl>
    </Box>
  );
}

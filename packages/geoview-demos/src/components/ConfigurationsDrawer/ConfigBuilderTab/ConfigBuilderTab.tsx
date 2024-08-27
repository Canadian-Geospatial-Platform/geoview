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
import PillsAutoComplete from '../../PillsAutoComplete';
import { componentsOptions, footerTabslist, navBarOptions, appBarOptions, mapInteractionOptions, mapProjectionOptions, zoomOptions, themeOptions } from '../../../constants';
import SingleSelectComplete from '../../SingleSelectAutoComplete';



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



  const getProperty = (property: string, defaultValue = undefined) => {
    return _.get(configJson, property) ?? defaultValue;
  };

  const updateProperty = (property: string, value: any) => {
    updateConfigProperty(property, value);
  };

  const updateArrayProperty = (property: string, value: any) => {
    updateConfigProperty(property, value);
  }

  const toggleOffProperty = (property: string) => {
    updateConfigProperty(property, undefined);
  }

  const isPropertyEnabled = (property: string) => {
    return getProperty(property) !== undefined;
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>, property: string) => {
    if (!event.target.checked) {
      toggleOffProperty(property);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>

      <FormControl component="fieldset" sx={{ gap: 3 }}>

      <FormGroup aria-label="position">
          <SingleSelectComplete 
            options={themeOptions}
            value={getProperty('theme')}
            onChange={(value) => updateProperty('theme', value)}
            label="Display Theme" placeholder="" />
        </FormGroup>


        <FormGroup aria-label="position">
          <SingleSelectComplete 
            options={mapInteractionOptions}
            value={getProperty('map.interaction')}
            onChange={(value) => updateProperty('map.interaction', value)}
            label="Map Interaction" placeholder="" />
        </FormGroup>


        <FormGroup aria-label="position">
          <FormLabel component="legend">Zoom Levels</FormLabel>

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <FormControl>
              <SingleSelectComplete 
            options={zoomOptions}
            value={getProperty('map.viewSettings.minZoom')}
            onChange={(value) => updateProperty('map.viewSettings.minZoom', value)}
            label="Min Zoom" placeholder="" />
            </FormControl>
            <FormControl>
              <SingleSelectComplete 
            options={zoomOptions}
            value={getProperty('map.viewSettings.maxZoom')}
            onChange={(value) => updateProperty('map.viewSettings.maxZoom', value)}
            label="Max Zoom" placeholder="" />
            </FormControl>
          </Box>
        </FormGroup>

        <FormGroup aria-label="map projection">
          <SingleSelectComplete 
            options={mapProjectionOptions}
            value={getProperty('map.viewSettings.projection')}
            onChange={(value) => updateProperty('map.viewSettings.projection', value)}
            label="Map Projection" placeholder="" />
        </FormGroup>

        <FormGroup aria-label="Components">
          <FormLabel component="legend">Components</FormLabel>
          <PillsAutoComplete
            value={getProperty('components')}
            onChange={(value) => updateArrayProperty('components', value)}
            options={componentsOptions}
            label="Components Options"
            placeholder=""
          />
        </FormGroup>

        <FormGroup aria-label="Navigation Bar Options">
          <FormLabel component="legend">Navigation Bar</FormLabel>
          <PillsAutoComplete
            value={getProperty('navBar')}
            onChange={(value) => updateArrayProperty('navBar', value)}
            options={navBarOptions}
            label="Options" placeholder="" />
        </FormGroup>

        <FormGroup aria-label="Footer bar">
          <FormLabel component="legend">
            Footer Bar
            <Switch size="small" checked={isPropertyEnabled('footerBar.tabs.core')}
              onChange={(event) => handleSwitchChange(event, 'footerBar')}
            />
          </FormLabel>
          <PillsAutoComplete
            value={getProperty('footerBar.tabs.core')}
            onChange={(value) => updateArrayProperty('footerBar.tabs.core', value)}
            options={footerTabslist} label="Footer Options" placeholder="" />
        </FormGroup>

        <FormGroup aria-label="Appbar">
          <FormLabel component="legend">
            App Bar
            <Switch size="small" checked={isPropertyEnabled('appBar.tabs.core')}
              onChange={(event) => handleSwitchChange(event, 'appBar')}
            />
          </FormLabel>
          <PillsAutoComplete
            value={getProperty('appBar.tabs.core')}
            onChange={(value) => updateArrayProperty('appBar.tabs.core', value)}
            options={appBarOptions} label="App-bar Options" placeholder="" />
        </FormGroup>
      </FormControl>
    </Box>
  );
}

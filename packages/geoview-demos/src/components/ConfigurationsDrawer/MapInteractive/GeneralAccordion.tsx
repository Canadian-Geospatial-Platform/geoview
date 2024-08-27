import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  FormLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useContext } from 'react';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';
import { ConfigFileResource } from '../../../types';
import { CONFIG_FILES_LIST, languageOptions, mapProjectionOptions, themeOptions } from '../../../constants';
import SingleSelectComplete from '../../SingleSelectAutoComplete';
import { CodeSnipperPopup } from '../../CodeSnippet';

interface GeneralAccordionProps {
  showConfigsList?: boolean;
}

export default function GeneralAccordion(props: GeneralAccordionProps) {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const {
    displayLanguage,
    displayTheme,
    displayProjection,
    mapWidth,
    setMapWidth,
    mapHeight,
    setMapHeight,

    handleDisplayLanguage,
    handleDisplayTheme,
    handleDisplayProjection,
    handleReloadMap,
    handleRemoveMap,
    handleConfigFileChange,
    handleApplyWidthHeight,
    applyWidthHeight,
  } = cgpvContext;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {props.showConfigsList && 
        <SingleSelectComplete
        options={CONFIG_FILES_LIST}
        value={displayLanguage}
        onChange={(value) => handleConfigFileChange(value)}
        label="Configurations" placeholder="" />
      }

      <FormGroup aria-label="Map Seize">
          <FormLabel component="legend">
            Map Size
            <Switch size="small" checked={applyWidthHeight}
              onChange={(e) => handleApplyWidthHeight(e.target.checked)}
            />
          </FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
        <TextField
          size="small"
          label="Width"
          id="outlined-start-adornment"
          value={mapWidth}
          onChange={(e) => setMapWidth(Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
          }}
        />
        <TextField
          size="small"
          label="Height"
          id="outlined-start-adornment"
          value={mapHeight}
          onChange={(e) => setMapHeight(Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
          }}
        />
      </Box>

      </FormGroup>

      

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <SingleSelectComplete
          options={languageOptions}
          value={displayLanguage}
          onChange={(value) => handleDisplayLanguage(value)}
          label="Display Language" placeholder="" />
      </FormControl>

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <SingleSelectComplete
          options={themeOptions}
          value={displayTheme}
          onChange={(value) => handleDisplayTheme(value)}
          label="Display Theme" placeholder="" />
      </FormControl>

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <SingleSelectComplete
          options={mapProjectionOptions}
          value={displayProjection}
          onChange={(value) => handleDisplayProjection(value)}
          label="Display Projection" placeholder="" />
      </FormControl>

      <CodeSnipperPopup  code={`<FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <SingleSelectComplete
          options={mapProjectionOptions}
          value={displayProjection}
          onChange={(value) => handleDisplayProjection(value)}
          label="Display Projection" placeholder="" />
      </FormControl>`}/>
    </Box>
  );
}

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
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useContext } from 'react';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';
import { ConfigFileResource } from '../../../types';
import { CONFIG_FILES_LIST } from '../../../constants';

export default function GeneralAccordion() {
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
  } = cgpvContext;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Autocomplete
        disablePortal
        size="small"
        id="combo-box-demo"
        options={CONFIG_FILES_LIST}
        isOptionEqualToValue={(option: ConfigFileResource, value: ConfigFileResource) => option.filePath === value.filePath}
        getOptionLabel={(option: ConfigFileResource) => option.label}
        onChange={(e, value) => handleConfigFileChange(value?.filePath ?? null)}
        renderInput={(params: any) => <TextField {...params} label="Configuration" />}
      />

      <Typography variant="h6">Map Size</Typography>

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

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small-label">Display Language</InputLabel>
        <Select
          labelId="demo-select-small-label"
          id="demo-select-small"
          value={displayLanguage}
          label="Display Language"
          onChange={(e) => handleDisplayLanguage(e)}
        >
          <MenuItem value={'en'}>English</MenuItem>
          <MenuItem value={'fr'}>French</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small-label">Display Theme</InputLabel>
        <Select
          labelId="demo-select-small-label"
          id="demo-select-small"
          value={displayTheme}
          label="Display Theme"
          onChange={(e) => handleDisplayTheme(e)}
        >
          <MenuItem value={'geo.ca'}>geo.ca</MenuItem>
          <MenuItem value={'light'}>Light</MenuItem>
          <MenuItem value={'dark'}>Dark</MenuItem>
          <MenuItem value={'unsupported'}>Unsupported</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small-label">Display Projection</InputLabel>
        <Select
          labelId="demo-select-small-label"
          id="demo-select-small"
          value={displayProjection}
          label="Display Projection"
          onChange={(e) => handleDisplayProjection(e)}
        >
          <MenuItem value={3978}>LCC</MenuItem>
          <MenuItem value={3857}>Web Mercator</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

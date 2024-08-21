import { LoadingButton } from "@mui/lab";
import { Autocomplete, Box, Button, ButtonGroup, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { useContext } from "react";
import { CGPVContext } from "../../providers/cgpvContextProvider/CGPVContextProvider";

type ConfigType = {
  filePath: string;
  label: string;
}

export default function SettingsTab() {

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
    handleConfigFileChange
  } = cgpvContext;


  const configsList: ConfigType[] = [
    { filePath: "navigator/01-basemap-LCC-TLS.json", label: "Basemap LCC Transport-Labeled-Shaded" },
    { filePath: "navigator/02-basemap-LCC-SL.json", label: "Basemap LCC Simple-Labeled (overview map hide on zoom 7 and lower) " },
    { filePath: "navigator/03-projection-WM.json", label: "Basemap WM" },
    { filePath: "navigator/04-restrict-zoom.json", label: "Restricted zoom [4, 8]" },
    { filePath: "navigator/05-zoom-layer.json", label: "Zoom on layer extent" },
    { filePath: "navigator/06-basic-footer.json", label: "Basic map with footer" },
    { filePath: "navigator/07-basic-appbar.json", label: "Basic map with app bar" },
    { filePath: "navigator/26-package-area-of-interest.json", label: "Package Area of interest" },
    { filePath: "navigator/08-package-basemap.json", label: "Package basemap panel" },
    { filePath: "navigator/09-package-basemap-custom.json", label: "Package custom basemap panel" },
    { filePath: "navigator/10-package-time-slider.json", label: "Package time slider" },
    { filePath: "navigator/11-package-time-slider-custom.json", label: "Package custom time slider" },
    { filePath: "navigator/12-package-geochart.json", label: "Package geochart" },
    { filePath: "navigator/12-a-package-swiper.json", label: "Package swiper" },
    { filePath: "navigator/13-all-layers.json", label: "All Layer Types" },
    { filePath: "navigator/14-wms-layer.json", label: "Layer - WMS -" },
    { filePath: "navigator/15-xyz-tile.json", label: "Layer - XYZ Tile -" },
    { filePath: "navigator/16-esri-dynamic.json", label: "Layer - ESRI Dynamic -" },
    { filePath: "navigator/17-esri-feature.json", label: "Layer - ESRI Feature -" },
    { filePath: "navigator/18-esri-image.json", label: "Layer - ESRI Image -" },
    { filePath: "navigator/19-geojson.json", label: "Layer - GeoJSON -" },
    { filePath: "navigator/20-wfs.json", label: "Layer - WFS -" },
    { filePath: "navigator/21-ogc-feature-api.json", label: "Layer - OGC Feature API -" },
    { filePath: "navigator/22-static-image.json", label: "Layer - Static Image -" },
    { filePath: "navigator/23-csv.json", label: "Layer - CSV -" },
    { filePath: "navigator/24-vector-tile.json", label: "Layer - Vector Tile -" },
    { filePath: "navigator/25-geojson-multi.json", label: "Layer - GeoJSON MutiPolygon -" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      <ButtonGroup variant="outlined" aria-label="Loading button group" size="small" sx={{ marginBottom: '20px' }}>
        <Button onClick={handleReloadMap}>Reload Map</Button>
        <LoadingButton
          onClick={handleRemoveMap}
        >Remove Map</LoadingButton>
        <LoadingButton loading loadingPosition="start" startIcon={<SaveIcon />}>
          Apply
        </LoadingButton>
      </ButtonGroup>

      <Autocomplete
        disablePortal
        size="small"
        id="combo-box-demo"
        options={configsList}
        isOptionEqualToValue={(option: ConfigType, value: ConfigType) => option.filePath === value.filePath}
        getOptionLabel={(option: ConfigType) => option.label}
        onChange={(e, value) => handleConfigFileChange(value?.filePath ?? null)}
        renderInput={(params: any) => <TextField {...params} label="Configuration" />}
      />

      <Typography variant="h6">Map Size</Typography>

      <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
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
          <MenuItem value={"en"}>English</MenuItem>
          <MenuItem value={"fr"}>French</MenuItem>
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
          <MenuItem value={"geo.ca"}>geo.ca</MenuItem>
          <MenuItem value={"light"}>Light</MenuItem>
          <MenuItem value={"dark"}>Dark</MenuItem>
          <MenuItem value={"unsupported"}>Unsupported</MenuItem>
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

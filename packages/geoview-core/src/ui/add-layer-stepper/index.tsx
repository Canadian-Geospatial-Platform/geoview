import { useState } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { Button } from "../button";
import { ButtonGroup } from "../button-group";
import { api } from "../../api/api";

const layerOptions = [
  ["ogcWMS", "OGC Web Map Service (WMS)"],
  ["xyzTiles", "XYZ Raster Tiles"],
  ["esriDynamic", "ESRI Dynamic Service"],
  ["esriFeature", "ESRI Feature Service"],
  ["geoJSON", "GeoJSON"],
];

const esriOptions = {
  esriDynamic: { err: "ESRI Map", capability: "Map" },
  esriFeature: { err: "ESRI Feature", capability: "Query" },
};

const emitErrorEmpty = (mapId: string, inputType: string) =>
  api.event.emit("snackbar/open", mapId, {
    message: {
      type: "string",
      value: `${inputType} cannot be empty`,
    },
  });

const emitErrorServer = (mapId: string, serviceType: string) =>
  api.event.emit("snackbar/open", mapId, {
    message: {
      type: "string",
      value: `URL is not a valid ${serviceType} Server`,
    },
  });

const emitErrorProj = (mapId: string, service: string, proj: string) =>
  api.event.emit("snackbar/open", mapId, {
    message: {
      type: "string",
      value: `${service} does not support current map projection ${proj}`,
    },
  });

/**
 * A react component that displays the details panel content
 *
 * @returns A React JSX Element with the details panel
 */
export const AddLayerStepper = ({ mapId }): JSX.Element => {
  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState("");
  const [layerType, setLayerType] = useState("");
  const [layerList, setLayerList] = useState([]);
  const [layerName, setLayerName] = useState("");
  const [layerEntry, setLayerEntry] = useState("");

  const wmsValidation = async (): Promise<boolean> => {
    const proj = api.map(mapId).projection.getCRS().code;
    try {
      const wms = await api.geoUtilities.getWMSServiceMetadata(layerURL, "");
      const supportedProj = wms.Capability.Layer.CRS;
      if (!supportedProj.includes(proj)) throw "proj";
      const layers = wms.Capability.Layer.Layer.map((x) => [x.Name, x.Title]);
      if (layers.length === 1) {
        setLayerName(layers[0][1]);
        setLayerEntry(layers[0][0]);
      } else setLayerList(layers);
    } catch (err) {
      if (err == "proj") emitErrorProj(mapId, "WMS", proj);
      else emitErrorServer(mapId, "WMS");
      return false;
    }
    return true;
  };

  const esriValidation = async (type: string): Promise<boolean> => {
    try {
      const esri = await api.geoUtilities.getESRIServiceMetadata(layerURL);
      if (esri.capabilities.includes(esriOptions[type].capability)) {
        if ("layers" in esri) {
          const layers = esri.layers.map(({ id, name }) => [String(id), name]);
          if (layers.length === 1) {
            setLayerName(layers[0][1]);
            setLayerEntry(layers[0][0]);
          } else setLayerList(layers);
        } else {
          setLayerName(esri.name);
          setLayerEntry(String(esri.id));
        }
      } else {
        throw "err";
      }
    } catch (err) {
      emitErrorServer(mapId, esriOptions[type].err);
      return false;
    }
    return true;
  };

  const xyzValidation = (): boolean => {
    const proj = api.map(mapId).projection.getCRS().code;
    const tiles = ["{x}", "{y}", "{z}"];
    for (const tile of tiles) {
      if (!layerURL.includes(tile)) {
        emitErrorServer(mapId, "XYZ Tile");
        return false;
      }
    }
    if (proj !== "EPSG:3857") {
      emitErrorProj(mapId, "XYZ Tiles", proj);
      return false;
    }
    return true;
  };

  const geoJSONValidation = async (): Promise<boolean> => {
    try {
      const response = await fetch(layerURL);
      const json = await response.json();
      if (!["FeatureCollection", "Feature"].includes(json.type)) throw "err";
    } catch (err) {
      emitErrorServer(mapId, "GeoJSON");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (layerURL.trim() === "") return emitErrorEmpty(mapId, "URL");
    }
    if (activeStep === 1) {
      let valid = true;
      if (layerType === "") return emitErrorEmpty(mapId, "Service Type");
      if (layerType === "ogcWMS") valid = await wmsValidation();
      else if (layerType === "xyzTiles") valid = xyzValidation();
      else if (layerType === "esriDynamic")
        valid = await esriValidation("esriDynamic");
      else if (layerType === "esriFeature")
        valid = await esriValidation("esriFeature");
      else if (layerType === "geoJSON") valid = await geoJSONValidation();
      if (!valid) return;
    }
    if (activeStep === 2) {
      let name = layerName;
      let url = layerURL;
      let entries = layerEntry;
      if (layerType === "esriDynamic")
        url = api.geoUtilities.getMapServerUrl(layerURL);
      else if (layerType === "esriFeature") {
        url = api.geoUtilities.getMapServerUrl(layerURL) + "/" + layerEntry;
        entries = "";
      }
      if (layerName === "") return emitErrorEmpty(mapId, "Layer");
      api.map(mapId).layer.addLayer({ name, type: layerType, url, entries });
    }
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
  };

  const handleBack = () =>
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);

  const handleInput = (e: any) => {
    setLayerURL(e.target.value);
    setLayerType("");
    setLayerList([]);
    setLayerName("");
    setLayerEntry("");
  };

  const handleSelectType = (e: any) => {
    setLayerType(e.target.value);
    setLayerList([]);
    setLayerName("");
    setLayerEntry("");
  };

  const handleNameLayer = (e: any) => setLayerName(e.target.value);

  const handleSelectLayer = (e: any) => {
    setLayerEntry(e.target.value);
    const name = layerList.find((x) => x[0] === e.target.value)[1];
    setLayerName(name);
  };

  const NavButtons = ({ isFirst = false, isLast = false }) => (
    <>
      <br />
      <ButtonGroup
        children={
          <>
            <Button
              variant="contained"
              type="text"
              onClick={handleNext}
              children={isLast ? "Finish" : "Continue"}
            />
            {!isFirst && (
              <Button
                variant="contained"
                type="text"
                onClick={handleBack}
                children="Back"
              />
            )}
          </>
        }
      ></ButtonGroup>
    </>
  );

  const LayersList = () => (
    <>
      {layerList.length === 0 && layerEntry === "" && (
        <TextField
          label="Name"
          variant="standard"
          value={layerName}
          onChange={handleNameLayer}
        />
      )}
      {layerList.length === 0 && layerEntry !== "" && (
        <Typography>{layerName}</Typography>
      )}
      {layerList.length > 1 && (
        <FormControl fullWidth>
          <InputLabel id="service-layer-label">Select Layer</InputLabel>
          <Select
            labelId="service-layer-label"
            value={layerEntry}
            onChange={handleSelectLayer}
            label="Select Layer"
          >
            {layerList.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step>
        <StepLabel>Enter URL</StepLabel>
        <StepContent>
          <TextField
            label="URL"
            variant="standard"
            value={layerURL}
            onChange={handleInput}
          />
          <NavButtons isFirst />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>Select format</StepLabel>
        <StepContent>
          <FormControl fullWidth>
            <InputLabel id="service-type-label">Service Type</InputLabel>
            <Select
              labelId="service-type-label"
              value={layerType}
              onChange={handleSelectType}
              label="Service Type"
            >
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
          <LayersList />
          <NavButtons isLast />
        </StepContent>
      </Step>
    </Stepper>
  );
};

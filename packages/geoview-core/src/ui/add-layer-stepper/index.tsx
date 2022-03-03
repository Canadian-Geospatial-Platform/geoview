import { useState } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
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

const emitErrorServer = (mapId: string, serviceType: string) =>
  api.event.emit("snackbar/open", mapId, {
    message: {
      type: "string",
      value: `URL is not a valid ${serviceType} Server`,
    },
  });

const emitErrorProj = (mapId: string, proj: string) =>
  api.event.emit("snackbar/open", mapId, {
    message: {
      type: "string",
      value: `WMS does not support current map projection ${proj}`,
    },
  });

/**
 * A react component that displays the details panel content
 *
 * @returns A React JSX Element with the details panel
 */
export const AddLayerStepper = ({ mapId }): JSX.Element => {
  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState(
    // "https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBCT3978/MapServer"
    // "https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/Provinces/MapServer"
    "https://gis.saskatchewan.ca/arcgis/rest/services/Environment/Airspaces/FeatureServer"
  );
  const [layerType, setLayerType] = useState("");
  const [layerList, setLayerList] = useState([]);
  const [layerEntry, setLayerEntry] = useState("");

  const wmsValidation = async (): Promise<boolean> => {
    const proj = api.map(mapId).projection.getCRS().code;
    try {
      const wms = await api.geoUtilities.getWMSServiceMetadata(layerURL, "");
      const supportedProj = wms.Capability.Layer.CRS;
      if (!supportedProj.includes(proj)) throw "proj";
      const layers = wms.Capability.Layer.Layer.map(({ Name, Title }) => [
        Name,
        Title,
      ]);
      setLayerList(layers);
      return true;
    } catch (err) {
      if (err == "proj") emitErrorProj(mapId, proj);
      else emitErrorServer(mapId, "WMS");
      return false;
    }
  };

  const esriValidation = async (type: string): Promise<boolean> => {
    try {
      const esri = await api.geoUtilities.getESRIServiceMetadata(layerURL);
      if (esri.capabilities.includes(esriOptions[type].capability)) {
        if ("layers" in esri) {
          const layers = esri.layers.map(({ id, name }) => [String(id), name]);
          setLayerList(layers);
        } else {
          setLayerList([[String(esri.id), esri.name]]);
        }
      } else {
        throw "err";
      }
      return true;
    } catch (err) {
      emitErrorServer(mapId, esriOptions[type].err);
      return false;
    }
  };

  const handleNext = async () => {
    if (activeStep === 1) {
      let valid = true;
      if (layerType === "ogcWMS") {
        valid = await wmsValidation();
      } else if (layerType === "esriDynamic") {
        valid = await esriValidation("esriDynamic");
      } else if (layerType === "esriFeature") {
        valid = await esriValidation("esriFeature");
      }
      if (!valid) return;
    }
    if (activeStep === 2) {
      const name = layerList.find((x) => x[0] === layerEntry)[1];
      let url = layerURL;
      let entries = layerEntry;
      if (layerType === "esriDynamic") {
        url = api.geoUtilities.getMapServerUrl(layerURL);
      } else if (layerType === "esriFeature") {
        url = api.geoUtilities.getMapServerUrl(layerURL) + "/" + layerEntry;
        entries = "";
      }
      api.map(mapId).layer.addLayer({
        name,
        type: layerType,
        url,
        entries,
      });
    }
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
  };

  const handleBack = () =>
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);

  const handleInput = (e: any) => {
    setLayerURL(e.target.value);
    setLayerType("");
    setLayerList([]);
    setLayerEntry("");
  };

  const handleSelectType = (e: any) => {
    setLayerType(e.target.value);
    setLayerList([]);
    setLayerEntry("");
  };

  const handleSelectLayer = (e: any) => setLayerEntry(e.target.value);

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

  const Step1 = () => (
    <>
      <StepLabel>Upload data</StepLabel>
      <StepContent>
        <Typography>Upload a file or enter a URL</Typography>
        <TextField
          label="URL"
          variant="standard"
          value={layerURL}
          onChange={handleInput}
        />
        <NavButtons isFirst />
      </StepContent>
    </>
  );

  const Step2 = () => (
    <>
      <StepLabel>Select format</StepLabel>
      <StepContent>
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
        <NavButtons />
      </StepContent>
    </>
  );

  const Step3 = () => (
    <>
      <StepLabel>Configure layer</StepLabel>
      <StepContent>
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
        <NavButtons isLast />
      </StepContent>
    </>
  );

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step>
        <Step1 />
      </Step>
      <Step>
        <Step2 />
      </Step>
      <Step>
        <Step3 />
      </Step>
    </Stepper>
  );
};

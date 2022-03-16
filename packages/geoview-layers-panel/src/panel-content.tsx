import { TypePanelContentProps, TypeProps } from "geoview-core";

import LayerStepper from "./layer-stepper";
import LayersList from "./layers-list";
import getLayerInfo from "./layer-info";

const w = window as any;

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns {JSX.Element} A React JSX Element with the details panel
 */
const PanelContent = (props: TypePanelContentProps): JSX.Element => {
  const { mapId } = props;

  const cgpv = w["cgpv"];
  const { api, react, ui } = cgpv;
  const { useState, useEffect } = react;
  const [layersData, setLayersData] = useState({});
  const [addLayerVisible, setAddLayerVisible] = useState(false);
  const { Button } = ui.elements;

  const { language } = api.map(mapId);

  const translations: TypeProps<TypeProps<any>> = {
    "en-CA": {
      addLayer: "Add Layer",
    },
    "fr-CA": {
      addLayer: "Ajouter Couche",
    },
  };

  const useStyles = ui.makeStyles(() => ({
    mainContainer: {
      display: "flex",
      flexDirection: "row",
    },
    addLayerButton: {
      width: 50,
      minWidth: 50,
      "& > div": {
        textAlign: "center",
      },
    },
  }));
  const classes = useStyles();

  const onClick = () => setAddLayerVisible((state: boolean) => !state);

  useEffect(() => {
    getLayerInfo(setLayersData, api, mapId);
    api.event.on(
      "layer/added",
      (payload: any) => {
        if (payload && payload.handlerName.includes(mapId))
          getLayerInfo(setLayersData, api, mapId, payload.layer);
      },
      mapId
    );

    return () => {
      api.event.off("layer/added", mapId);
    };
  }, []);

  return (
    <>
      <div className={classes.mainContainer}>
        <Button
          className={classes.addLayerButton}
          tooltip={translations[language].addLayer}
          tooltipPlacement="right"
          variant="contained"
          type="icon"
          icon='<i class="material-icons">add</i>'
          onClick={onClick}
        />
      </div>
      <div style={{ display: addLayerVisible ? "inherit" : "none" }}>
        <LayerStepper mapId={mapId} setAddLayerVisible={setAddLayerVisible} />
      </div>
      <div style={{ display: addLayerVisible ? "none" : "inherit" }}>
        <LayersList layersData={layersData} language={language} />
      </div>
    </>
  );
};

export default PanelContent;

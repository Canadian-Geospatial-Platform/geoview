import { TypePanelContentProps } from "geoview-core";
import LayersList from "./layers-list";
import getLayers from "./get-layers";

const w = window as any;

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns A React JSX Element with the details panel
 */
const PanelContent = (props: TypePanelContentProps): JSX.Element => {
  const { mapId } = props;

  const cgpv = w["cgpv"];
  const { api, react, ui } = cgpv;
  const { useState, useEffect } = react;
  const [layersData, setLayersData] = useState({});

  const { AddLayerStepper } = ui.elements;
  const useStyles = ui.makeStyles(() => ({
    mainContainer: {
      display: "flex",
      flexDirection: "row",
    },
  }));
  const classes = useStyles();

  useEffect(() => getLayers(setLayersData, api, mapId), []);

  return (
    <div className={classes.mainContainer}>
      {/* <LayersList layersData={layersData} /> */}
      <AddLayerStepper mapId={mapId} />
    </div>
  );
};

export default PanelContent;

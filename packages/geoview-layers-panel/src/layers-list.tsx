/* eslint-disable react/no-array-index-key */
import { TypeLayersListProps } from "geoview-core";

const w = window as any;

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersListProps} props properties passed to the component
 * @returns {JSX.Element} a React JSX Element containing map server layers
 */
const LayersList = (props: TypeLayersListProps): JSX.Element => {
  const { layersData } = props;

  const cgpv = w["cgpv"];
  const { ui, react, leaflet } = cgpv;
  const { useState } = react;
  const [selectedLayer, setSelectedLayer] = useState("");

  const useStyles = ui.makeStyles(() => ({
    layersContainer: {
      overflow: "hidden",
      overflowY: "auto",
      width: "100%",
    },
    layerItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "5px 0",
      padding: "10px 5px",
      boxSizing: "content-box",
      "&:hover": {
        cursor: "pointer",
        backgroundColor: "#c9c9c9",
      },
      zIndex: 1000,
      border: "none",
      width: "100%",
    },
    layerParentText: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    layerCountTextContainer: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      height: "32px",
    },
    layerItemText: {
      fontSize: "14px",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      marginLeft: "10px",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
  }));

  const classes = useStyles();

  const onClick = (value: string) => {
    const selected = value !== selectedLayer ? value : "";
    setSelectedLayer(selected);
  };

  return (
    <div className={classes.layersContainer}>
      {Object.values(layersData).map((data) => (
        <div key={data.id}>
          {Object.values(data.layers).map(
            ({ layer, groupLayer }, index: number) => (
              <div key={index}>
                {groupLayer ? (
                  <div className={classes.layerParentText} title={layer.name}>
                    {layer.name}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={classes.layerItem}
                      onClick={() => onClick(data.id + layer.id)}
                    >
                      <div className={classes.layerCountTextContainer}>
                        <div
                          className={classes.layerItemText}
                          title={layer.name}
                        >
                          {layer.name}
                        </div>
                      </div>
                    </button>
                    {selectedLayer === data.id + layer.id && (
                      <div>
                        {(layer.drawingInfo?.renderer.type === "simple" ||
                          data.type === "geoJSON") && (
                          <div className={classes.layerItemText}>
                            <img
                              src={
                                ["esriFeature", "geoJSON"].includes(data.type)
                                  ? leaflet.Marker.prototype.options.icon
                                      .options.iconUrl
                                  : `data:${layer.drawingInfo?.renderer.symbol.contentType};base64,${layer.drawingInfo?.renderer.symbol.imageData}`
                              }
                            />
                            {layer.drawingInfo?.renderer.label || layer.name}
                          </div>
                        )}
                        {layer.drawingInfo?.renderer.type === "uniqueValue" &&
                          layer.drawingInfo?.renderer.uniqueValueInfos.map(
                            (uniqueValue, index) => (
                              <div
                                key={index}
                                className={classes.layerItemText}
                              >
                                <img
                                  src={`data:${uniqueValue.symbol.contentType};base64,${uniqueValue.symbol.imageData}`}
                                />
                                {uniqueValue.label}
                              </div>
                            )
                          )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default LayersList;

/* eslint-disable react/no-array-index-key */
import { TypeLayersListProps, TypeLayerData } from "geoview-core";

const w = window as any;

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersListProps} props properties passed to the component
 * @returns {JSX.Element} a React JSX Element containing map server layers
 */
const LayersList = (props: TypeLayersListProps): JSX.Element => {
  const { layersData } = props;

  const cgpv = w["cgpv"];
  const { mui, ui, react, leaflet } = cgpv;
  const { useState, useEffect } = react;
  const [selectedLayer, setSelectedLayer] = useState("");
  const [sliderPosition, setSliderPosition] = useState({});

  const { Slider } = mui;

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
    layerItemGroup: {
      paddingBottom: 12,
    },
    sliderGroup: {
      display: "flex",
    },
    slider: {
      width: "100%",
      paddingLeft: 20,
      paddingRight: 20,
    },
  }));

  useEffect(() => {
    const defaultSliders = Object.values(layersData).reduce(
      (prev, curr) => ({ ...prev, [curr.id]: 100 }),
      {}
    );
    setSliderPosition((state) => ({ ...defaultSliders, ...state }));
  }, [layersData]);

  const classes = useStyles();

  /**
   * Sets the currently selected layer,
   * sets to blank if value is same as currently selecetd layer
   *
   * @param value layer button value
   */
  const onClick = (value: string) => {
    const selected = value !== selectedLayer ? value : "";
    setSelectedLayer(selected);
  };

  /**
   * Adjusts layer opacity when slider is moved
   *
   * @param value slider opacity value (0-100)
   * @param data Layer data
   */
  const onSliderChange = (value: number, data: TypeLayerData) => {
    setSliderPosition((state) => ({ ...state, [data.id]: value }));
    data.layer.setOpacity(value / 100);
  };

  return (
    <div className={classes.layersContainer}>
      {Object.values(layersData).map((data) => (
        <div key={data.id}>
          <>
            <button
              type="button"
              className={classes.layerItem}
              onClick={() => onClick(data.id)}
            >
              <div className={classes.layerCountTextContainer}>
                <div className={classes.layerItemText} title={data.name}>
                  {data.name}
                </div>
              </div>
            </button>
            {selectedLayer === data.id && (
              <>
                {data.layer.setOpacity && (
                  <div className={classes.sliderGroup}>
                    <i className="material-icons">contrast</i>
                    <div className={classes.slider}>
                      <Slider
                        size="small"
                        value={sliderPosition[data.id]}
                        valueLabelDisplay="auto"
                        onChange={(e) => onSliderChange(e.target.value, data)}
                      />
                    </div>
                  </div>
                )}
                {Object.values(data.layers).map(
                  ({ layer, groupLayer }, index: number) => (
                    <div key={index} className={classes.layerItemGroup}>
                      {groupLayer ? (
                        <div
                          className={classes.layerParentText}
                          title={layer.name}
                        >
                          {layer.name}
                        </div>
                      ) : (
                        <>
                          {Object.values(data.layers).length > 1 && (
                            <div
                              className={classes.layerItemText}
                              title={layer.name}
                            >
                              {layer.name}
                            </div>
                          )}
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
                        </>
                      )}
                    </div>
                  )
                )}
              </>
            )}
          </>
        </div>
      ))}
    </div>
  );
};

export default LayersList;

/* eslint-disable react/no-array-index-key */
import { TypeLayersListProps, TypeLayerData, TypeProps } from "geoview-core";

const w = window as any;

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersListProps} props properties passed to the component
 * @returns {JSX.Element} a React JSX Element containing map server layers
 */
const LayersList = (props: TypeLayersListProps): JSX.Element => {
  const { layersData, language } = props;

  const cgpv = w["cgpv"];
  const { mui, ui, react, leaflet } = cgpv;
  const { useState, useEffect } = react;
  const [selectedLayer, setSelectedLayer] = useState("");
  const [layerOpacity, setLayerOpacity] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  const { Slider, Tooltip, Checkbox } = mui;

  const translations: TypeProps<TypeProps<any>> = {
    "en-CA": {
      opacity: "Adjust Opacity",
      visibility: "Toggle Visibility",
    },
    "fr-CA": {
      opacity: "Ajuster l'opacité",
      visibility: "Basculer la visibilité",
    },
  };

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
      justifyContent: "flex-end",
      alignItems: "baseline",
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
    setLayerOpacity((state) => ({ ...defaultSliders, ...state }));

    const defaultVisibility = Object.values(layersData).reduce(
      (prev, curr) => ({ ...prev, [curr.id]: true }),
      {}
    );
    setLayerVisibility((state) => ({ ...defaultVisibility, ...state }));
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
   * Sets opacity value for layer
   *
   * @param opacity opacity value for layer (0-1)
   * @param data Layer data
   */
  const setOpacity = (opacity: number, data: TypeLayerData) => {
    if (data.layer.setOpacity) data.layer.setOpacity(opacity);
    else if (data.layer.eachFeature)
      data.layer.eachFeature((x) => x.setOpacity(opacity));
    else if (data.layer.getLayers)
      data.layer.getLayers().forEach((x) => x.setOpacity(opacity));
  };

  /**
   * Adjusts layer opacity when slider is moved
   *
   * @param value slider opacity value (0-100)
   * @param data Layer data
   */
  const onSliderChange = (value: number, data: TypeLayerData) => {
    setLayerOpacity((state) => ({ ...state, [data.id]: value }));
    const opacity = layerVisibility[data.id] ? value / 100 : 0;
    setOpacity(opacity, data);
  };

  /**
   * Adjusts layer visibility when checkbox is toggled
   *
   * @param value checkbox boolean
   * @param data Layer data
   */
  const onCheckboxChange = (value: number, data: TypeLayerData) => {
    setLayerVisibility((state) => ({ ...state, [data.id]: value }));
    const opacity = value ? layerOpacity[data.id] / 100 : 0;
    setOpacity(opacity, data);
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
                <div className={classes.sliderGroup}>
                  <Tooltip title={translations[language].opacity}>
                    <i className="material-icons">contrast</i>
                  </Tooltip>
                  <div className={classes.slider}>
                    <Slider
                      size="small"
                      value={layerOpacity[data.id]}
                      valueLabelDisplay="auto"
                      onChange={(e) => onSliderChange(e.target.value, data)}
                    />
                  </div>
                  <Tooltip title={translations[language].visibility}>
                    <Checkbox
                      checked={layerVisibility[data.id]}
                      onChange={(e) => onCheckboxChange(e.target.checked, data)}
                    />
                  </Tooltip>
                </div>
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

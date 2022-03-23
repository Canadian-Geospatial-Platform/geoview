/* eslint-disable react/no-array-index-key */
import {
  TypeLayersPanelListProps,
  TypeLayerData,
  TypeProps,
} from "geoview-core";

const w = window as any;

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersPanelListProps} props properties passed to the component
 * @returns {JSX.Element} a React JSX Element containing map server layers
 */
const LayersList = (props: TypeLayersPanelListProps): JSX.Element => {
  const { mapId, layers, language } = props;

  const cgpv = w["cgpv"];
  const { mui, ui, react, api, leaflet: L } = cgpv;
  const { useState, useEffect } = react;
  const [selectedLayer, setSelectedLayer] = useState("");
  const [layerLegend, setLayerLegend] = useState({});
  const [layerBounds, setLayerBounds] = useState({});
  const [layerBbox, setLayerBbox] = useState(L.polygon([]));
  const [layerOpacity, setLayerOpacity] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  const { Slider, Tooltip, Checkbox } = mui;
  const { Button } = ui.elements;

  const translations: TypeProps<TypeProps<any>> = {
    "en-CA": {
      bounds: "Toggle Bounds",
      zoom: "Zoom to Layer",
      remove: "Remove Layer",
      opacity: "Adjust Opacity",
      visibility: "Toggle Visibility",
    },
    "fr-CA": {
      bounds: "Basculer la limite",
      zoom: "Zoom sur la Couche",
      remove: "Supprimer la Couche",
      opacity: "Ajuster l'opacité",
      visibility: "Basculer la Visibilité",
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
    flexGroup: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "baseline",
      gap: 12,
    },
    flexGroupButton: {
      height: 38,
      minHeight: 38,
      width: 25,
      minWidth: 25,
      "& > div": {
        textAlign: "center",
      },
    },
    slider: {
      width: "100%",
      paddingLeft: 20,
      paddingRight: 20,
    },
  }));

  /**
   * Calls setLayerLegend for all layers
   */
  const setLayerLegendAll = async () => {
    for (const layer of Object.values(layers)) {
      if (layer.getLegendGraphic) {
        const dataUrl = await layer.getLegendGraphic();
        const name = layer.url.includes("/MapServer") ? layer.name : "";
        const legend = [{ name, dataUrl }];
        setLayerLegend((state) => ({ ...state, [layer.id]: legend }));
      } else if (layer.getLegendJson) {
        const legend = await layer.getLegendJson();
        const legendArray = Array.isArray(legend) ? legend : [legend];
        setLayerLegend((state) => ({ ...state, [layer.id]: legendArray }));
      }
    }
  };

  /**
   * Calls setLayerExtent for all layers
   */
  const setLayerBoundsAll = async () => {
    for (const layer of Object.values(layers)) {
      const bounds = await layer.getBounds();
      //   console.log(layer, bounds);
      setLayerBounds((state) => ({ ...state, [layer.id]: bounds }));
    }
  };

  useEffect(() => {
    const defaultLegends = Object.values(layers).reduce(
      (prev, curr) => ({ ...prev, [curr.id]: [] }),
      {}
    );
    setLayerLegend((state) => ({ ...defaultLegends, ...state }));
    setLayerLegendAll();

    const defaultBounds = Object.values(layers).reduce(
      (prev, curr) => ({ ...prev, [curr.id]: L.latLngBounds([]) }),
      {}
    );
    setLayerBounds((state) => ({ ...defaultBounds, ...state }));
    setLayerBoundsAll();

    const defaultSliders = Object.values(layers).reduce(
      (prev, curr) => ({ ...prev, [curr.id]: 100 }),
      {}
    );
    setLayerOpacity((state) => ({ ...defaultSliders, ...state }));

    const defaultVisibility = Object.values(layers).reduce(
      (prev, curr) => ({ ...prev, [curr.id]: true }),
      {}
    );
    setLayerVisibility((state) => ({ ...defaultVisibility, ...state }));
  }, [layers]);

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
   * Removes selcted layer from map
   *
   * @param layer layer config
   */
  const onZoom = (layer: TypeLayerData) =>
    api.map(mapId).fitBounds(layerBounds[layer.id]);

  /**
   * Returns polygon with segmented top and bottom to handle curved projection
   *
   * @param bounds layer bounds
   * @param segment layer bounds
   * @returns {L.Polygon} Polygon from bounds
   */
  const polygonFromBounds = (
    bounds: L.LatLngBounds,
    segments = 100
  ): L.Polygon => {
    const width = bounds.getEast() - bounds.getWest();
    const latlngs = [];
    latlngs.push(bounds.getSouthWest());
    for (let i = 1; i <= segments; i++) {
      const segmentWidth = width * (i / (segments + 1));
      const lng = bounds.getWest() + segmentWidth;
      latlngs.push({ lat: bounds.getSouth(), lng });
    }
    latlngs.push(bounds.getSouthEast());
    latlngs.push(bounds.getNorthEast());
    for (let i = 1; i <= segments; i++) {
      const segmentWidth = width * (i / (segments + 1));
      const lng = bounds.getEast() - segmentWidth;
      latlngs.push({ lat: bounds.getNorth(), lng });
    }
    latlngs.push(bounds.getNorthWest());
    return L.polygon(latlngs, { color: "red" });
  };

  /**
   * Adds bounding box to map
   *
   * @param layer layer config
   */
  const onBounds = (layer: TypeLayerData) => {
    const bbox = polygonFromBounds(layerBounds[layer.id]);
    const newBbox = JSON.stringify(bbox.toGeoJSON());
    const oldBbox = JSON.stringify(layerBbox.toGeoJSON());
    if (newBbox === oldBbox) {
      layerBbox.remove();
      setLayerBbox(L.polygon([]));
    } else {
      layerBbox.remove();
      bbox.addTo(api.map(mapId).map);
      setLayerBbox(bbox);
    }
  };

  /**
   * Removes selcted layer from map
   *
   * @param layer layer config
   */
  const onRemove = (layer: TypeLayerData) =>
    api.map(mapId).layer.removeLayer(layer);

  /**
   * Adjusts layer opacity when slider is moved
   *
   * @param value slider opacity value (0-100)
   * @param data Layer data
   */
  const onSliderChange = (value: number, data: TypeLayerData) => {
    setLayerOpacity((state) => ({ ...state, [data.id]: value }));
    const opacity = layerVisibility[data.id] ? value / 100 : 0;
    data.setOpacity(opacity);
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
    data.setOpacity(opacity);
  };

  return (
    <div className={classes.layersContainer}>
      {Object.values(layers).map((layer) => (
        <div key={layer.id}>
          <button
            type="button"
            className={classes.layerItem}
            onClick={() => onClick(layer.id)}
          >
            <div className={classes.layerCountTextContainer}>
              <div className={classes.layerItemText} title={layer.name}>
                {layer.name}
              </div>
            </div>
          </button>
          {selectedLayer === layer.id && (
            <>
              <div className={classes.flexGroup}>
                <Button
                  className={classes.flexGroupButton}
                  tooltip={translations[language].zoom}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">zoom_in</i>'
                  onClick={() => onZoom(layer)}
                />
                <Button
                  className={classes.flexGroupButton}
                  tooltip={translations[language].bounds}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">crop_free</i>'
                  onClick={() => onBounds(layer)}
                />
                <Button
                  className={classes.flexGroupButton}
                  tooltip={translations[language].remove}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">remove</i>'
                  onClick={() => onRemove(layer)}
                />
              </div>
              <div className={classes.flexGroup}>
                <Tooltip title={translations[language].opacity}>
                  <i className="material-icons">contrast</i>
                </Tooltip>
                <div className={classes.slider}>
                  <Slider
                    size="small"
                    value={layerOpacity[layer.id]}
                    valueLabelDisplay="auto"
                    onChange={(e) => onSliderChange(e.target.value, layer)}
                  />
                </div>
                <Tooltip title={translations[language].visibility}>
                  <Checkbox
                    checked={layerVisibility[layer.id]}
                    onChange={(e) => onCheckboxChange(e.target.checked, layer)}
                  />
                </Tooltip>
              </div>
              {layerLegend[layer.id].map((layer, index: number) => (
                <div key={index} className={classes.layerItemGroup}>
                  {layer.legend && Object.values(layer.legend).length > 1 && (
                    <div
                      className={classes.layerItemText}
                      title={layer.layerName}
                    >
                      {layer.layerName}
                    </div>
                  )}
                  {layer.drawingInfo?.renderer.type === "simple" &&
                    layer.drawingInfo?.renderer.symbol.imageData && (
                      <div className={classes.layerItemText}>
                        <img
                          src={`data:${layer.drawingInfo?.renderer.symbol.contentType};base64,${layer.drawingInfo?.renderer.symbol.imageData}`}
                        />
                        {layer.drawingInfo?.renderer.label || layer.name}
                      </div>
                    )}
                  {layer.drawingInfo?.renderer.type === "uniqueValue" &&
                    layer.drawingInfo?.renderer.uniqueValueInfos[0].symbol
                      .imageData &&
                    layer.drawingInfo?.renderer.uniqueValueInfos.map(
                      (uniqueValue, index) => (
                        <div key={index} className={classes.layerItemText}>
                          <img
                            src={`data:${uniqueValue.symbol.contentType};base64,${uniqueValue.symbol.imageData}`}
                          />
                          {uniqueValue.label}
                        </div>
                      )
                    )}
                  {layer.legend &&
                    layer.legend.map((uniqueValue, index) => (
                      <div key={index} className={classes.layerItemText}>
                        <img
                          src={`data:${uniqueValue.contentType};base64,${uniqueValue.imageData}`}
                        />
                        {uniqueValue.label || layer.layerName}
                      </div>
                    ))}
                  {layer.dataUrl && (
                    <div className={classes.layerItemText}>
                      <img src={layer.dataUrl} />
                      {layer.name}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default LayersList;

/* eslint-disable react/no-array-index-key */
import {
  TypeJsonValue,
  TypeJsonArray,
  toJsonObject,
  TypeJsonObject,
  AbstractGeoViewLayer,
  TypeWindow,
  geoviewLayerIsWMS,
  geoviewLayerIsEsriDynamic,
  geoviewLayerIsEsriFeature,
  getLocalizedValue,
} from 'geoview-core';

/**
 * interface for the layers list properties in layers panel
 */
type TypeLayersPanelListProps = {
  mapId: string;
  layers: Record<string, AbstractGeoViewLayer>;
  displayLanguage: string;
};

type TypeLegend =
  | TypeJsonValue[]
  | {
      name: string;
      dataUrl: string[] | string | ArrayBuffer | null;
    }[];

type TypeSubLayerVisibility = { [subLayerId: string]: number[] };

const w = window as TypeWindow;

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersPanelListProps} props properties passed to the component
 * @returns {JSX.Element} a React JSX Element containing map server layers
 */
function LayersList(props: TypeLayersPanelListProps): JSX.Element {
  const { mapId, layers, displayLanguage } = props;

  const { cgpv } = w;
  const { ui, react, api } = cgpv;
  const { useState, useEffect } = react;

  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [layerLegend, setLayerLegend] = useState<{ [legendId: string]: TypeLegend }>({});
  const [layerBounds, setLayerBounds] = useState<Record<string, number[]>>({});
  const [layerBbox, setLayerBbox] = useState<number[][]>([]);
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({});
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [subLayerVisibility, setSubLayerVisibility] = useState<TypeSubLayerVisibility>({});

  const { Button, Slider, Tooltip, Checkbox } = ui.elements;

  const translations: TypeJsonObject = toJsonObject({
    en: {
      bounds: 'Toggle Bounds',
      zoom: 'Zoom to Layer',
      remove: 'Remove Layer',
      opacity: 'Adjust Opacity',
      visibility: 'Toggle Visibility',
    },
    fr: {
      bounds: 'Basculer la limite',
      zoom: 'Zoom sur la Couche',
      remove: 'Supprimer la Couche',
      opacity: "Ajuster l'opacité",
      visibility: 'Basculer la Visibilité',
    },
  });

  const useStyles = ui.makeStyles(() => ({
    layersContainer: {
      overflow: 'hidden',
      overflowY: 'auto',
      width: '100%',
    },
    layerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '5px 0',
      padding: '10px 5px',
      boxSizing: 'content-box',
      '&:hover': {
        cursor: 'pointer',
        backgroundColor: '#c9c9c9',
      },
      zIndex: 1000,
      border: 'none',
      width: '100%',
    },
    layerParentText: {
      fontSize: '16px',
      fontWeight: 'bold',
    },
    layerCountTextContainer: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      height: '32px',
    },
    layerItemText: {
      fontSize: '14px',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      marginLeft: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    flexGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'baseline',
      gap: 12,
    },
    flexGroupButton: {
      height: 38,
      minHeight: 38,
      width: 25,
      minWidth: 25,
      '& > div': {
        textAlign: 'center',
      },
    },
    slider: {
      width: '100%',
      paddingLeft: 20,
      paddingRight: 20,
    },
    legendSubLayerGroup: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  }));

  /**
   * Calls setLayerLegend for all layers
   */
  const setLayerLegendAll = () =>
    Object.values(layers).forEach(async (layer) => {
      if (geoviewLayerIsWMS(layer)) {
        const dataUrl = await layer.getLegendGraphic();
        const name = getLocalizedValue(layer.metadataAccessPath, layer.mapId)!.includes('/MapServer') ? layer.geoviewLayerName : '';
        const legend = [{ name, dataUrl }];
        setLayerLegend((state) => ({ ...state, [layer.geoviewLayerId]: legend }));
      } else if (geoviewLayerIsEsriDynamic(layer) || geoviewLayerIsEsriFeature(layer)) {
        const legend = await layer.getLegendJson();
        const legendArray = Array.isArray(legend) ? legend : [legend];
        setLayerLegend((state) => ({ ...state, [layer.geoviewLayerId]: legendArray }));
      }
    });

  /**
   * Calls setLayerExtent for all layers
   */
  const setLayerBoundsAll = async () => {
    for (let layerIndex = 0; layerIndex < Object.keys(layers).length; layerIndex++) {
      const layerKey = Object.keys(layers)[layerIndex];
      const layerValue = layers[layerKey];

      // eslint-disable-next-line no-await-in-loop
      const bounds = await layerValue.getBounds();
      setLayerBounds((state) => ({ ...state, [layerValue.geoviewLayerId]: bounds }));
    }
  };

  useEffect(() => {
    const defaultLegends = Object.values(layers).reduce((prev, curr) => ({ ...prev, [curr.geoviewLayerId]: [] }), {});
    setLayerLegend((state) => ({ ...defaultLegends, ...state }));
    setLayerLegendAll();

    const defaultBounds = Object.values(layers).reduce((prev, curr) => ({ ...prev, [curr.geoviewLayerId]: [] }), {});
    setLayerBounds((state) => ({ ...defaultBounds, ...state }));
    setLayerBoundsAll();

    const defaultSliders = Object.values(layers).reduce((prev, curr) => ({ ...prev, [curr.geoviewLayerId]: 100 }), {});
    setLayerOpacity((state) => ({ ...defaultSliders, ...state }));

    const defaultVisibility = Object.values(layers).reduce((prev, curr) => ({ ...prev, [curr.geoviewLayerId]: true }), {});
    setLayerVisibility((state) => ({ ...defaultVisibility, ...state }));

    const defaultSubVisibility = Object.values(layers).reduce((prev, curr) => ({ ...prev, [curr.geoviewLayerId]: curr.entries }), {});
    setSubLayerVisibility((state) => ({ ...defaultSubVisibility, ...state }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  const classes = useStyles();

  /**
   * Sets the currently selected layer,
   * sets to blank if value is same as currently selecetd layer
   *
   * @param value layer button value
   */
  const onClick = (value: string) => {
    const selected = value !== selectedLayer ? value : '';
    setSelectedLayer(selected);
  };

  /**
   * Removes selcted layer from map
   *
   * @param layer layer config
   */
  const onZoom = (layer: AbstractGeoViewLayer) => api.map(mapId).fitBounds(layerBounds[layer.geoviewLayerId]);

  /**
   * Returns polygon with segmented top and bottom to handle curved projection
   *
   * @param {number[]} bounds layer bounds
   * @param {number} segments layer bounds
   * @returns {number[][]} the bounding box coordinates
   */
  const polygonFromBounds = (bounds: number[], segments = 100): number[][] => {
    // store longitude and latitude of each point of polygon
    const lnglats: number[][] = [];

    if (bounds && bounds.length > 0) {
      const west = bounds[0];
      const south = bounds[1];
      const east = bounds[2];
      const north = bounds[3];

      const southEast = [east, south];
      const southWest = [west, south];
      const northEast = [east, north];
      const northWest = [west, north];

      const width = east - west;

      lnglats.push(southWest);
      for (let i = 1; i <= segments; i += 1) {
        const segmentWidth = width * (i / (segments + 1));
        const lat = west + segmentWidth;
        lnglats.push([lat, south]);
      }
      lnglats.push(southEast);
      lnglats.push(northEast);
      for (let i = 1; i <= segments; i += 1) {
        const segmentWidth = width * (i / (segments + 1));
        const lat = east - segmentWidth;
        lnglats.push([lat, north]);
      }
      lnglats.push(northWest);
    }

    return lnglats;
  };

  /**
   * Adds bounding box to map
   *
   * @param layer layer config
   */
  const onBounds = (layer: AbstractGeoViewLayer) => {
    const bbox = polygonFromBounds(layerBounds[layer.geoviewLayerId]);

    if (layerBbox.toString() === bbox.toString()) {
      api.map(mapId).layer.vector?.deleteGeometry('layerBoundingBox');
      setLayerBbox([]);
    } else {
      api.map(mapId).layer.vector?.deleteGeometry('layerBoundingBox');
      api.map(mapId).layer.vector?.addPolygon(
        [bbox],
        {
          style: {
            strokeColor: 'red',
            fillColor: 'red',
            fillOpacity: 0.2,
          },
        },
        'layerBoundingBox'
      );
      setLayerBbox(bbox);
    }
  };

  /**
   * Removes selcted layer from map, also removing bbox if active
   *
   * @param layer layer config
   */
  const onRemove = (layer: AbstractGeoViewLayer) => {
    // empty bounding box
    setLayerBbox([]);
    // remove bounding box layer from map
    api.map(mapId).layer.vector?.deleteGeometry('layerBoundingBox');
    // remove layer from map
    api.map(mapId).layer.removeGeoviewLayer(layer);
  };

  /**
   * Adjusts layer opacity when slider is moved
   *
   * @param value slider opacity value (0-100)
   * @param data Layer data
   */
  const onSliderChange = (value: number, data: AbstractGeoViewLayer) => {
    setLayerOpacity((state) => ({ ...state, [data.geoviewLayerId]: value }));
    const opacity = layerVisibility[data.geoviewLayerId] ? value / 100 : 0;
    data.setOpacity(opacity);
  };

  /**
   * Adjusts layer visibility when checkbox is toggled
   *
   * @param value checkbox boolean
   * @param data Layer data
   */
  const onVisibilityChange = (value: boolean, data: AbstractGeoViewLayer) => {
    setLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: value }));
    const opacity = value ? layerOpacity[data.geoviewLayerId] / 100 : 0;
    data.setOpacity(opacity);
    if (value && data.setEntries) {
      setSubLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: data.entries as number[] }));
      data.setEntries(data.entries as number[]);
    }
    if (!value && data.setEntries) {
      setSubLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: [] }));
      data.setEntries([]);
    }
  };

  /**
   * Adjusts sublayer visibility when checkbox is toggled
   *
   * @param value checkbox boolean
   * @param data Layer data
   * @param id sublayer ID
   */
  const onSubVisibilityChange = (value: boolean, data: AbstractGeoViewLayer, id: number) => {
    const oldEntries = subLayerVisibility[data.geoviewLayerId];
    const entries = value ? [...new Set([...oldEntries, id])] : oldEntries.filter((x) => x !== id);
    if (oldEntries.length === 0) {
      setLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: true }));
      data.setOpacity(layerOpacity[data.geoviewLayerId] / 100);
    }
    if (entries.length === 0) {
      setLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: false }));
      data.setOpacity(0);
    }
    setSubLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: entries }));
    if (data.setEntries) data.setEntries(entries);
  };

  return (
    <div className={classes.layersContainer}>
      {Object.values(layers).map((layer) => (
        <div key={layer.geoviewLayerId}>
          <button type="button" className={classes.layerItem} onClick={() => onClick(layer.geoviewLayerId)}>
            <div className={classes.layerCountTextContainer}>
              <div className={classes.layerItemText} title={layer.geoviewLayerName}>
                {layer.geoviewLayerName}
              </div>
            </div>
          </button>
          {selectedLayer === layer.geoviewLayerId && (
            <>
              <div className={classes.flexGroup}>
                <Button
                  className={classes.flexGroupButton}
                  tooltip={translations[displayLanguage].zoom as string}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">zoom_in</i>'
                  onClick={() => onZoom(layer)}
                />
                <Button
                  className={classes.flexGroupButton}
                  tooltip={translations[displayLanguage].bounds as string}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">crop_free</i>'
                  onClick={() => onBounds(layer)}
                />
                <Button
                  className={classes.flexGroupButton}
                  tooltip={translations[displayLanguage].remove as string}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">remove</i>'
                  onClick={() => onRemove(layer)}
                />
              </div>
              <div className={classes.flexGroup}>
                <Tooltip title={translations[displayLanguage].opacity}>
                  <i className="material-icons">contrast</i>
                </Tooltip>
                <div className={classes.slider}>
                  <Slider
                    id={api.generateId()}
                    min={0}
                    max={100}
                    size="small"
                    value={layerOpacity[layer.geoviewLayerId]}
                    valueLabelDisplay="auto"
                    customOnChange={(value) => onSliderChange(value as number, layer)}
                  />
                </div>
                <Tooltip title={translations[displayLanguage].visibility}>
                  <Checkbox checked={layerVisibility[layer.geoviewLayerId]} onChange={(e) => onVisibilityChange(e.target.checked, layer)} />
                </Tooltip>
              </div>
              {(layerLegend[layer.geoviewLayerId] as TypeJsonArray).map((subLayer, index: number) => (
                <div key={index}>
                  {subLayer!.legend && (
                    <div className={classes.legendSubLayerGroup}>
                      <div className={classes.layerItemText} title={subLayer.layerName as string}>
                        {subLayer.layerName}
                      </div>
                      <Tooltip title={translations[displayLanguage].visibility}>
                        <Checkbox
                          checked={subLayerVisibility[layer.geoviewLayerId].includes(subLayer.layerId as number)}
                          onChange={(e) => onSubVisibilityChange(e.target.checked, layer, subLayer.layerId as number)}
                        />
                      </Tooltip>
                    </div>
                  )}
                  {(subLayer.drawingInfo?.renderer.type as string) === 'simple' && subLayer.drawingInfo?.renderer.symbol.imageData && (
                    <div className={classes.layerItemText}>
                      <img
                        alt="Layer Legend"
                        src={`data:${subLayer.drawingInfo?.renderer.symbol.contentType};base64,${subLayer.drawingInfo?.renderer.symbol.imageData}`}
                      />
                      {subLayer.drawingInfo?.renderer.label || subLayer.name}
                    </div>
                  )}
                  {subLayer.drawingInfo?.renderer.type === 'uniqueValue' &&
                    subLayer.drawingInfo.renderer.uniqueValueInfos[0].symbol.imageData &&
                    (subLayer.drawingInfo.renderer.uniqueValueInfos as TypeJsonArray).map((uniqueValue, i: number) => (
                      <div key={i} className={classes.layerItemText}>
                        <img alt="Layer Legend" src={`data:${uniqueValue.symbol.contentType};base64,${uniqueValue.symbol.imageData}`} />
                        {uniqueValue.label}
                      </div>
                    ))}
                  {subLayer.legend &&
                    (subLayer.legend as TypeJsonArray).map((uniqueValue, i: number) => (
                      <div key={i} className={classes.layerItemText}>
                        <img alt="Layer Legend" src={`data:${uniqueValue.contentType};base64,${uniqueValue.imageData}`} />
                        {uniqueValue.label || subLayer.layerName}
                      </div>
                    ))}
                  {subLayer.dataUrl && (
                    <div className={classes.layerItemText}>
                      <img alt="Layer Legend" src={subLayer.dataUrl as string} />
                      {subLayer.name}
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
}

export default LayersList;

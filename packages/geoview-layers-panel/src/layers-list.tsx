import {
  TypeJsonValue,
  TypeJsonArray,
  toJsonObject,
  TypeJsonObject,
  AbstractGeoViewLayer,
  geoviewLayerIsWMS,
  geoviewLayerIsEsriDynamic,
  geoviewLayerIsEsriFeature,
  getLocalizedValue,
} from 'geoview-core';

import { sxClasses } from './layers-list.style';

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

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersPanelListProps} props properties passed to the component
 * @returns {JSX.Element} a React JSX Element containing map server layers
 */
function LayersList(props: TypeLayersPanelListProps): JSX.Element {
  const { mapId, layers, displayLanguage } = props;

  const { cgpv } = window;
  const { ui, api, react } = cgpv;
  const { useState, useEffect } = react;

  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [layerLegend, setLayerLegend] = useState<{ [legendId: string]: TypeLegend }>({});
  const [layerBounds, setLayerBounds] = useState<Record<string, number[]>>({});
  const [layerBbox, setLayerBbox] = useState<number[][]>([]);
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({});
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [subLayerVisibility, setSubLayerVisibility] = useState<TypeSubLayerVisibility>({});

  const { Button, Slider, Tooltip, Checkbox, Box } = ui.elements;

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
      const bounds = await layerValue.getMetadataBounds()!;
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
   * Removes selected layer from map
   *
   * @param layer layer config
   */
  const onZoom = (layer: AbstractGeoViewLayer) => api.maps[mapId].fitBounds(layerBounds[layer.geoviewLayerId]);

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
      api.maps[mapId].layer.vector?.deleteGeometry('layerBoundingBox');
      setLayerBbox([]);
    } else {
      api.maps[mapId].layer.vector?.deleteGeometry('layerBoundingBox');
      api.maps[mapId].layer.vector?.addPolygon(
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
    api.maps[mapId].layer.vector?.deleteGeometry('layerBoundingBox');
    // remove layer from map
    api.maps[mapId].layer.removeGeoviewLayer(layer);
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
    data.setOpacity(opacity); // ! needs a layerPath
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
    data.setOpacity(opacity); // ! needs a layerPath
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
      data.setOpacity(layerOpacity[data.geoviewLayerId] / 100); // ! needs a layerPath
    }
    if (entries.length === 0) {
      setLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: false }));
      data.setOpacity(0); // ! needs a layerPath
    }
    setSubLayerVisibility((state) => ({ ...state, [data.geoviewLayerId]: entries }));
    if (data.setEntries) data.setEntries(entries);
  };

  return (
    <Box sx={sxClasses.layersContainer}>
      {Object.values(layers).map((layer) => (
        <Box key={layer.geoviewLayerId}>
          <Button type="text" sx={sxClasses.layerItem} onClick={() => onClick(layer.geoviewLayerId)} disableRipple>
            <Box sx={sxClasses.layerCountTextContainer}>
              <Box sx={sxClasses.layerItemText} title={layer.geoviewLayerName}>
                {layer.geoviewLayerName}
              </Box>
            </Box>
          </Button>
          {selectedLayer === layer.geoviewLayerId && (
            <>
              <Box sx={sxClasses.flexGroup}>
                <Button
                  sx={sxClasses.flexGroupButton}
                  tooltip={translations[displayLanguage].zoom as string}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">zoom_in</i>'
                  onClick={() => onZoom(layer)}
                />
                <Button
                  sx={sxClasses.flexGroupButton}
                  tooltip={translations[displayLanguage].bounds as string}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">crop_free</i>'
                  onClick={() => onBounds(layer)}
                />
                <Button
                  sx={sxClasses.flexGroupButton}
                  tooltip={translations[displayLanguage].remove as string}
                  tooltipPlacement="top"
                  variant="contained"
                  type="icon"
                  icon='<i class="material-icons">remove</i>'
                  onClick={() => onRemove(layer)}
                />
              </Box>
              <Box sx={sxClasses.flexGroup}>
                <Tooltip title={translations[displayLanguage].opacity as string}>
                  <i className="material-icons">contrast</i>
                </Tooltip>
                <Box sx={sxClasses.slider}>
                  <Slider
                    sliderId={api.generateId()}
                    min={0}
                    max={100}
                    size="small"
                    value={layerOpacity[layer.geoviewLayerId]}
                    valueLabelDisplay="auto"
                    customOnChange={(value) => onSliderChange(value as number, layer)}
                  />
                </Box>
                <Tooltip title={translations[displayLanguage].visibility as string}>
                  <Checkbox checked={layerVisibility[layer.geoviewLayerId]} onChange={(e) => onVisibilityChange(e.target.checked, layer)} />
                </Tooltip>
              </Box>
              {(layerLegend[layer.geoviewLayerId] as TypeJsonArray).map((subLayer, index: number) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box key={index}>
                  {subLayer!.legend && (
                    <Box sx={sxClasses.legendSubLayerGroup}>
                      <Box sx={sxClasses.layerItemText} title={subLayer.layerName as string}>
                        {subLayer.layerName as string}
                      </Box>
                      <Tooltip title={translations[displayLanguage].visibility as string}>
                        <Checkbox
                          checked={subLayerVisibility[layer.geoviewLayerId].includes(subLayer.layerId as number)}
                          onChange={(e) => onSubVisibilityChange(e.target.checked, layer, subLayer.layerId as number)}
                        />
                      </Tooltip>
                    </Box>
                  )}
                  {(subLayer.drawingInfo?.renderer.type as string) === 'simple' && subLayer.drawingInfo?.renderer.symbol.imageData && (
                    <Box sx={sxClasses.layerItemText}>
                      <img
                        alt="Layer Legend"
                        src={`data:${subLayer.drawingInfo?.renderer.symbol.contentType};base64,${subLayer.drawingInfo?.renderer.symbol.imageData}`}
                      />
                      {(subLayer.drawingInfo?.renderer.label || subLayer.name) as string}
                    </Box>
                  )}
                  {subLayer.drawingInfo?.renderer.type === 'uniqueValue' &&
                    subLayer.drawingInfo.renderer.uniqueValueInfos[0].symbol.imageData &&
                    (subLayer.drawingInfo.renderer.uniqueValueInfos as TypeJsonArray).map((uniqueValue, i: number) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <Box key={i} sx={sxClasses.layerItemText}>
                        <img alt="Layer Legend" src={`data:${uniqueValue.symbol.contentType};base64,${uniqueValue.symbol.imageData}`} />
                        {uniqueValue.label as string}
                      </Box>
                    ))}
                  {subLayer.legend &&
                    (subLayer.legend as TypeJsonArray).map((uniqueValue, i: number) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <Box key={i} sx={sxClasses.layerItemText}>
                        <img alt="Layer Legend" src={`data:${uniqueValue.contentType};base64,${uniqueValue.imageData}`} />
                        {(uniqueValue.label || subLayer.layerName) as string}
                      </Box>
                    ))}
                  {subLayer.dataUrl && (
                    <Box sx={sxClasses.layerItemText}>
                      <img alt="Layer Legend" src={subLayer.dataUrl as string} />
                      {subLayer.name as string}
                    </Box>
                  )}
                </Box>
              ))}
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default LayersList;

import {
  TypeJSONObject,
  TypeFieldNameAlias,
  TypeJSONValue,
  TypeLayerData,
  TypeLayerInfo,
  TypeApi,
} from "geoview-core";

/**
 * Fetch the json response from the map server
 *
 * @param {string} url the url of the map server
 * @returns {Promise<TypeLayerInfo>} a json containing the result of the query
 */
const queryServer = async (url: string): Promise<TypeLayerInfo> => {
  const response = await fetch(`${url}?f=json`);
  const result = await response.json();
  return result;
};

/**
 * Get all aliases from the defined layer list, will be used when displaying entry / feature info
 *
 * @param {TypeFieldNameAlias[]} fields a list of the fields defined in the layer
 * @returns {TypeJSONObject} an object containing field name and it's alias
 */
const getFieldAliases = (fields: TypeFieldNameAlias[]) => {
  const fieldAliases: TypeJSONObject = {};
  if (fields) {
    fields.forEach((field: { name: string; alias: string }) => {
      const { name, alias } = field;
      fieldAliases[name] = alias;
    });
  }
  return fieldAliases;
};

/**
 * Converts URL to Base64 dataURL
 *
 * @param url URL
 * @returns {Promise<string>}
 */
const toDataURL = (url: string): Promise<string> =>
  fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

/**
 * Adds a single layer to it's parent setState function
 *
 * @param setState React setState function
 * @param layerData layer configuration information
 * @param layerInfo additional layer metadata fetched from URL
 * @param isGroupLayer flag to specify if ESRI Dynamic layer is a group
 */
const addLayer = (
  setState: Function,
  layerData: TypeLayerData,
  layerInfo: TypeLayerInfo,
  isGroupLayer: boolean
) => {
  const { layers } = layerData;
  layers[
    `${layerInfo.id}-${layerInfo.name.replace(/\s+/g, "-").toLowerCase()}`
  ] = {
    layer: layerInfo,
    groupLayer: isGroupLayer,
    layerData: [] as TypeJSONValue[],
    displayField: layerInfo.displayField || layerInfo.displayFieldName || "",
    fieldAliases: getFieldAliases(layerInfo.fields),
    renderer: layerInfo.drawingInfo && layerInfo.drawingInfo.renderer,
  };
  layerData.layers = layers;
  setState((state: Record<string, TypeLayerData>) => {
    return {
      ...state,
      [layerData.id]: layerData,
    };
  });
};

/**
 * Fetches metadata for layer based on type
 *
 * @param mapLayer layer configuration information
 * @param setState React setState function
 */
const addMapLayer = async (mapLayer: any, setState: Function) => {
  const layerData = {
    id: mapLayer.id,
    name: mapLayer.name,
    type: mapLayer.type,
    layer: mapLayer.layer || {},
    layers: {},
  };
  if (
    mapLayer.type === "ogcWMS" &&
    !mapLayer.mapService.options.url.includes("/MapServer")
  ) {
    const legendImageUrl = `${mapLayer.url}request=GetLegendGraphic&version=1.1.1&Service=WMS&format=image/png&layer=${mapLayer.entries}`;
    const layerInfo = {
      name: mapLayer.name,
      drawingInfo: {
        renderer: {
          type: "simple",
          label: " ",
          symbol: {
            imageData: await toDataURL(legendImageUrl),
            contentType: "image/png",
            legendImageUrl,
          },
        },
      },
    };
    addLayer(setState, layerData, layerInfo, false);
  } else if (
    mapLayer.type === "ogcWMS" &&
    mapLayer.mapService.options.url.includes("/MapServer")
  ) {
    for (const layerId of mapLayer.entries) {
      const layerInfo = await queryServer(
        mapLayer.mapService.options.url + layerId
      );
      const legendImageUrl = `${mapLayer.url}?request=GetLegendGraphic&version=1.1.1&Service=WMS&format=image/png&layer=${layerId}`;
      if (layerInfo.drawingInfo?.renderer?.symbol) {
        Object.defineProperties(layerInfo.drawingInfo.renderer.symbol, {
          legendImageUrl: {
            value: legendImageUrl,
          },
        });
      }
      addLayer(setState, layerData, layerInfo, false);
    }
  } else if (mapLayer.type === "esriFeature") {
    const layerInfo = await queryServer(mapLayer.layer.options.url);
    addLayer(setState, layerData, layerInfo, false);
  } else if (mapLayer.type === "esriDynamic") {
    const layerIds = mapLayer.layer.getLayers();
    mapLayer.layer.metadata(
      async (
        error: any,
        res: { layers: { id: string; subLayerIds: string[] }[] }
      ) => {
        if (error) return;
        if (res.layers) {
          for (const subLayerData of res.layers) {
            if (layerIds.includes(subLayerData.id)) {
              const layerInfo = await queryServer(
                mapLayer.layer.options.url + subLayerData.id
              );
              addLayer(
                setState,
                layerData,
                layerInfo,
                subLayerData.subLayerIds !== null &&
                  subLayerData.subLayerIds !== undefined
              );
              if (subLayerData.subLayerIds) {
                for (let j = 0; j < subLayerData.subLayerIds.length; j++) {
                  const subLayer = subLayerData.subLayerIds[j];
                  const subLayerInfo = await queryServer(
                    mapLayer.layer.options.url + subLayer
                  );
                  addLayer(setState, layerData, subLayerInfo, false);
                }
              }
            }
          }
        }
      }
    );
  } else if (["geoJSON", "xyzTiles"].includes(mapLayer.type)) {
    addLayer(setState, layerData, mapLayer, false);
  }
};

/**
 * Adds all layers to state, unless optional layer parameter is passed,
 * in which case only that layer is updated.
 *
 * @param setState React setState function
 * @param api GeoView core api functions
 * @param mapId string of current map ID
 * @param layer layer configuration information
 */
const getLayerInfo = (
  setState: Function,
  api: TypeApi,
  mapId: string,
  layer = { id: null }
) => {
  const mapLayers = api.map(mapId).layer.layers;
  if (layer.id) addMapLayer(mapLayers[layer.id], setState);
  else
    Object.values(mapLayers).forEach((mapLayer) =>
      addMapLayer(mapLayer, setState)
    );
};

export default getLayerInfo;

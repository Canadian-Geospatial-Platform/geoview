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
 * Add a layer to the panel layer list
 * @param {TypeLayerData} mapLayer the main object that contains added layers from the api
 * @param {Record<string, TypeLayerData>} data the data object that contains all layers
 * @param {TypeLayerInfo} layerInfo the layer information
 * @param {boolean} isGroupLayer a boolean value to check if this layer is a group layer
 */
const addLayer = (
  setState: Function,
  mapLayer: TypeLayerData,
  data: Record<string, TypeLayerData>,
  layerInfo: TypeLayerInfo,
  isGroupLayer: boolean
) => {
  const { layers } = data[mapLayer.id];
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
  data[mapLayer.id].layers = layers;
  setState((state: Record<string, TypeLayerData>) => ({ ...state, ...data }));
};

const getLayers = (setState: Function, api: TypeApi, mapId: string) => {
  const mapLayers = api.map(mapId).layer.layers;
  const data: Record<string, TypeLayerData> = {};
  mapLayers.forEach(async (mapLayer: TypeLayerData) => {
    data[mapLayer.id] = {
      id: mapLayer.id,
      type: mapLayer.type,
      layer: mapLayer.layer,
      layers: {},
    };
    if (mapLayer.type === "ogcWMS") {
      const { entries } = mapLayer.layer;
      for (let i = 0; i < entries.length; i++) {
        const layerId = entries[i];
        const layerInfo = await queryServer(
          mapLayer.layer.mapService.options.url + layerId
        );
        const legendImageUrl = `${mapLayer.layer._url}?request=GetLegendGraphic&version=1.0.0&Service=WMS&format=image/png&layer=${layerId}`;
        if (
          layerInfo.drawingInfo &&
          layerInfo.drawingInfo.renderer &&
          layerInfo.drawingInfo.renderer.symbol
        ) {
          Object.defineProperties(layerInfo.drawingInfo.renderer.symbol, {
            legendImageUrl: {
              value: legendImageUrl,
            },
          });
        }
        addLayer(setState, mapLayer, data, layerInfo, false);
      }
    } else if (mapLayer.type === "esriFeature") {
      const layerInfo = await queryServer(mapLayer.layer.options.url);
      addLayer(setState, mapLayer, data, layerInfo, false);
    } else if (mapLayer.type === "esriDynamic") {
      const entries = mapLayer.layer.getLayers();
      const activeLayers: Record<number, number> = {};
      entries.forEach((entry: number) => {
        activeLayers[entry] = entry;
      });
      mapLayer.layer.metadata(
        async (
          error: any,
          res: { layers: { id: string; subLayerIds: string[] }[] }
        ) => {
          if (error) return;
          if (res.layers) {
            for (let i = 0; i < res.layers.length; i++) {
              const layerData = res.layers[i];
              if (layerData.id in activeLayers) {
                const layerInfo = await queryServer(
                  mapLayer.layer.options.url + layerData.id
                );
                addLayer(
                  setState,
                  mapLayer,
                  data,
                  layerInfo,
                  layerData.subLayerIds !== null &&
                    layerData.subLayerIds !== undefined
                );
                if (layerData.subLayerIds) {
                  for (let j = 0; j < layerData.subLayerIds.length; j++) {
                    const subLayer = layerData.subLayerIds[j];
                    const subLayerInfo = await queryServer(
                      mapLayer.layer.options.url + subLayer
                    );
                    addLayer(setState, mapLayer, data, subLayerInfo, false);
                  }
                }
              }
            }
          }
        }
      );
    }
  });
};

export default getLayers;

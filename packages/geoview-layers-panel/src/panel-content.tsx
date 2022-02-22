import LayersList from "./layers-list";

// get the window object
const w = window as any;

import {
  TypeJSONObject,
  TypeJSONValue,
  TypeLayerData,
  TypeLayerInfo,
  TypeFieldNameAlias,
  TypePanelContentProps,
} from "geoview-core";

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns A React JSX Element with the details panel
 */
const PanelContent = (props: TypePanelContentProps): JSX.Element => {
  const { mapId } = props;

  // access the cgpv object from the window object
  const cgpv = w["cgpv"];

  // access the api calls
  const { api, react, ui } = cgpv;

  const { useState, useEffect } = react;

  const [layersData, setLayersData] = useState({});

  // use material ui theming
  const useStyles = ui.makeStyles(() => ({
    mainContainer: {
      display: "flex",
      flexDirection: "row",
    },
  }));

  const classes = useStyles();

  /**
   * Fetch the json response from the map server
   *
   * @param {string} url the url of the map server
   * @returns {Promise<TypeLayerInfo>} a json containing the result of the query
   */
  const queryServer = async (url: string): Promise<TypeLayerInfo> => {
    // fetch the map server returning a json object
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
   * Add a layer to the panel layer list
   *
   * @param {TypeLayerData} mapLayer the main object that contains added layers from the api
   * @param {Record<string, TypeLayerData>} data the data object that contains all layers
   * @param {TypeLayerInfo} layerInfo the layer information
   * @param {boolean} isGroupLayer a boolean value to check if this layer is a group layer
   */
  const addLayer = (
    mapLayer: TypeLayerData,
    data: Record<string, TypeLayerData>,
    layerInfo: TypeLayerInfo,
    isGroupLayer: boolean
  ) => {
    // get the layers object from the map, it begins with an empty object then adds each layer
    const { layers } = data[mapLayer.id];

    // add the layer to the layers object, the layer will have a key generated from the id and name of the layer seperated by dashes
    layers[
      `${layerInfo.id}-${layerInfo.name.replace(/\s+/g, "-").toLowerCase()}`
    ] = {
      // the information about this layer
      layer: layerInfo,
      // is it a group layer or not
      groupLayer: isGroupLayer,
      // the layer entry / feature data, will be filled / reset when a click / crosshair event is triggered on an element
      layerData: [] as TypeJSONValue[],
      // the default display field or field name defined in the layer
      displayField: layerInfo.displayField || layerInfo.displayFieldName || "",
      // the defined field aliases by the layer
      fieldAliases: getFieldAliases(layerInfo.fields),
      // the renderer object containing the symbology
      renderer: layerInfo.drawingInfo && layerInfo.drawingInfo.renderer,
    };

    // save the layers back to the data object on the specified map server layer
    data[mapLayer.id].layers = layers;
    setLayersData((state: any) => ({ ...state, ...data }));
  };

  useEffect(() => {
    // get the map service layers from the API
    const mapLayers = api.map(mapId).layer.layers;

    // will be used to store the added map server layers, layers in the map server etc...
    const data: Record<string, TypeLayerData> = {};

    // loop through each map server layer loaded from the map config and created using the API
    mapLayers.forEach(async (mapLayer: TypeLayerData) => {
      data[mapLayer.id] = {
        // the map server layer id
        id: mapLayer.id,
        // the type of the map server layer (WMS, Dynamic, Feature)
        type: mapLayer.type,
        // the layer class
        layer: mapLayer.layer,
        // an object that will contains added layers from the map server layer
        layers: {},
      };

      // check each map server layer type and add it to the layers object of the map server in the data array
      if (mapLayer.type === "ogcWMS") {
        // get layer ids / entries from the loaded WMS layer
        const { entries } = mapLayer.layer;

        for (let i = 0; i < entries.length; i++) {
          const layerId = entries[i];

          // query the layer information
          const layerInfo = await queryServer(
            mapLayer.layer.mapService.options.url + layerId
          );

          // try to add the legend image url for the WMS layer
          const legendImageUrl = `${mapLayer.layer._url}?request=GetLegendGraphic&version=1.0.0&Service=WMS&format=image/png&layer=${layerId}`;

          // assign the url to the renderer
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

          addLayer(mapLayer, data, layerInfo, false);
        }
      } else if (mapLayer.type === "esriFeature") {
        // query the layer information, feature layer URL will end by a number provided in the map config
        const layerInfo = await queryServer(mapLayer.layer.options.url);

        addLayer(mapLayer, data, layerInfo, false);
      } else if (mapLayer.type === "esriDynamic") {
        // get active layers
        const entries = mapLayer.layer.getLayers();

        const activeLayers: Record<number, number> = {};

        // change active layers to keys so it can be compared with id in all layers
        entries.forEach((entry: number) => {
          activeLayers[entry] = entry;
        });

        // get the metadata of the dynamic layer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapLayer.layer.metadata(
          async (
            error: any,
            res: { layers: { id: string; subLayerIds: string[] }[] }
          ) => {
            if (error) return;

            if (res.layers) {
              // loop through each layer in the dynamic layer
              for (let i = 0; i < res.layers.length; i++) {
                const layerData = res.layers[i];

                // if the index of the layer is one of the entries provided in the map config
                if (layerData.id in activeLayers) {
                  // query the layer information from the map server by appending the index at the end of the URL
                  const layerInfo = await queryServer(
                    mapLayer.layer.options.url + layerData.id
                  );

                  addLayer(
                    mapLayer,
                    data,
                    layerInfo,
                    layerData.subLayerIds !== null &&
                      layerData.subLayerIds !== undefined
                  );

                  // if this layer is a group layer then loop through the sub layers and add them
                  if (layerData.subLayerIds) {
                    for (let j = 0; j < layerData.subLayerIds.length; j++) {
                      const subLayer = layerData.subLayerIds[j];

                      const subLayerInfo = await queryServer(
                        mapLayer.layer.options.url + subLayer
                      );

                      addLayer(mapLayer, data, subLayerInfo, false);
                    }
                  }
                }
              }
            }
          }
        );
      }
    });
  }, []);

  return (
    <div className={classes.mainContainer}>
      <LayersList layersData={layersData} />
    </div>
  );
};

export default PanelContent;

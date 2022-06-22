import {
  Cast,
  TypeJsonValue,
  TypeRendererSymbol,
  TypeSelectedFeature,
  AbstractWebLayersClass,
  TypeLayerInfo,
  TypeFieldNameAliasArray,
  TypeFieldAlias,
  TypeFoundLayers,
  TypeLayersEntry,
  TypeEntry,
  TypePanelContentProps,
  TypeWindow,
  toJsonObject,
  TypeJsonObject,
  TypeJsonArray,
  webLayerIsWMS,
  webLayerIsEsriDynamic,
  webLayerIsEsriFeature,
  WMS,
  EsriFeature,
  EsriDynamic,
  CONST_LAYER_TYPES,
  payloadBaseClass,
  payloadIsALngLat,
  markerDefinitionPayload,
} from 'geoview-core';

import LayersList from './layers-list';
import FeaturesList from './features-list';
import FeatureInfo from './feature-info';

// get the window object
const w = window as TypeWindow;

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns A React JSX Element with the details panel
 */
function PanelContent(props: TypePanelContentProps): JSX.Element {
  const { buttonPanel, mapId } = props;

  // access the cgpv object from the window object
  const { cgpv } = w;

  // access the api calls
  const { api, react, ui, useTranslation } = cgpv;

  // get event names
  const EVENT_NAMES = api.eventNames;

  const { useState, useCallback, useEffect } = react;

  const [layersData, setLayersData] = useState<Record<string, AbstractWebLayersClass>>({});
  const [selectedLayer, setSelectedLayer] = useState({});
  const [selectedFeature, setSelectedFeature] = useState({});

  const [layersList, setLayersList] = useState(false);
  const [featureList, setFeatureList] = useState(false);
  const [featureInfo, setFeatureInfo] = useState(false);

  const [clickPos, setClickPos] = useState<number[]>();

  // use material ui theming
  const useStyles = ui.makeStyles(() => ({
    mainContainer: {
      display: 'flex',
      flexDirection: 'row',
    },
  }));

  const classes = useStyles();

  const { t } = useTranslation();

  // get the map instance
  const mapInstance = api.map(mapId).map;

  /**
   * Get the symbology from the layer
   *
   * @param {TypeRendererSymbol} renderer the display renderer containing the symbol
   * @param {TypeJsonObject} attributes the attributes of the selected layer features
   *
   * @returns {TypeJsonObject} the symbology containing the imageData
   */
  const getSymbol = useCallback((renderer: TypeRendererSymbol, attributes: TypeJsonObject): TypeJsonObject | null => {
    let symbolImage: TypeJsonObject | null = null;

    // check if a symbol object exists in the renderer
    if (renderer && renderer.symbol) {
      symbolImage = toJsonObject(renderer.symbol);
    } else if (renderer && renderer.uniqueValueInfos && renderer.uniqueValueInfos.length > 0) {
      // if symbol not found then check if there are multiple symbologies
      symbolImage = renderer.uniqueValueInfos.filter((info) => {
        // return the correct symbology matching the layer using the layer defined fields
        return info.value === (attributes[renderer.field1] || attributes[renderer.field2] || attributes[renderer.field3]);
      })[0].symbol;
    }

    return symbolImage;
  }, []);

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
   * Set the content of the panel by toggling between the contents
   *
   * @param {boolean} showLayersList a boolean value to show the layers list content
   * @param {boolean} showFeaturesList a boolean value to show the entry / feature list content
   * @param {boolean} showFeaturesInfo a boolean value to show the entry / feature info content
   */
  const setPanel = useCallback(
    (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => {
      // remove the back button if it exists
      buttonPanel.panel?.removeActionButton('back');

      // show the correct panel content
      setLayersList(showLayersList);
      setFeatureList(showFeaturesList);
      setFeatureInfo(showFeaturesInfo);

      // emit content change event so the panel can focus on close button
      api.event.emit(payloadBaseClass(EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT, mapId), buttonPanel.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buttonPanel.panel, mapId]
  );

  /**
   * Set the layers list as the panel content
   */
  const selectLayersList = useCallback(() => {
    setPanel(true, false, false);
  }, [setPanel]);

  /**
   * Set the entry / feature list as the panel content
   */
  const selectLayer = useCallback(
    /**
     * Set the entry / feature list object
     *
     * @param {TypeLayersEntry} layerData an object containing the entry / feature list
     */
    (layerData?: TypeLayersEntry) => {
      // set the entry / feature list data
      setSelectedLayer(layerData || {});

      // set the panel to show the entry / feature list content
      setPanel(false, true, false);
    },
    [setSelectedLayer, setPanel]
  );

  /**
   * Set the entry / feature info object
   *
   * @param {TypeJsonValue} featureData an object containing the entry / feature data
   */
  const selectFeature = useCallback(
    (featureData: TypeJsonValue) => {
      // set the entry / feature data
      setSelectedFeature(Cast<React.SetStateAction<TypeJsonObject>>(featureData));

      // set the panel to show the entry / feature info content
      setPanel(false, false, true);
    },
    [setSelectedFeature, setPanel]
  );

  /**
   * Get all aliases from the defined layer list, will be used when displaying entry / feature info
   *
   * @param {TypeFieldNameAliasArray} fields a list of the fields defined in the layer
   * @returns {TypeJsonValue} an object containing field name and it's alias
   */
  const getFieldAliases = (fields: TypeFieldNameAliasArray): TypeFieldAlias => {
    const fieldAliases: TypeFieldAlias = {};

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
   * @param {AbstractWebLayersClass} mapLayer the main object that contains added layers from the api
   * @param {Record<string, AbstractWebLayersClass>} data the data object that contains all layers
   * @param {TypeLayerInfo} layerInfo the layer information
   * @param {boolean} isGroupLayer a boolean value to check if this layer is a group layer
   */
  const addLayer = (
    mapLayer: AbstractWebLayersClass,
    data: Record<string, AbstractWebLayersClass>,
    layerInfo: TypeLayerInfo,
    isGroupLayer: boolean
  ) => {
    // get the layers object from the map, it begins with an empty object then adds each layer
    const { layers } = data[mapLayer.id];

    // add the layer to the layers object, the layer will have a key generated from the id and name of the layer seperated by dashes
    layers[`${layerInfo.id}-${layerInfo.name.replace(/\s+/g, '-').toLowerCase()}`] = Cast<TypeLayersEntry>({
      // the information about this layer
      layer: layerInfo,
      // is it a group layer or not
      groupLayer: isGroupLayer,
      // the layer entry / feature data, will be filled / reset when a click / crosshair event is triggered on an element
      layerData: [],
      // the default display field or field name defined in the layer
      displayField: layerInfo.displayField || layerInfo.displayFieldName || '',
      // the defined field aliases by the layer
      fieldAliases: getFieldAliases(layerInfo.fields),
      // the renderer object containing the symbology
      renderer: layerInfo.drawingInfo && layerInfo.drawingInfo.renderer,
    });

    // save the layers back to the data object on the specified map server layer
    // eslint-disable-next-line no-param-reassign
    data[mapLayer.id].layers = layers;
  };

  /**
   * Clear / Reset the layer data containing entries / features selected on a mouse click / crosshair events
   */
  const clearResults = useCallback(
    /**
     * Set the dataKey and layerKey to the selected layer to be cleared
     *
     * @param {string} dataKey the map server layer key / id
     * @param {string} layerKey the layer key / id
     */
    (dataKey: string, layerKey: string) => {
      const data = layersData[dataKey];

      const { layers } = data;

      // clear out previous results
      layers[layerKey].layerData = [];

      // save the new cleared out layerData
      setLayersData((prevState) => ({
        ...prevState,
        [dataKey]: {
          ...prevState[dataKey],
          layers,
        } as AbstractWebLayersClass,
      }));
    },
    [layersData]
  );

  /**
   * Handle opening the details panel with correct panel content
   * Identify the layers that matches the selected point from a mouse click / crosshair events
   *
   * @param {number[]} lnglat an array containing the longitude and latitude values from the event
   */
  const handleOpenDetailsPanel = useCallback(
    async (lnglat: number[]) => {
      // variable will be used later on as a counter to check which panel content should be selected
      const layersFound: TypeFoundLayers[] = [];

      // loop through all the map server layers
      for (let i = 0; i < Object.keys(layersData).length; i++) {
        const dataKey = Object.keys(layersData)[i];
        const data = layersData[dataKey];

        const { layer, layers, type } = data;

        // loop through all layers in each map server
        for (let j = 0; j < Object.keys(layers).length; j++) {
          const layerKey = Object.keys(layers)[j];

          // we don't want to query a group layer because we already added it's sub layers
          if (!layers[layerKey].groupLayer) {
            // clear previous entry data for this layer
            clearResults(dataKey, layerKey);

            // eslint-disable-next-line no-underscore-dangle
            const layerMap = api.map(mapId).map;
            // get map size
            const size = layerMap.getSize()!;

            // get extent
            const bounds = layerMap.getView().calculateExtent();

            const extent = {
              xmin: bounds[0],
              ymin: bounds[1],
              xmax: bounds[2],
              ymax: bounds[3],
              spatialReference: {
                wkid: 4326,
              },
            };

            // check layer type if WMS then use getFeatureInfo to query the data
            if (type === CONST_LAYER_TYPES.WMS) {
              const ogcWMSLayer = Cast<WMS>(layer);
              let getFeatureInfoResponse: TypeJsonArray | null = null;
              // eslint-disable-next-line no-await-in-loop
              getFeatureInfoResponse = await ogcWMSLayer.getFeatureInfo(lnglat);

              if (getFeatureInfoResponse && getFeatureInfoResponse!.length > 0) {
                layersFound.push(
                  Cast<TypeFoundLayers>({
                    layer: layers[layerKey],
                    entries: getFeatureInfoResponse,
                  })
                );

                // add the found entries to the array
                layers[layerKey].layerData.push(...getFeatureInfoResponse);

                // save the data
                setLayersData((prevState) => ({
                  ...prevState,
                  [dataKey]: {
                    ...prevState[dataKey],
                    layers,
                  } as AbstractWebLayersClass,
                }));
              }
            } else if (type === CONST_LAYER_TYPES.ESRI_FEATURE || type === CONST_LAYER_TYPES.ESRI_DYNAMIC) {
              const ogcEsriLayer = Cast<EsriDynamic | EsriFeature>(layer);
              // generate an identify query url
              const identifyUrl =
                `${ogcEsriLayer!.mapService.options.url}identify?` +
                `f=json` +
                `&tolerance=7` +
                `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
                `&imageDisplay=${size[0]},${size[1]},96` +
                `&layers=visible:${layers[layerKey].layer.id}` +
                `&returnFieldName=true` +
                `&sr=4326` +
                `&returnGeometry=true` +
                `&geometryType=esriGeometryPoint&geometry=${lnglat[0]},${lnglat[1]}`;

              // fetch the result from the map server
              // eslint-disable-next-line no-await-in-loop
              const response = await fetch(identifyUrl);

              type TypeJsonResponse = { results: TypeEntry[] };
              // eslint-disable-next-line no-await-in-loop
              const jsonResponse = (await response.json()) as TypeJsonResponse;

              if (jsonResponse && jsonResponse.results && jsonResponse.results.length > 0) {
                layersFound.push(
                  Cast<TypeFoundLayers>({
                    layer: layers[layerKey],
                    entries: jsonResponse.results,
                  })
                );

                // add the found entries to the array
                (layers[layerKey].layerData as TypeJsonArray).push(...jsonResponse.results);

                // save the data
                setLayersData((prevState) => ({
                  ...prevState,
                  [dataKey]: {
                    ...prevState[dataKey],
                    layers,
                  } as AbstractWebLayersClass,
                }));
              }
            }
          }
        }
      }

      let symbology = null;

      // if the found layers is only one check if we need to go directly to the entry / feature info
      if (layersFound.length === 1) {
        // set the entry data
        selectLayer(layersFound[0].layer);

        if (layersFound[0]) symbology = getSymbol(layersFound[0].layer.renderer, layersFound[0].entries[0].attributes);

        // if there are only one entry found in this layer then go directly to the entry / feature info
        if (layersFound[0].entries.length === 1) {
          selectFeature(
            toJsonObject({
              attributes: layersFound[0].entries[0].attributes,
              displayField: layersFound[0].layer.displayField,
              fieldAliases: layersFound[0].layer.fieldAliases,
              symbol: getSymbol(layersFound[0].layer.renderer, layersFound[0].entries[0].attributes),
              numOfEntries: 1,
            })
          );
        }
      } else {
        // if multiple layers contains entries then use the symbology of first layer
        if (layersFound.length > 0) {
          symbology = getSymbol(layersFound[0].layer.renderer, layersFound[0].entries[0].attributes);
        }

        // if there are multiple layers with entries then display the layer list panel content
        selectLayersList();
      }

      // save click position
      setClickPos(lnglat);

      // open the details panel
      buttonPanel.panel?.open();

      const panelContainer = document.querySelectorAll(`[data-id=${buttonPanel.id}]`)[0];

      // emit an event to display a marker on the click position
      // if there is only one layer with entries the symbology will be of that layer
      // if there is multiple layers with entries then symbology will be of the first layer
      // ...in case of multiple layers with entries, if a user selects a layer it will show the symbology of selected layer
      // if no layers contains any entry then the default symbology with crosshair will show
      api.event.emit(markerDefinitionPayload(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW, mapId, lnglat, symbology!));

      // set focus to the close button of the panel
      if (panelContainer) {
        const closeBtn = panelContainer.querySelectorAll('.cgpv-panel-close')[0];
        if (closeBtn) (closeBtn as HTMLElement).focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapId, buttonPanel.panel, buttonPanel.id, layersData, clearResults, selectLayer, getSymbol, selectFeature, selectLayersList]
  );

  useEffect(() => {
    // get the map service layers from the API
    const mapLayers = api.map(mapId).layer.layers;

    // will be used to store the added map server layers, layers in the map server etc...
    const data: Record<string, AbstractWebLayersClass> = {};

    // loop through each map server layer loaded from the map config and created using the API
    const layerIds = Object.keys(mapLayers);

    layerIds.forEach(async (id: string) => {
      const mapLayer = mapLayers[id];
      data[mapLayer.id] = Cast<AbstractWebLayersClass>({
        // the map server layer id
        id: mapLayer.id,
        name: mapLayer.name,
        // the type of the map server layer (WMS, Dynamic, Feature)
        type: mapLayer.type,
        // the layer class
        layer: mapLayer,
        // an object that will contains added layers from the map server layer
        layers: {},
      });

      // check each map server layer type and add it to the layers object of the map server in the data array
      if (webLayerIsWMS(mapLayer)) {
        // get layer ids / entries from the loaded WMS layer
        const { entries } = mapLayer;

        if (entries)
          for (let i = 0; i < entries.length; i++) {
            const layerId = entries[i];

            // query the layer information
            // eslint-disable-next-line no-await-in-loop
            const layerInfo = await queryServer(mapLayer.mapService.options.url! + layerId);

            // try to add the legend image url for the WMS layer
            // const legendImageUrl = `${ogcWMSLayer.url}?request=GetLegendGraphic&version=1.0.0&Service=WMS&format=image/png&layer=${layerId}`;
            const legendImageUrl = mapLayer.getLegendGraphic();

            // assign the url to the renderer
            if (layerInfo.drawingInfo && layerInfo.drawingInfo.renderer && layerInfo.drawingInfo.renderer.symbol) {
              Object.defineProperties(layerInfo.drawingInfo.renderer.symbol, {
                legendImageUrl: {
                  value: legendImageUrl,
                },
              });
            }

            addLayer(mapLayer, data, layerInfo, false);
          }
      } else if (webLayerIsEsriFeature(mapLayer)) {
        // query the layer information, feature layer URL will end by a number provided in the map config
        const layerInfo = await queryServer(mapLayer.url);

        addLayer(mapLayer, data, layerInfo, false);
      } else if (webLayerIsEsriDynamic(mapLayer)) {
        // get active layers
        const { entries } = mapLayer;

        const activeLayers: Record<number, number> = {};

        // change active layers to keys so it can be compared with id in all layers
        (entries as number[])?.forEach((entry: number) => {
          activeLayers[entry] = entry;
        });

        // get the metadata of the dynamic layer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapLayer.layer!.metadata(async (error: any, res: { layers: { id: string; subLayerIds: string[] }[] }) => {
          if (error) return;

          if (res.layers) {
            // loop through each layer in the dynamic layer
            for (let i = 0; i < res.layers.length; i++) {
              const layerData = res.layers[i];

              // if the index of the layer is one of the entries provided in the map config
              if (layerData.id in activeLayers) {
                // query the layer information from the map server by appending the index at the end of the URL
                // eslint-disable-next-line no-await-in-loop
                const layerInfo = await queryServer((mapLayer.layer!.options as L.esri.DynamicMapLayerOptions).url + layerData.id);

                addLayer(mapLayer, data, layerInfo, layerData.subLayerIds !== null && layerData.subLayerIds !== undefined);

                // if this layer is a group layer then loop through the sub layers and add them
                if (layerData.subLayerIds) {
                  for (let j = 0; j < layerData.subLayerIds.length; j++) {
                    const subLayer = layerData.subLayerIds[j];

                    // eslint-disable-next-line no-await-in-loop
                    const subLayerInfo = await queryServer((mapLayer.layer!.options as L.esri.DynamicMapLayerOptions).url + subLayer);

                    addLayer(mapLayer, data, subLayerInfo, false);
                  }
                }
              }
            }
          }
        });
      }
    });

    setLayersData(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Event when a click happens on the map
   *
   * @param e map browser event
   */
  const mapClickEvent = (e: { originalEvent: { shiftKey: unknown }; coordinate: number[] }) => {
    if (!e.originalEvent.shiftKey) {
      handleOpenDetailsPanel(e.coordinate);
    }
  };

  useEffect(() => {
    // handle map click
    mapInstance.on('click', mapClickEvent);

    // handle crosshair enter
    api.event.on(
      EVENT_NAMES.DETAILS_PANEL.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER,
      (payload) => {
        if (payloadIsALngLat(payload)) {
          if (payload.handlerName === mapId) {
            handleOpenDetailsPanel(payload.lnglat);
          }
        }
      },
      mapId
    );

    return () => {
      mapInstance.un('click', mapClickEvent);
      api.event.off(EVENT_NAMES.DETAILS_PANEL.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleOpenDetailsPanel, mapId, mapInstance]);

  // h is a reference to this.createElement
  // createElement is a React function to create React HTML elements
  // It takes 3 arguments, the tag element name, the attributes of the element and the content of the element
  return (
    <div className={classes.mainContainer}>
      {!layersList && !featureList && !featureInfo && <div>{t('click_map')}</div>}
      {layersList && (
        <LayersList
          clickPos={clickPos}
          layersData={layersData}
          selectFeature={selectFeature}
          selectLayer={selectLayer}
          getSymbol={getSymbol}
          mapId={mapId}
        />
      )}
      {featureList && (
        <FeaturesList
          getSymbol={getSymbol}
          buttonPanel={buttonPanel}
          selectLayer={selectLayer}
          selectedLayer={selectedLayer}
          selectFeature={selectFeature}
          setPanel={setPanel}
        />
      )}
      {featureInfo && (
        <FeatureInfo buttonPanel={buttonPanel} selectedFeature={selectedFeature as TypeSelectedFeature} setPanel={setPanel} />
      )}
    </div>
  );
}

export default PanelContent;

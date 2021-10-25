/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable func-names */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable object-shorthand */
import { useCallback, useEffect, useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import LayersList from './layers-list';
import FeaturesList from './features-list';
import FeatureInfo from './feature-info';
import {
    Cast,
    TypeJSONObject,
    TypeJSONValue,
    TypeRendererSymbol,
    TypeSelectedFeature,
    TypeLayerData,
    TypeLayerInfo,
    TypeFieldNameAlias,
    TypeFoundLayers,
    TypeLayersEntry,
    TypeEntry,
    TypePanelContentProps,
} from '../../types/cgpv-types';

// use material ui theming
const useStyles = makeStyles(() => ({
    mainContainer: {
        display: 'flex',
        flexDirection: 'row',
    },
}));

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns A React JSX Element with the details panel
 */
const PanelContent = (props: TypePanelContentProps): JSX.Element => {
    const { buttonPanel, mapId } = props;

    const [layersData, setLayersData] = useState<Record<string, TypeLayerData>>({});
    const [selectedLayer, setSelectedLayer] = useState<TypeLayersEntry | {}>({});
    const [selectedFeature, setSelectedFeature] = useState<TypeSelectedFeature | {}>({});

    const [layersList, setLayersList] = useState(false);
    const [featureList, setFeatureList] = useState(false);
    const [featureInfo, setFeatureInfo] = useState(false);

    const [clickPos, setClickPos] = useState<L.LatLng>();

    const classes = useStyles();

    // get the map instance
    const mapInstance = api.map(mapId).map;

    /**
     * Get the symbology from the layer
     *
     * @param {TypeRendererSymbol} renderer the display renderer containing the symbol
     * @param {TypeJSONObject} attributes the attributes of the selected layer features
     * @returns {TypeJSONObject} the symbology containing the imageData
     */
    const getSymbol = useCallback((renderer: TypeRendererSymbol, attributes: TypeJSONObject): TypeJSONObject => {
        let symbolImage: TypeJSONObject | null = null;

        // check if a symbol object exists in the renderer
        if (renderer && renderer.symbol) {
            symbolImage = renderer.symbol;
        } else if (renderer && renderer.uniqueValueInfos && renderer.uniqueValueInfos.length > 0) {
            // if symbol not found then check if there are multiple symbologies
            symbolImage = renderer.uniqueValueInfos.filter((info) => {
                // return the correct symbology matching the layer using the layer defined fields
                return info.value === (attributes[renderer.field1] || attributes[renderer.field2] || attributes[renderer.field3]);
            })[0].symbol as TypeJSONObject;
        }

        return symbolImage as TypeJSONObject;
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
            api.event.emit(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT, mapId, {});
        },
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
     * @param {TypeJSONObject} featureData an object containing the entry / feature data
     */
    const selectFeature = useCallback(
        (featureData: TypeJSONObject) => {
            // set the entry / feature data
            setSelectedFeature(featureData);

            // set the panel to show the entry / feature info content
            setPanel(false, false, true);
        },
        [setSelectedFeature, setPanel]
    );

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
    const addLayer = (mapLayer: TypeLayerData, data: Record<string, TypeLayerData>, layerInfo: TypeLayerInfo, isGroupLayer: boolean) => {
        // get the layers object from the map, it begins with an empty object then adds each layer
        const { layers } = data[mapLayer.id];

        // add the layer to the layers object, the layer will have a key generated from the id and name of the layer seperated by dashes
        layers[`${layerInfo.id}-${layerInfo.name.replace(/\s+/g, '-').toLowerCase()}`] = {
            // the information about this layer
            layer: layerInfo,
            // is it a group layer or not
            groupLayer: isGroupLayer,
            // the layer entry / feature data, will be filled / reset when a click / crosshair event is triggered on an element
            layerData: [] as TypeJSONValue[],
            // the default display field or field name defined in the layer
            displayField: layerInfo.displayField || layerInfo.displayFieldName || '',
            // the defined field aliases by the layer
            fieldAliases: getFieldAliases(layerInfo.fields),
            // the renderer object containing the symbology
            renderer: layerInfo.drawingInfo && layerInfo.drawingInfo.renderer,
        };

        // save the layers back to the data object on the specified map server layer
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
                },
            }));
        },
        [layersData]
    );

    /**
     * Handle opening the details panel with correct panel content
     * Identify the layers that matches the selected point from a mouse click / crosshair events
     *
     * @param {L.LatLng} latlng a LatLng object containing the latitude and longitude values from the event
     */
    const handleOpenDetailsPanel = useCallback(
        async (latlng: L.LatLng) => {
            // variable will be used later on as a counter to check which panel content should be selected
            const layersFound: TypeFoundLayers[] = [];

            // loop through all the map server layers
            for (let i = 0; i < Object.keys(layersData).length; i++) {
                const dataKey = Object.keys(layersData)[i];
                const data = layersData[dataKey];

                const { layer, layers } = data;

                // loop through all layers in each map server
                for (let j = 0; j < Object.keys(layers).length; j++) {
                    const l = Object.keys(layers)[j];

                    // we don't want to query a group layer because we already added it's sub layers
                    if (!layers[l].groupLayer) {
                        // clear previous entry data for this layer
                        clearResults(dataKey, l);

                        const layerMap = Cast<{ _map: L.Map }>(layer)._map;
                        // get map size
                        const size = layerMap.getSize();

                        // get extent
                        const bounds = layerMap.getBounds();

                        const extent = {
                            xmin: bounds.getSouthWest().lng,
                            ymin: bounds.getSouthWest().lat,
                            xmax: bounds.getNorthEast().lng,
                            ymax: bounds.getNorthEast().lat,
                            spatialReference: {
                                wkid: 4326,
                            },
                        };

                        // TODO check layer type if WMS then use getFeatureInfo to query the data

                        // generate an identify query url
                        const identifyUrl =
                            `${layer.mapService.options.url}identify?` +
                            `f=json` +
                            `&tolerance=3` +
                            `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
                            `&imageDisplay=${size.x},${size.y},96` +
                            `&layers=visible:${layers[l].layer.id}` +
                            `&returnFieldName=true` +
                            `&sr=4326` +
                            `&returnGeometry=true` +
                            `&geometryType=esriGeometryPoint&geometry=${latlng.lng},${latlng.lat}`;

                        // fetch the result from the map server
                        const response = await fetch(identifyUrl);
                        const res = (await response.json()) as { results: TypeEntry[] };

                        if (res && res.results && res.results.length > 0) {
                            layersFound.push({
                                layer: layers[l],
                                entries: res.results,
                            } as TypeFoundLayers);

                            // add the found entries to the array
                            layers[l].layerData?.push(...res.results);

                            // save the data
                            setLayersData((prevState) => ({
                                ...prevState,
                                [dataKey]: {
                                    ...prevState[dataKey],
                                    layers,
                                },
                            }));
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
                    selectFeature({
                        attributes: layersFound[0].entries[0].attributes,
                        displayField: layersFound[0].layer.displayField,
                        fieldAliases: layersFound[0].layer.fieldAliases,
                        symbol: getSymbol(layersFound[0].layer.renderer, layersFound[0].entries[0].attributes),
                        numOfEntries: 1,
                    });
                }
            } else {
                // if multiple layers contains entries then use the symbology of first layer
                if (layersFound.length > 0) {
                    symbology = getSymbol(layersFound[0].layer.renderer, layersFound[0].entries[0].attributes);
                }

                // if there are multiple layers with entries then display the layer list panel content
                selectLayersList();
            }

            // emit an event to display a marker on the click position
            // if there is only one layer with entries the symbology will be of that layer
            // if there is multiple layers with entries then symbology will be of the first layer
            // ...in case of multiple layers with entries, if a user selects a layer it will show the symbology of selected layer
            // if no layers contains any entry then the default symbology with crosshair will show
            api.event.emit(EVENT_NAMES.EVENT_MARKER_ICON_SHOW, mapId, {
                latlng,
                symbology,
            });

            // save click position
            setClickPos(latlng);

            // open the details panel
            buttonPanel.panel?.open();

            const panelContainer = document.querySelectorAll(`[data-id=${buttonPanel.id}]`)[0];

            // set focus to the close button of the panel
            if (panelContainer) {
                const closeBtn = panelContainer.querySelectorAll('.cgpv-panel-close')[0];
                (closeBtn as HTMLElement).focus();
            }
        },
        [mapId, buttonPanel.panel, buttonPanel.id, layersData, clearResults, selectLayer, getSymbol, selectFeature, selectLayersList]
    );

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
            if (mapLayer.type === 'ogcWMS') {
                // get layer ids / entries from the loaded WMS layer
                const { entries } = mapLayer.layer;

                for (let i = 0; i < entries.length; i++) {
                    const layerId = entries[i];

                    // query the layer information
                    const layerInfo = await queryServer(mapLayer.layer.mapService.options.url + layerId);

                    // try to add the legend image url for the WMS layer
                    const legendImageUrl = `${mapLayer.layer._url}?request=GetLegendGraphic&version=1.0.0&Service=WMS&format=image/png&layer=${layerId}`;

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
            } else if (mapLayer.type === 'esriFeature') {
                // query the layer information, feature layer URL will end by a number provided in the map config
                const layerInfo = await queryServer(mapLayer.layer.options.url);

                addLayer(mapLayer, data, layerInfo, false);
            } else if (mapLayer.type === 'esriDynamic') {
                // get active layers
                const entries = mapLayer.layer.getLayers();

                const activeLayers: Record<number, number> = {};

                // change active layers to keys so it can be compared with id in all layers
                entries.forEach((entry: number) => {
                    activeLayers[entry] = entry;
                });

                // get the metadata of the dynamic layer
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mapLayer.layer.metadata(async (error: any, res: { layers: { id: string; subLayerIds: string[] }[] }) => {
                    if (error) return;

                    if (res.layers) {
                        // loop through each layer in the dynamic layer
                        for (let i = 0; i < res.layers.length; i++) {
                            const layerData = res.layers[i];

                            // if the index of the layer is one of the entries provided in the map config
                            if (layerData.id in activeLayers) {
                                // query the layer information from the map server by appending the index at the end of the URL
                                const layerInfo = await queryServer(mapLayer.layer.options.url + layerData.id);

                                addLayer(mapLayer, data, layerInfo, layerData.subLayerIds !== null && layerData.subLayerIds !== undefined);

                                // if this layer is a group layer then loop through the sub layers and add them
                                if (layerData.subLayerIds) {
                                    for (let j = 0; j < layerData.subLayerIds.length; j++) {
                                        const subLayer = layerData.subLayerIds[j];

                                        const subLayerInfo = await queryServer(mapLayer.layer.options.url + subLayer);

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

    useEffect(() => {
        // handle map click
        mapInstance.on('click', async (e: L.LeafletMouseEvent) => {
            if (!e.originalEvent.shiftKey) {
                handleOpenDetailsPanel(e.latlng);
            }
        });

        // handle crosshair enter
        api.event.on(
            EVENT_NAMES.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER,
            function (args: { handlerName: string; latlng: L.LatLng }) {
                if (args.handlerName === mapId) {
                    handleOpenDetailsPanel(args.latlng);
                }
            },
            mapId
        );

        return () => {
            mapInstance.off('click');
            api.event.off(EVENT_NAMES.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER);
        };
    }, [handleOpenDetailsPanel, mapId, mapInstance]);

    // h is a reference to this.createElement
    // createElement is a React function to create React HTML elements
    // It takes 3 arguments, the tag element name, the attributes of the element and the content of the element
    return (
        <div className={classes.mainContainer}>
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
};

export default PanelContent;

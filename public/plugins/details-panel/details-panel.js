/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable object-shorthand */
(function autoExecute() {
    /**
     * DetailsPanel plugin that will create a react component to show details when a feature or a layer is clicked on the map
     */
    class DetailsPanel {
        // variable used to store the created button and panel
        buttonPanel = null;

        // define a translations object to extend the core translations
        translations = {
            'en-CA': {
                detailsPanel: 'Details',
                nothing_found: 'Nothing found',
                action_back: 'Back',
            },
            'fr-CA': {
                detailsPanel: 'Détails',
                nothing_found: 'Aucun résultat',
                action_back: 'Retour',
            },
        };

        // hook is called right after the plugin has been added
        added = () => {
            const { api, react, makeStyles, translate } = this;
            const { mapId } = this.props;

            // used to create react element
            // use h so instead of calling this.createElement just call h
            const h = this.createElement;

            const { useState, useEffect, useCallback } = react;
            const { useTranslation } = translate;

            // get used language
            const { language } = api.map(mapId);

            // use material ui theming
            const useStyles = makeStyles(() => ({
                mainContainer: {
                    display: 'flex',
                    flexDirection: 'row',
                },
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
                    // justifyContent: 'space-around',
                    alignItems: 'center',
                    width: '100%',
                },
                layerFeatureCount: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '32px',
                    minWidth: '32px',
                    height: '32px',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
                    marginRight: '10px',
                    color: 'black',
                    fontSize: '16px',
                    fontWeight: 'bold',
                },
                layerItemText: {
                    fontSize: '14px',
                    // fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                },
                featuresContainer: {
                    overflow: 'hidden',
                    overflowY: 'auto',
                    width: '100%',
                },
                featureItem: {
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
                },
                featureIconTextContainer: {
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                },
                featureItemIconContainer: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '32px',
                    minWidth: '32px',
                    height: '32px',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
                },
                featureItemIcon: {},
                featureItemText: {
                    display: 'inline-block',
                    width: '100%',
                    fontWeight: '400',
                    marginLeft: '10px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontSize: '16px',
                },
                featureInfoContainer: {
                    width: '100%',
                },
                featureInfoHeader: {
                    display: 'flex',
                    alignItems: 'center',
                },
                featureInfoHeaderIconContainer: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '32px',
                    minWidth: '32px',
                    height: '32px',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
                },
                featureInfoHeaderIcon: {},
                featureInfoHeaderText: {
                    marginLeft: '10px',
                    width: '100%',
                    fontSize: 18,
                },
                featureInfoItemsContainer: {
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: 20,
                },
                featureInfoItem: {
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '5px 0',
                },
                featureInfoItemKey: {
                    fontWeight: 'bold',
                    fontSize: 16,
                },
                featureInfoItemValue: {
                    fontSize: 16,
                    backgroundColor: '#ddd',
                },
            }));

            /**
             * Get the symbology from the layer
             *
             * @param {Object} renderer the display renderer containing the symbol
             * @param {Object} attributes the attributes of the selected layer features
             * @returns the symbology containing the imageData
             */
            const getSymbol = (renderer, attributes) => {
                let symbolImage = null;

                // check if a symbol object exists in the renderer
                if (renderer && renderer.symbol) {
                    symbolImage = renderer.symbol;
                } else if (renderer && renderer.uniqueValueInfos && renderer.uniqueValueInfos.length > 0) {
                    // if symbol not found then check if there are multiple symbologies
                    symbolImage = renderer.uniqueValueInfos.filter((info) => {
                        // return the correct symbology matching the layer using the layer defined fields
                        return info.value === (attributes[renderer.field1] || attributes[renderer.field2] || attributes[renderer.field3]);
                    })[0].symbol;
                }

                return symbolImage;
            };

            /**
             * A react component that will list the map server layers defined in the map config
             *
             * @param {Object} props properties passed to the component
             * @returns a React JSX Element containing map server layers
             */
            const LayersList = (props) => {
                const classes = useStyles();

                const goToFeatureList = (data, layerObj) => {
                    const { layerData, displayField, fieldAliases, renderer } = data.layers[layerObj];

                    // set the layer entry data
                    props.selectLayer(data.layers[layerObj]);

                    // check if the layer has only one entry
                    if (layerData.length === 1) {
                        // go to the entry information skipping entry list
                        props.selectFeature({
                            attributes: layerData[0].attributes,
                            displayField,
                            fieldAliases,
                            symbol: getSymbol(renderer, layerData[0].attributes),
                            numOfEntries: 1,
                        });
                    }
                };

                return h(
                    'div',
                    {
                        className: classes.layersContainer,
                    },
                    // loop through each map server layer
                    Object.keys(props.layersData).map((dataKey) => {
                        const data = props.layersData[dataKey];

                        return h(
                            'div',
                            {
                                key: data.id,
                            },
                            // loop through each layer in the map server
                            Object.keys(data.layers).map((layerObj, index) => {
                                const { layer, layerData, groupLayer } = data.layers[layerObj];

                                return h(
                                    'div',
                                    {
                                        key: index,
                                        tabIndex: layerData.length > 0 && !groupLayer ? 0 : -1,
                                        onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                if (!groupLayer) {
                                                    goToFeatureList(data, layerObj);
                                                }
                                            }
                                        },
                                    },
                                    // if the map server is a group layer then display its title as a header of it's sub layers
                                    groupLayer
                                        ? h(
                                              'div',
                                              {
                                                  className: classes.layerParentText,
                                                  title: layer.name,
                                              },
                                              layer.name
                                          )
                                        : h(
                                              'button',
                                              {
                                                  className: classes.layerItem,
                                                  disabled: layerData.length === 0,
                                                  // if a layer is clicked
                                                  onClick:
                                                      layerData.length > 0
                                                          ? () => {
                                                                goToFeatureList(data, layerObj);
                                                            }
                                                          : null,
                                              },
                                              h(
                                                  'div',
                                                  {
                                                      className: classes.layerCountTextContainer,
                                                  },
                                                  h('span', { className: classes.layerFeatureCount }, layerData.length),
                                                  h(
                                                      'div',
                                                      {
                                                          className: classes.layerItemText,
                                                          title: layer.name,
                                                      },
                                                      layer.name
                                                  )
                                              )
                                          )
                                );
                            })
                        );
                    })
                );
            };

            /**
             * A react component to display layer entries
             *
             * @param {Object} props properties of the component
             * @returns A react JSX Element containing the entry list of a layer
             */
            const FeaturesList = (props) => {
                const { displayField, fieldAliases, layerData, renderer } = props.selectedLayer;

                const classes = useStyles();

                const { t } = useTranslation();

                const goToFeatureInfo = (attributes, symbolImage) => {
                    // add a back action button on the entry information panel to go back to the entry list
                    this.buttonPanel.panel.addActionButton(
                        'back',
                        t('action_back'),
                        '<i class="material-icons">keyboard_backspace</i>',
                        () => {
                            if (layerData.length === 1) {
                                props.setPanel(true, false, false);
                            } else {
                                // go back to entry list when clicked
                                props.selectLayer();
                            }
                        }
                    );

                    // set panel content to the entry information
                    props.selectFeature({
                        attributes,
                        displayField,
                        fieldAliases,
                        symbol: symbolImage,
                        numOfEntries: layerData.length,
                    });
                };

                useEffect(() => {
                    // add new action button that goes back to the layers list
                    this.buttonPanel.panel.addActionButton(
                        'back',
                        t('action_back'),
                        '<i class="material-icons">keyboard_backspace</i>',
                        () => {
                            // set the panel content back to the map server layer list
                            props.setPanel(true, false, false);
                        }
                    );
                }, []);

                return layerData.length > 0
                    ? h(
                          'div',
                          {
                              className: classes.featuresContainer,
                          },
                          // loop through each entry
                          layerData.map((feature, i) => {
                              const { attributes } = feature;

                              // get symbol
                              const symbolImage = getSymbol(renderer, attributes);

                              // get the title from the attributes, if no title was defined in the layer then set it to the objectId
                              const title = attributes[displayField].length > 0 ? `${attributes[displayField]}` : `${attributes.OBJECTID}`;

                              return h(
                                  'div',
                                  {
                                      key: i,
                                      tabIndex: 0,
                                      onKeyDown: (e) => {
                                          if (e.key === 'Enter') {
                                              goToFeatureInfo(attributes, symbolImage);
                                          }
                                      },
                                  },
                                  h(
                                      'div',
                                      {
                                          className: classes.featureItem,
                                          onClick: () => {
                                              goToFeatureInfo(attributes, symbolImage);
                                          },
                                      },
                                      h(
                                          'div',
                                          {
                                              className: classes.featureIconTextContainer,
                                          },
                                          h(
                                              'div',
                                              {
                                                  className: classes.featureItemIconContainer,
                                              },
                                              symbolImage.imageData
                                                  ? h('img', {
                                                        className: classes.featureItemIcon,
                                                        src: `data:${symbolImage.contentType};base64, ${symbolImage.imageData}`,
                                                    })
                                                  : renderer.symbol.legendImageUrl
                                                  ? h('img', {
                                                        className: classes.featureItemIcon,
                                                        src: renderer.symbol.legendImageUrl,
                                                    })
                                                  : h('div', {
                                                        className: classes.featureItemIcon,
                                                    })
                                          ),
                                          h(
                                              'span',
                                              {
                                                  className: classes.featureItemText,
                                                  title: title,
                                              },
                                              title
                                          )
                                      )
                                  )
                              );
                          })
                      )
                    : h(
                          'div',
                          {
                              className: classes.featureItemText,
                          },
                          t('nothing_found')
                      );
            };

            /**
             * A react component that will return entry / feature information
             *
             * @param {Object} props properties for the component
             * @returns A react JSX Element with the entry / feature information
             */
            const FeatureInfo = (props) => {
                const { displayField, fieldAliases, attributes, symbol, numOfEntries } = props.selectedFeature;

                const classes = useStyles();

                const { t } = useTranslation();

                useEffect(() => {
                    // add new action button that goes back to the entry / features list or layers list
                    this.buttonPanel.panel.addActionButton(
                        'back',
                        t('action_back'),
                        '<i class="material-icons">keyboard_backspace</i>',
                        () => {
                            if (numOfEntries === 1) {
                                // set panel back to layers list
                                props.setPanel(true, false, false);
                            } else {
                                // set panel back to entry / feature list
                                props.setPanel(false, true, false);
                            }
                        }
                    );
                }, []);

                return h(
                    'div',
                    {
                        className: classes.featureInfoContainer,
                    },
                    h(
                        'div',
                        {
                            className: classes.featureInfoHeader,
                        },
                        h(
                            'div',
                            { className: classes.featureInfoHeaderIconContainer },
                            // display a header icon (symbology icon)
                            symbol.imageData
                                ? h('img', {
                                      className: classes.featureInfoHeaderIcon,
                                      src: `data:${symbol.contentType};base64, ${symbol.imageData}`,
                                  })
                                : symbol.legendImageUrl
                                ? h('img', {
                                      className: classes.featureInfoHeaderIcon,
                                      src: symbol.legendImageUrl,
                                  })
                                : h('div', {
                                      className: classes.featureInfoHeaderIcon,
                                  })
                        ),
                        h(
                            'span',
                            { className: classes.featureInfoHeaderText },
                            // display the title of the selected entry
                            attributes[displayField].length > 0 ? `${attributes[displayField]}` : `${attributes.OBJECTID}`
                        )
                    ),
                    h(
                        'div',
                        { className: classes.featureInfoItemsContainer },
                        // loop through each attribute in the selected entry / feature
                        Object.keys(attributes).map((attrKey) => {
                            const attributeAlias = fieldAliases[attrKey];
                            const attributeValue = attributes[attrKey];

                            return (
                                attributeValue.length > 0 &&
                                attributeAlias !== 'OBJECTID' &&
                                attributeAlias !== 'SHAPE' &&
                                h(
                                    'div',
                                    { className: classes.featureInfoItem, key: attrKey, tabIndex: 0 },
                                    h('span', { className: classes.featureInfoItemKey }, attributeAlias),
                                    h('span', { className: classes.featureInfoItemValue }, attributeValue)
                                )
                            );
                        })
                    )
                );
            };

            /**
             * A react component that displays the details panel content
             *
             * @returns A React JSX Element with the details panel
             */
            const Component = () => {
                const [layersData, setLayersData] = useState({});
                const [selectedLayer, setSelectedLayer] = useState({});
                const [selectedFeature, setSelectedFeature] = useState({});

                const [layersList, setLayersList] = useState(false);
                const [featureList, setFeatureList] = useState(false);
                const [featureInfo, setFeatureInfo] = useState(false);

                const classes = useStyles();

                // get the map instance
                const mapInstance = api.map(mapId).map;

                /**
                 * Fetch the json response from the map server
                 *
                 * @param {string} url the url of the map server
                 * @returns a json containing the result of the query
                 */
                const queryServer = async (url) => {
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
                const setPanel = (showLayersList, showFeaturesList, showFeaturesInfo) => {
                    // remove the back button if it exists
                    this.buttonPanel.panel.removeActionButton('back');

                    // show the correct panel content
                    setLayersList(showLayersList);
                    setFeatureList(showFeaturesList);
                    setFeatureInfo(showFeaturesInfo);
                };

                /**
                 * Set the layers list as the panel content
                 */
                const selectLayersList = useCallback(() => {
                    setPanel(true, false, false);
                }, []);

                /**
                 * Set the entry / feature list as the panel content
                 */
                const selectLayer = useCallback(
                    /**
                     * Set the entry / feature list object
                     *
                     * @param {TypeJSONObject} layerData an object containing the entry / feature list
                     */
                    (layerData) => {
                        // set the entry / feature list data
                        setSelectedLayer(layerData);

                        // set the panel to show the entry / feature list content
                        setPanel(false, true, false);
                    },
                    [setSelectedLayer]
                );

                /**
                 * Set the entry / feature info as the panel content
                 */
                const selectFeature = useCallback(
                    /**
                     * Set the entry / feature info object
                     *
                     * @param {Object} featureData an object containing the entry / feature data
                     */
                    (featureData) => {
                        // set the entry / feature data
                        setSelectedFeature(featureData);

                        // set the panel to show the entry / feature info content
                        setPanel(false, false, true);
                    },
                    [setSelectedFeature]
                );

                /**
                 * Get all aliases from the defined layer list, will be used when displaying entry / feature info
                 *
                 * @param {Object} fields a list of the fields defined in the layer
                 * @returns an object containing field name and it's alias
                 */
                const getFieldAliases = (fields) => {
                    const fieldAliases = {};

                    if (fields) {
                        fields.forEach((field) => {
                            const { name, alias } = field;

                            fieldAliases[name] = alias;
                        });
                    }

                    return fieldAliases;
                };

                /**
                 * Add a layer to the panel layer list
                 *
                 * @param {Object} mapLayer the main object that contains added layers from the api
                 * @param {Object} data the data object that contains all layers
                 * @param {Object} layerInfo the layer information
                 * @param {boolean} isGroupLayer a boolean value to check if this layer is a group layer
                 */
                const addLayer = (mapLayer, data, layerInfo, isGroupLayer) => {
                    // get the layers object from the map, it begins with an empty object then adds each layer
                    const { layers } = data[mapLayer.id];

                    // add the layer to the layers object, the layer will have a key generated from the id and name of the layer seperated by dashes
                    layers[`${layerInfo.id}-${layerInfo.name.replace(/\s+/g, '-').toLowerCase()}`] = {
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
                    (dataKey, layerKey) => {
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
                 */
                const handleOpenDetailsPanel = useCallback(
                    /**
                     * Identify the layers that matches the selected point from a mouse click / crosshair events
                     *
                     * @param {Object} latlng a LatLng object containing the latitude and longitude values from the event
                     */
                    async (latlng) => {
                        // variable will be used later on as a counter to check which panel content should be selected
                        const layersFound = [];

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

                                    // get map size
                                    const size = layer._map.getSize();

                                    // get extent
                                    const bounds = layer._map.getBounds();

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
                                    const res = await response.json();

                                    if (res && res.results && res.results.length > 0) {
                                        layersFound.push({
                                            layer: layers[l],
                                            entries: res.results,
                                        });

                                        // add the found entries to the array
                                        layers[l].layerData.push(...res.results);

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

                        // if the found layers is only one check if we need to go directly to the entry / feature info
                        if (layersFound.length === 1) {
                            // set the entry data
                            selectLayer(layersFound[0].layer);

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
                            // if there are multiple layers with entries then display the layer list panel content
                            selectLayersList();
                        }

                        // open the details panel
                        this.buttonPanel.panel.open();

                        const panelContainer = document.querySelectorAll(`[data-id=${this.buttonPanel.id}]`)[0];

                        if (panelContainer) {
                            const closeBtn = panelContainer.querySelectorAll('.cgpv-panel-close')[0];

                            closeBtn.focus();
                        }
                    },
                    [selectFeature, selectLayer, selectLayersList, clearResults, layersData]
                );

                useEffect(() => {
                    // get the map service layers from the API
                    const mapLayers = api.map(mapId).layers;

                    // will be used to store the added map server layers, layers in the map server etc...
                    const data = {};

                    // loop through each map server layer loaded from the map config and created using the API
                    mapLayers.forEach(async (mapLayer) => {
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

                            const activeLayers = {};

                            // change active layers to keys so it can be compared with id in all layers
                            entries.forEach((entry) => {
                                activeLayers[entry] = entry;
                            });

                            // get the metadata of the dynamic layer
                            mapLayer.layer.metadata(async (error, res) => {
                                if (error) return;

                                if (res.layers) {
                                    // loop through each layer in the dynamic layer
                                    for (let i = 0; i < res.layers.length; i++) {
                                        const layerData = res.layers[i];

                                        // if the index of the layer is one of the entries provided in the map config
                                        if (layerData.id in activeLayers) {
                                            // query the layer information from the map server by appending the index at the end of the URL
                                            const layerInfo = await queryServer(mapLayer.layer.options.url + layerData.id);

                                            addLayer(
                                                mapLayer,
                                                data,
                                                layerInfo,
                                                layerData.subLayerIds !== null && layerData.subLayerIds !== undefined
                                            );

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
                }, []);

                useEffect(() => {
                    // handle map click
                    mapInstance.on('click', async (e) => {
                        handleOpenDetailsPanel(e.latlng);
                    });

                    // handle crosshair enter
                    api.event.on(
                        'details_panel/crosshair_enter',
                        function onDetails(props) {
                            if (props.handlerName === mapId) {
                                handleOpenDetailsPanel(props.latlng);
                            }
                        },
                        mapId
                    );

                    return () => {
                        mapInstance.off('click');
                        api.event.off('details_panel/crosshair_enter');
                    };
                }, [handleOpenDetailsPanel, mapInstance]);

                // h is a reference to this.createElement
                // createElement is a React function to create React HTML elements
                // It takes 3 arguments, the tag element name, the attributes of the element and the content of the element
                return h(
                    'div',
                    {
                        className: classes.mainContainer,
                    },
                    layersList &&
                        h(LayersList, {
                            layersData: layersData,
                            selectFeature,
                            selectLayer,
                        }),
                    featureList &&
                        h(FeaturesList, {
                            selectedLayer: selectedLayer,
                            selectFeature,
                            setPanel,
                        }),
                    featureInfo &&
                        h(FeatureInfo, {
                            selectedFeature: selectedFeature,
                            setPanel,
                        })
                );
            };

            // button props
            const button = {
                // set ID to detailsPanel so that it can be accessed from the core viewer
                id: 'detailsPanel',
                tooltip: this.translations[language].detailsPanel,
                icon: '<i class="material-icons">details</i>',
                visible: false,
            };

            // panel props
            const panel = {
                title: this.translations[language].detailsPanel,
                icon: '<i class="material-icons">details</i>',
                content: Component,
                width: 300,
            };

            // create a new button panel on the appbar
            this.buttonPanel = api.map(mapId).createAppbarPanel(button, panel, null);
        };

        // hook is called once the plugin has been unmounted, remove any added components
        removed = () => {
            const { mapId } = this.props;

            this.api.map(mapId).removeAppbarPanel(this.buttonPanel.id);
        };
    }

    // export this plugin
    window.plugins = window.plugins || {};
    window.plugins.detailsPanel = DetailsPanel;
})();

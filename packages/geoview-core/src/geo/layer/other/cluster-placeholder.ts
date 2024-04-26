// src/core/components/map/map.tsx
// TODO: do not deal with stuff not related to create the payload in the event, use the event on or store state to listen to change and do what is needed.
// GVThis was in mapZoomEnd event.... listen to the event in proper place
// Object.keys(layers).forEach((layer) => {
//   if (layer.endsWith('-unclustered')) {
//     const clusterLayerId = layer.replace('-unclustered', '');
//     const splitZoom =
//       (api.maps[mapId].layer.registeredLayers[clusterLayerId].source as TypeVectorSourceInitialConfig)!.cluster!.splitZoom || 7;
//     if (prevZoom < splitZoom && currentZoom >= splitZoom) {
//       api.maps[mapId].layer.geoviewLayers(clusterLayerId).setVisible(false);
//       api.maps[mapId].layer.geoviewLayers(layer).setVisible(true);
//     }
//     if (prevZoom >= splitZoom && currentZoom < splitZoom) {
//       api.maps[mapId].layer.geoviewLayers(clusterLayerId).setVisible(true);
//       api.maps[mapId].layer.geoviewLayers(layer).setVisible(false);
//     }
//   }
// });

// packages\geoview-core\schema.json - TypeVectorSourceInitialConfig - properties
// "cluster": {
//   "$ref": "#/definitions/TypeSourceVectorClusterConfig"
// },

// packages\geoview-core\schema.json
// "TypeSourceVectorClusterConfig": {
//   "additionalProperties": false,
//   "type": "object",
//   "description": "Cluster vector data on vector layer. Works out of the box with point geometries. If another geometry is provided, it will be converted to points geometry.",
//   "properties": {
//     "enable": {
//       "type": "boolean",
//       "default": false
//     },
//     "distance": {
//       "type": "integer",
//       "description": "Distance in pixels within which features will be clustered together (default 20px)."
//     },
//     "minDistance": {
//       "type": "integer",
//       "description": "Minimum distance in pixels between clusters. Will be capped at the configured distance. By default no minimum distance is guaranteed. This config can be used to avoid overlapping icons. As a tradoff, the cluster feature's position will no longer be the center of all its features."
//     },
//     "splitZoom": {
//       "type": "integer",
//       "description": "Zoom level at which all clusters will split (default 7)."
//     },
//     "textColor": {
//       "type": "string",
//       "description": "Color for the text showing the number of points in a cluster"
//     },
//     "settings": {
//       "$ref": "#/definitions/TypeSimpleSymbolVectorConfig",
//       "description": "settings for the cluster symbol and clustered geometries"
//     }
//   }
// },

// packages\geoview-core\public\configs\cluster-config.json
// {
//   "map": {
//     "interaction": "dynamic",
//     "viewSettings": {
//       "zoom": 4,
//       "center": [-100, 60],
//       "projection": 3857
//     },
//     "basemapOptions": {
//       "basemapId": "transport",
//       "shaded": false,
//       "labeled": true
//     },
//     "listOfGeoviewLayerConfig": [
//       {
//         "geoviewLayerId": "flood_cluster",
//         "geoviewLayerName": {
//           "en": "Cluster test"
//         },
//         "geoviewLayerType": "GeoJSON",
//         "listOfLayerEntryConfig": [
//           {
//             "layerId": "lines.json",
//             "source": {
//               "dataAccessPath": {
//                 "en": "./datasets/geojson/"
//               },
//               "cluster": {
//                 "enable": true,
//                 "textColor": "black"
//               }
//             }
//           },
//           {
//             "layerId": "polygons.json",
//             "source": {
//               "dataAccessPath": {
//                 "en": "./datasets/geojson/"
//               },
//               "cluster": {
//                 "enable": true
//               }
//             }
//           }
//         ]
//       }
//     ]
//   },
//   "theme": "geo.ca",
//   "components": [],
//   "suportedLanguages": ["en"]
// }

// packages\geoview-core\src\core\utils\config\config-validation.ts - processLayerEntryConfig
// Set default value for clusters on vector layers
// if (layerEntryIsVector(layerConfig) && layerConfig.source!.cluster?.enable) {
//   if (!layerConfig.source!.cluster.settings)
//     layerConfig.source!.cluster.settings = {
//       type: 'simpleSymbol',
//       symbol: 'circle',
//       stroke: { lineStyle: 'solid', width: 1 },
//     };
//   if (!layerConfig.source!.cluster.settings.type) layerConfig.source!.cluster.settings.type = 'simpleSymbol';
//   if (!layerConfig.source!.cluster.settings.symbol) layerConfig.source!.cluster.settings.symbol = 'circle';
//   if (!layerConfig.source!.cluster.settings.stroke) layerConfig.source!.cluster.settings.stroke = {};
//   if (!layerConfig.source!.cluster.settings.stroke.lineStyle)
//     layerConfig.source!.cluster.settings.stroke.lineStyle = 'solid';
//   if (!layerConfig.source!.cluster.settings.stroke.width) layerConfig.source!.cluster.settings.stroke.width = 1;
// }

// packages\geoview-core\src\geo\layer\layer.ts - setLayerZIndices
// const unclusteredLayer =
// api.maps[this.mapId].layer.registeredLayers[`${geoviewLayer.geoviewLayerId}/${subLayer.layerId}-unclustered`];
// if (unclusteredLayer) {
// unclusteredLayer.olLayer?.setZIndex(subLayerZIndex + zIndex);
// }

// packages\geoview-core\src\geo\layer\geoview-layers\abstract-geoview-layers.ts - TypeStyleRepresentation
/** The clusterCanvas property is used when the layer clustering is active (layerConfig.source.cluster.enable = true). */
// clusterCanvas?: HTMLCanvasElement | null;

// packages\geoview-core\src\geo\layer\geoview-layers\abstract-geoview-layers.ts - processListOfLayerEntryConfig
// if (
//   listOfLayerEntryConfig[0].entryType === CONST_LAYER_ENTRY_TYPES.VECTOR &&
//   (listOfLayerEntryConfig[0].source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable
// ) {
//   const unclusteredLayerConfig = cloneDeep(listOfLayerEntryConfig[0]) as TypeVectorLayerEntryConfig;
//   unclusteredLayerConfig.layerId = `${listOfLayerEntryConfig[0].layerId}-unclustered`;
//   unclusteredLayerConfig.source!.cluster!.enable = false;
//   const baseLayer = await this.processOneLayerEntry(unclusteredLayerConfig as TypeBaseLayerEntryConfig);
//   if (baseLayer) {
//     baseLayer!.setVisible(false);
//     unclusteredLayerConfig.registerLayerConfig();
//     this.registerToLayerSets(unclusteredLayerConfig as TypeBaseLayerEntryConfig);
//     if (!layerGroup) layerGroup = this.createLayerGroup(unclusteredLayerConfig.parentLayerConfig as TypeLayerEntryConfig);
//     layerGroup!.getLayers().push(baseLayer!);
//   }
//   (listOfLayerEntryConfig[0].source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//     unclusteredLayerConfig.source!.cluster!.settings;
// }

// if (layerConfig.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR && (layerConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
//   const unclusteredLayerConfig = cloneDeep(layerConfig) as TypeVectorLayerEntryConfig;
//   unclusteredLayerConfig.layerId = `${layerConfig.layerId}-unclustered`;
//   unclusteredLayerConfig.source!.cluster!.enable = false;
//   unclusteredLayerConfig.registerLayerConfig();
//   promiseOfLayerCreated.push(this.processOneLayerEntry(unclusteredLayerConfig as TypeBaseLayerEntryConfig));
//   (layerConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//     unclusteredLayerConfig.source!.cluster!.settings;
// }

// packages\geoview-core\src\geo\layer\geoview-layers\vector\abstract-geoview-vector.ts
// createVectorLayer(
//   layerConfig: TypeVectorLayerEntryConfig,
//   vectorSource: VectorSource<Feature>
// ): VectorLayer<VectorSource> {
//   let configSource: TypeBaseSourceVectorInitialConfig = {};
//   if (layerConfig.source !== undefined) {
//     configSource = layerConfig.source as TypeBaseSourceVectorInitialConfig;
//     if (configSource.cluster === undefined) {
//       configSource.cluster = { enable: false };
//     }
//   } else {
//     configSource = { cluster: { enable: false } };
//   }

//   const layerOptions: VectorLayerOptions<VectorSource> = {
//     properties: { layerConfig },
//     source: configSource.cluster!.enable
//       ? new Cluster({
//           source: vectorSource as VectorSource<Feature>,
//           distance: configSource.cluster!.distance,
//           minDistance: configSource.cluster!.minDistance,
//           geometryFunction: ((feature): Point | null => {
//             const geometryExtent = feature.getGeometry()?.getExtent();
//             if (geometryExtent) {
//               const center = getCenter(geometryExtent) as Coordinate;
//               return new Point(center);
//             }
//             return null;
//           }) as (arg0: Feature) => Point,
//         })
//       : (vectorSource as VectorSource<Feature>),
//     style: (feature) => {
//       const { geoviewRenderer } = api.maps[this.mapId];

//       if (configSource.cluster!.enable) {
//         return geoviewRenderer.getClusterStyle(layerConfig, feature as Feature);
//       }

//       if ('style' in layerConfig) {
//         return geoviewRenderer.getFeatureStyle(feature as Feature, layerConfig);
//       }

//       return undefined;
//     },
//   };

//    ! You must always set the layerConfig.loadEndListenerType before setting the layerConfig.olLayer except when entryType = CONST_LAYER_ENTRY_TYPES.GROUP.
//    layerConfig.loadEndListenerType = 'features';
//   layerConfig.olLayer = new VectorLayer(layerOptions);
//   layerConfig.geoviewLayerInstance = this;

//   if (layerConfig.initialSettings?.extent !== undefined) this.setExtent(layerConfig.initialSettings?.extent, layerPath);
//   if (layerConfig.initialSettings?.maxZoom !== undefined)
//     this.setMaxZoom(layerConfig.initialSettings?.maxZoom, layerPath);
//   if (layerConfig.initialSettings?.minZoom !== undefined)
//     this.setMinZoom(layerConfig.initialSettings?.minZoom, layerPath);
//   if (layerConfig.initialSettings?.opacity !== undefined)
//     this.setOpacity(layerConfig.initialSettings?.opacity, layerPath);
//   if (layerConfig.initialSettings?.visible !== undefined)
//     this.setVisible(layerConfig.initialSettings?.visible !== 'no', layerPath);

//   return layerConfig.olLayer as VectorLayer<VectorSource>;
// }

// applyViewFilter(layerPath?: string, filter = '', CombineLegendFilter = true, checkCluster = true) {
//   layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
//   const layerConfig = this.getLayerConfig(layerPath) as TypeVectorLayerEntryConfig;
//   if (layerConfig) {
//     const layerPath = layerConfig.geoviewLayerConfig
//       ? `${layerConfig.geoviewLayerConfig.geoviewLayerId}/${String(layerConfig.layerId).replace('-unclustered', '')}`
//       : String(layerConfig.layerId).replace('-unclustered', '');
//     const unclusteredLayerPath = `${layerPath}-unclustered`;
//     const cluster = !!api.maps[this.mapId].layer.registeredLayers[unclusteredLayerPath];
//     if (cluster && checkCluster) {
//       return;
//     }

// packages\geoview-core\src\geo\layer\geoview-layers\vector\geopackage.ts - processOneGeopackage
// protected processOneGeopackage(layerConfig: TypeBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null> {
//   const promisedLayers = new Promise<BaseLayer | LayerGroup | null>((resolve) => {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     this.extractGeopackageData(layerConfig).then(([layers, slds]) => {
//       if (layers.length === 1) {
//         if ((layerConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
//           const unclusteredLayerConfig = cloneDeep(layerConfig) as TypeVectorLayerEntryConfig;
//           unclusteredLayerConfig.layerId = `${layerConfig.layerId}-unclustered`;
//           unclusteredLayerConfig.source!.cluster!.enable = false;

//           this.processOneGeopackageLayer(unclusteredLayerConfig as TypeBaseLayerEntryConfig, layers[0], slds).then((baseLayer) => {
//             if (baseLayer) {
//               baseLayer.setVisible(false);
//               if (!layerGroup) layerGroup = this.createLayerGroup(unclusteredLayerConfig.parentLayerConfig as TypeLayerEntryConfig);
//               layerGroup.getLayers().push(baseLayer);
//               layerConfig.layerStatus = 'processed';
//             }
//           });

//           (layerConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//             unclusteredLayerConfig.source!.cluster!.settings;
//         }

//         this.processOneGeopackageLayer(layerConfig, layers[0], slds).then((baseLayer) => {
//           if (baseLayer) {
//             layerConfig.layerStatus = 'processed';
//             if (layerGroup) layerGroup.getLayers().push(baseLayer);
//             resolve(layerGroup || baseLayer);
//           } else {
//             this.layerLoadError.push({
//               layer: layerConfig.layerPath,
//               loggerMessage: `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`,
//             });
//             layerConfig.layerStatus = 'error';
//             resolve(null);
//           }
//         });
//       } else {
//         layerConfig.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;
//         (layerConfig as TypeLayerEntryConfig).listOfLayerEntryConfig = [];
//         const newLayerGroup = this.createLayerGroup(layerConfig);
//         for (let i = 0; i < layers.length; i++) {
//           const newLayerEntryConfig = cloneDeep(layerConfig) as TypeBaseLayerEntryConfig;
//           newLayerEntryConfig.layerId = layers[i].name;
//           newLayerEntryConfig.layerName =  createLocalizedString(layers[i].name);
//           newLayerEntryConfig.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
//           newLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerConfig);
//           if ((newLayerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
//             const unclusteredLayerConfig = cloneDeep(newLayerEntryConfig) as TypeVectorLayerEntryConfig;
//             unclusteredLayerConfig.layerId = `${layerConfig.layerId}-unclustered`;
//             unclusteredLayerConfig.source!.cluster!.enable = false;

//             this.processOneGeopackageLayer(unclusteredLayerConfig as TypeBaseLayerEntryConfig, layers[0], slds).then((baseLayer) => {
//               if (baseLayer) {
//                 baseLayer.setVisible(false);
//                 newLayerGroup.getLayers().push(baseLayer);
//                 newLayerEntryConfig.layerStatus = 'processed';
//               }
//             });

//             (newLayerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//               unclusteredLayerConfig.source!.cluster!.settings;
//           }

//           this.processOneGeopackageLayer(newLayerEntryConfig, layers[i], slds).then((baseLayer) => {
//             if (baseLayer) {
//               (layerConfig as unknown as TypeLayerGroupEntryConfig).listOfLayerEntryConfig!.push(newLayerEntryConfig);
//               newLayerGroup.getLayers().push(baseLayer);
//               newLayerEntryConfig.layerStatus = 'processed';
//             } else {
//               this.layerLoadError.push({
//                 layer: layerConfig.layerPath,
//                 loggerMessage: `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`,
//               });
//               newLayerEntryConfig.layerStatus = 'error';
//               resolve(null);
//             }
//           });
//         }
//         resolve(newLayerGroup);
//       }
//     });
//   });
//   return promisedLayers;
// }

// packages\geoview-core\src\geo\map\map-schema-types.ts
/** ******************************************************************************************************************************
 * Type used to configure the cluster feature of a vector layer. Works out of the box with point geometries. If another geometry is
 * provided, it will be converted to points geometry.
 */
// export type TypeSourceVectorClusterConfig = {
//   /** Flag used to enable clustering. Default = false. */
//   enable: boolean;
//   /** Distance in pixels within which features will be clustered together (default 20px). */
//   distance?: number;
//   /** Minimum distance in pixels between clusters. Will be capped at the configured distance. By default no minimum distance is
//    * guaranteed. This config can be used to avoid overlapping icons. As a tradoff, the cluster feature's position will no longer
//    * be the center of all its features.
//    */
//   minDistance?: number;
//   /** Zoom level at which all clusters will split. Default = 7. */
//   splitZoom?: number;
//   /** Color for the text showing the number of points in a cluster */
//   textColor?: string;
//   /** settings for the cluster symbol and clustered geometries */
//   settings?: TypeSimpleSymbolVectorConfig;
// };

// packages\geoview-core\src\geo\map\map-schema-types.ts - TypeBaseSourceVectorInitialConfig
/** Vector source clustering configuration. */
// cluster?: TypeSourceVectorClusterConfig;

// packages\geoview-core\src\geo\map\map-schema-types.ts - TypeVectorSourceInitialConfig
/** Vector source clustering configuration. */
// cluster?: TypeSourceVectorClusterConfig;

// packages\geoview-core\src\geo\renderer\geoview-renderer.ts
// async getLegendStyles(
//   layerConfig: TypeBaseLayerEntryConfig & {
//     style: TypeStyleConfig;
//   }
// ): Promise<TypeVectorLayerStyles> {
//   try {
//     const styleConfig: TypeStyleConfig = layerConfig.style;
//     if (!styleConfig) return {};

//     const clusterCanvas =
//       layerEntryIsVector(layerConfig) && (layerConfig.source as TypeBaseSourceVectorInitialConfig).cluster?.enable
//         ? this.createPointCanvas(this.getClusterStyle(layerConfig))
//         : undefined;

//     if (styleConfig.Point) {
//       // ======================================================================================================================
//       // Point style configuration ============================================================================================
//       if (isSimpleStyleConfig(styleConfig.Point)) {
//         const layerStyles = await this.getPointStyleSubRoutine(styleConfig.Point.settings);
//         layerStyles.Point!.clusterCanvas = clusterCanvas;
//         return layerStyles;
//       }

//       if (isUniqueValueStyleConfig(styleConfig.Point)) {
//         const layerStyles = await this.getPointStyleSubRoutine(
//           styleConfig.Point.defaultSettings,
//           (styleConfig.Point as TypeUniqueValueStyleConfig).uniqueValueStyleInfo
//         );
//         layerStyles.Point!.clusterCanvas = clusterCanvas;
//         return layerStyles;
//       }

//       if (isClassBreakStyleConfig(styleConfig.Point)) {
//         const layerStyles = await this.getPointStyleSubRoutine(
//           styleConfig.Point.defaultSettings,
//           (styleConfig.Point as TypeClassBreakStyleConfig).classBreakStyleInfo
//         );
//         layerStyles.Point!.clusterCanvas = clusterCanvas;
//         return layerStyles;
//       }
//     }

// getFeatureCanvas(
//   feature: Feature,
//   layerConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
// ): Promise<HTMLCanvasElement | undefined> {
//   const promisedCanvas = new Promise<HTMLCanvasElement | undefined>((resolve) => {
//     const geometryType = getGeometryType(feature);
//     const { style, source } = layerConfig as TypeVectorLayerEntryConfig;
//     // Get the style accordingly to its type and geometry.
//     if (style![geometryType] !== undefined) {
//       const styleSettings = style![geometryType]!;
//       const { styleType } = styleSettings;
//       const featureStyle = source?.cluster?.enable
//         ? this.getClusterStyle(layerConfig as TypeVectorLayerEntryConfig, feature)
//         : this.processStyle[styleType][geometryType].call(
//             this,
//             styleSettings,
//             feature,
//             layerConfig.olLayer!.get('filterEquation'),
//             layerConfig.olLayer!.get('legendFilterIsOff')
//           );
//       if (featureStyle) {
//         if (geometryType === 'Point') {
//           if (
//             (isSimpleStyleConfig(styleSettings) && isSimpleSymbolVectorConfig((styleSettings as TypeSimpleStyleConfig).settings)) ||
//             (isUniqueValueStyleConfig(styleSettings) &&
//               isSimpleSymbolVectorConfig((styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[0].settings)) ||
//             (isClassBreakStyleConfig(styleSettings) &&
//               isSimpleSymbolVectorConfig((styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfo[0].settings)) ||
//             (layerConfig.source as TypeBaseSourceVectorInitialConfig).cluster?.enable
//           )
//             resolve(this.createPointCanvas(featureStyle));
//           else
//             this.createIconCanvas(featureStyle).then((canvas) => {
//               resolve(canvas || undefined);
//             });
//         } else if (geometryType === 'LineString') resolve(this.createLineStringCanvas(featureStyle));
//         else resolve(this.createPolygonCanvas(featureStyle));
//       } else resolve(undefined);
//     } else resolve(undefined);
//   });
//   return promisedCanvas;
// }

/** ***************************************************************************************************************************
 * This method gets the style of the cluster feature using the layer entry config. If the style does not exist, create it using
 * the default style strategy.
 *
 * @param {TypeBaseLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer entry config that may have a style
 * configuration for the feature. If style does not exist for the geometryType, create it.
 * @param {Feature} feature The feature that need its style to be defined. When undefined, it's because we fetch the styles
 * for the legend.
 *
 * @returns {Style | undefined} The style applied to the feature or undefined if not found.
 */
// getClusterStyle(layerConfig: TypeVectorLayerEntryConfig, feature?: Feature): Style | undefined {
//   const configSource = layerConfig.source as TypeBaseSourceVectorInitialConfig;
//   if (!configSource.cluster?.textColor) configSource.cluster!.textColor = '';

//   const clusterSize = feature?.get('features')
//     ? (feature!.get('features') as Array<Feature>).reduce((numberOfFeatures, featureToTest) => {
//         const geometryType = featureToTest.getGeometry()?.getType();
//         if (geometryType === 'MultiPoint') return numberOfFeatures + (featureToTest.getGeometry() as MultiPoint).getPoints().length;
//         if (geometryType === 'MultiLineString')
//           return numberOfFeatures + (featureToTest.getGeometry() as MultiLineString).getLineStrings().length;
//         if (geometryType === 'MultiPolygon') return numberOfFeatures + (featureToTest.getGeometry() as MultiPolygon).getPolygons().length;
//         return numberOfFeatures + 1;
//       }, 0)
//     : 0;

//   // Get the cluster point style to use when the features are clustered.
//   if (feature === undefined || clusterSize > 1) {
//     const styleSettings = layerConfig.source!.cluster!.settings!;
//     if (!styleSettings.color || !styleSettings.stroke?.color) {
//       const { style } = layerConfig;
//       let geoColor: string | null = null;
//       const geoStyle = style?.Point || style?.Polygon || style?.LineString || null;
//       if (geoStyle) {
//         const geoStyleSettings = (isSimpleStyleConfig(geoStyle) ? geoStyle.settings : geoStyle) as TypeSimpleSymbolVectorConfig;
//         geoColor = geoStyleSettings.stroke?.color || null;
//       }
//       const color = geoColor ? asString(setAlphaColor(asArray(geoColor), 0.45)) : this.getDefaultColor(0.45);
//       const strokeColor = geoColor || this.getDefaultColorAndIncrementIndex(1);
//       if (!styleSettings.color) styleSettings.color = color;
//       if (!styleSettings.stroke) styleSettings.stroke = {};
//       if (!styleSettings.stroke.color) styleSettings.stroke.color = strokeColor;
//     }

//     const pointStyle = this.processClusterSymbol(layerConfig, feature);
//     if (pointStyle!.getText()!.getText() !== '1') return pointStyle;
//     let styleFound: Style | undefined;
//     const theUniqueVisibleFeature = (feature!.get('features') as Array<Feature>).find((featureToTest) => {
//       styleFound = this.getFeatureStyle(featureToTest, layerConfig);
//       return styleFound;
//     });
//     return styleFound;
//   }

//   // When there is only a single feature left, use that features original geometry
//   if (clusterSize < 2) {
//     const originalFeature = clusterSize ? feature!.get('features')[0] : feature;

//     // If style does not exist for the geometryType, getFeatureStyle will create it.
//     return this.getFeatureStyle(originalFeature, layerConfig);
//   }

//   return undefined;
// }

/** ***************************************************************************************************************************
 * Process a cluster circle symbol using the settings.
 *
 * @param {TypeBaseLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer configuration.
 * @param {Feature} feature The feature that need its style to be defined. When undefined, it's because we fetch the styles
 * for the legend.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
// private processClusterSymbol(layerConfig: TypeVectorLayerEntryConfig, feature?: Feature): Style | undefined {
//   const { settings } = layerConfig.source!.cluster!;
//   const fillOptions: FillOptions = { color: settings!.color };
//   const strokeOptions: StrokeOptions = this.createStrokeOptions(settings!);
//   const circleOptions: CircleOptions = { radius: settings!.size !== undefined ? settings!.size + 10 : 14 };
//   circleOptions.stroke = new Stroke(strokeOptions);
//   circleOptions.fill = new Fill(fillOptions);
//   if (settings!.offset !== undefined) circleOptions.displacement = settings!.offset;
//   if (settings!.rotation !== undefined) circleOptions.rotation = settings!.rotation;
//   const text = feature
//     ? (feature.get('features') as Array<Feature>)
//         .reduce((numberOfVisibleFeature, featureToTest) => {
//           if (this.getFeatureStyle(featureToTest, layerConfig)) {
//             const geometryType = featureToTest.getGeometry()?.getType();
//             let numberOfEmbededFeatures = 1;
//             if (geometryType === 'MultiPoint') numberOfEmbededFeatures = (featureToTest.getGeometry() as MultiPoint).getPoints().length;
//             else if (geometryType === 'MultiLineString')
//               numberOfEmbededFeatures = (featureToTest.getGeometry() as MultiLineString).getLineStrings().length;
//             else if (geometryType === 'MultiPolygon')
//               numberOfEmbededFeatures = (featureToTest.getGeometry() as MultiPolygon).getPolygons().length;
//             return numberOfVisibleFeature + numberOfEmbededFeatures;
//           }
//           return numberOfVisibleFeature;
//         }, 0)
//         .toString()
//     : 'num';
//   if (text === '0') return undefined;
//   const textOptions: TextOptions = { text, font: '12px sans-serif' };
//   const textFillOptions: FillOptions = {
//     color: layerConfig.source?.cluster?.textColor !== '' ? layerConfig.source!.cluster!.textColor : '#fff',
//   };
//   textOptions.fill = new Fill(textFillOptions);
//   const textStrokeOptions: StrokeOptions = { color: '#000', width: 2 };
//   textOptions.stroke = new Stroke(textStrokeOptions);
//   return new Style({
//     image: new StyleCircle(circleOptions),
//     text: new Text(textOptions),
//   });
// }

// private createDefaultStyle(
//   geometryType: TypeStyleGeometry,
//   layerConfig: TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
// ): TypeStyleConfig | undefined {
//   if (layerConfig.style === undefined) layerConfig.style = {};
//   const styleId = `${this.mapId}/${layerConfig.layerPath}`;
//   let label = getLocalizedValue(layerConfig.layerName, this.mapId);
//   label = label !== undefined ? label : styleId;
//   if (geometryType === 'Point') {
//     const settings: TypeSimpleSymbolVectorConfig = {
//       type: 'simpleSymbol',
//       color: layerConfig.source?.cluster?.settings?.color || this.getDefaultColor(0.25),
//       stroke: {
//         color: layerConfig.source?.cluster?.settings?.stroke?.color || this.getDefaultColorAndIncrementIndex(1),
//         lineStyle: 'solid',
//         width: 1,
//       },
//       symbol: 'circle',
//     };
//     const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
//     layerConfig.style[geometryType] = styleSettings;
//     return layerConfig.style;
//   }
//   if (geometryType === 'LineString') {
//     const settings: TypeLineStringVectorConfig = {
//       type: 'lineString',
//       stroke: { color: layerConfig.source?.cluster?.settings?.stroke?.color || this.getDefaultColorAndIncrementIndex(1) },
//     };
//     const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
//     layerConfig.style[geometryType] = styleSettings;
//     return layerConfig.style;
//   }
//   if (geometryType === 'Polygon') {
//     const settings: TypePolygonVectorConfig = {
//       type: 'filledPolygon',
//       color: layerConfig.source?.cluster?.settings?.color || this.getDefaultColor(0.25),
//       stroke: { color: layerConfig.source?.cluster?.settings?.stroke?.color || this.getDefaultColorAndIncrementIndex(1) },
//       fillStyle: 'solid',
//     };
//     const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
//     layerConfig.style[geometryType] = styleSettings;
//     return layerConfig.style;
//   }
//   logger.logError(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
//   return undefined;
// }

// packages\geoview-core\public\css\cluster-marker-style.css
/*
 * This section is use to hold styles relative to marker cluster
 */
// .marker-cluster-full.hole {
//   content: '';
//   position: absolute;
//   width: 30px;
//   height: 30px;
//   margin: -15px 0 0 -15px;
//   background: rgb(147, 222, 111);
//   border: 1px solid rgb(52, 104, 32);
//   transform: rotate(45deg);
//   transform: skewY(-25deg);
//   border-radius: 50%;
//   left: 50%;
//   top: 50%;
// }

// .marker-cluster-full.fill {
//   position: absolute;
//   width: 40px;
//   height: 40px;
//   margin: -20px 0 0 -20px;
//   background: rgb(28, 169, 25);
//   border: 1px solid rgb(59, 89, 44);
//   border-radius: 50% 50% 50% 0;
//   transform: rotate(-45deg);
//   transform: skewY(-25deg);
//   left: 50%;
//   top: 50%;
// }

// .marker-cluster-empty.hole {
//   content: '';
//   position: absolute;
//   width: 30px;
//   height: 30px;
//   margin: -15px 0 0 -15px;
//   background: rgb(255, 255, 255);
//   border: 1px solid rgb(59, 89, 44);
//   transform: rotate(45deg);
//   transform: skewY(-25deg);
//   border-radius: 50%;
//   left: 50%;
//   top: 50%;
// }

// .marker-cluster-empty.fill {
//   position: absolute;
//   width: 40px;
//   height: 40px;
//   margin: -20px 0 0 -20px;
//   background: rgb(46, 113, 203);
//   border: 1px solid rgb(25, 25, 110);
//   border-radius: 50% 50% 50% 0;
//   transform: rotate(-45deg);
//   transform: skewY(-25deg);
//   left: 50%;
//   top: 50%;
// }

// .marker-cluster-part.hole {
//   content: '';
//   position: absolute;
//   width: 30px;
//   height: 30px;
//   margin: -15px 0 0 -15px;
//   background: rgb(147, 222, 111);
//   border: 1px solid rgb(104, 52, 32);
//   transform: rotate(45deg);
//   transform: skewY(-25deg);
//   border-radius: 50%;
//   left: 50%;
//   top: 50%;
// }

// .marker-cluster-part.fill {
//   position: absolute;
//   width: 40px;
//   height: 40px;
//   margin: -20px 0 0 -20px;
//   background: rgb(46, 113, 203);
//   border: 1px solid rgb(25, 25, 110);
//   border-radius: 50% 50% 50% 0;
//   transform: rotate(-45deg);
//   transform: skewY(-25deg);
//   left: 50%;
//   top: 50%;
// }

// .marker-green.hole {
//   content: '';
//   position: absolute;
//   width: 10px;
//   height: 10px;
//   margin: -5px 0 0 -5px;
//   background: rgb(147, 222, 111);
//   border: 1px solid rgb(59, 89, 44);
//   transform: rotate(45deg);
//   border-radius: 50%;
//   left: 50%;
//   top: 50%;
// }

// .marker-green.fill {
//   position: absolute;
//   width: 20px;
//   height: 20px;
//   margin: -10px 0 0 -10px;
//   background: rgb(28, 169, 25);
//   border: 1px solid rgb(59, 89, 44);
//   border-radius: 50% 50% 50% 0;
//   transform: rotate(-45deg);
//   transform: skewY(-25deg);
//   left: 50%;
//   top: 50%;
// }

// .marker-blue.hole {
//   content: '';
//   position: absolute;
//   width: 10px;
//   height: 10px;
//   margin: -5px 0 0 -5px;
//   background: rgb(255, 255, 255);
//   border: 1px solid rgb(25, 55, 110);
//   transform: rotate(45deg);
//   border-radius: 50%;
//   left: 50%;
//   top: 50%;
// }

// .marker-blue.fill {
//   position: absolute;
//   width: 20px;
//   height: 20px;
//   margin: -10px 0 0 -10px;
//   background: rgb(46, 113, 203);
//   border: 1px solid rgb(25, 55, 110);
//   border-radius: 50% 50% 50% 0;
//   transform: rotate(-45deg);
//   transform: skewY(-25deg);
//   left: 50%;
//   top: 50%;
// }

// .cluster-div-icon-text {
//   position: absolute;
//   text-align: center;
//   width: 30px;
//   height: 30px;
//   margin: -8px 0 0 -15px;
//   font-size: 9px;
// }

// .div-icon.blinking-icon-enabled div.hole {
//   animation: blinking-hole 1s ease-in infinite;
// }
// @keyframes blinking-hole {
//   0% {
//     background: rgb(0, 0, 0);
//     border: 1px solid rgb(255, 255, 255);
//   }
//   50% {
//     background: rgb(255, 255, 255);
//     border: 1px solid rgb(0, 0, 0);
//   }
//   100% {
//     background: rgb(0, 0, 0);
//     border: 1px solid rgb(255, 255, 255);
//   }
// }

// .cluster-div-icon.blinking-icon-enabled b.cluster-text {
//   animation: blinking-text 1s ease-in infinite;
// }
// @keyframes blinking-text {
//   0% {
//     color: rgb(0, 0, 0);
//   }
//   50% {
//     color: rgb(255, 255, 255);
//   }
//   100% {
//     color: rgb(0, 0, 0);
//   }
// }

// .cluster-div-icon.spiderfied-marker {
//   z-index: 0 !important;
// }

// .cluster-div-icon:not(:hover) {
//   z-index: 0 !important;
// }

// .div-icon:not(:hover) {
//   z-index: 1 !important;
// }

export {};

// src/core/components/map/map.tsx
// TODO: do not deal with stuff not related to create the payload in the event, use the event on or store state to listen to change and do what is needed.
// !This was in mapZoomEnd event.... listen to the event in proper place
// Object.keys(layers).forEach((layer) => {
//   if (layer.endsWith('-unclustered')) {
//     const clusterLayerId = layer.replace('-unclustered', '');
//     const splitZoom =
//       (api.maps[mapId].layer.registeredLayers[clusterLayerId].source as TypeVectorSourceInitialConfig)!.cluster!.splitZoom || 7;
//     if (prevZoom < splitZoom && currentZoom >= splitZoom) {
//       api.maps[mapId].layer.registeredLayers[clusterLayerId]?.olLayer!.setVisible(false);
//       api.maps[mapId].layer.registeredLayers[layer]?.olLayer!.setVisible(true);
//     }
//     if (prevZoom >= splitZoom && currentZoom < splitZoom) {
//       api.maps[mapId].layer.registeredLayers[clusterLayerId]?.olLayer!.setVisible(true);
//       api.maps[mapId].layer.registeredLayers[layer]?.olLayer!.setVisible(false);
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
//                 "en": "./geojson/"
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
//                 "en": "./geojson/"
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
//   "theme": "dark",
//   "components": [],
//   "corePackages": ["layers-panel"],
//   "suportedLanguages": ["en"]
// }

// packages\geoview-core\src\core\utils\config\config-validation.ts - processLayerEntryConfig
// Set default value for clusters on vector layers
// if (layerEntryIsVector(layerEntryConfig) && layerEntryConfig.source!.cluster?.enable) {
//   if (!layerEntryConfig.source!.cluster.settings)
//     layerEntryConfig.source!.cluster.settings = {
//       type: 'simpleSymbol',
//       symbol: 'circle',
//       stroke: { lineStyle: 'solid', width: 1 },
//     };
//   if (!layerEntryConfig.source!.cluster.settings.type) layerEntryConfig.source!.cluster.settings.type = 'simpleSymbol';
//   if (!layerEntryConfig.source!.cluster.settings.symbol) layerEntryConfig.source!.cluster.settings.symbol = 'circle';
//   if (!layerEntryConfig.source!.cluster.settings.stroke) layerEntryConfig.source!.cluster.settings.stroke = {};
//   if (!layerEntryConfig.source!.cluster.settings.stroke.lineStyle)
//     layerEntryConfig.source!.cluster.settings.stroke.lineStyle = 'solid';
//   if (!layerEntryConfig.source!.cluster.settings.stroke.width) layerEntryConfig.source!.cluster.settings.stroke.width = 1;
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
//   listOfLayerEntryConfig[0].entryType === 'vector' &&
//   (listOfLayerEntryConfig[0].source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable
// ) {
//   const unclusteredLayerConfig = cloneDeep(listOfLayerEntryConfig[0]) as TypeVectorLayerEntryConfig;
//   unclusteredLayerConfig.layerId = `${listOfLayerEntryConfig[0].layerId}-unclustered`;
//   unclusteredLayerConfig.source!.cluster!.enable = false;
//   const baseLayer = await this.processOneLayerEntry(unclusteredLayerConfig as TypeBaseLayerEntryConfig);
//   if (baseLayer) {
//     baseLayer!.setVisible(false);
//     api.maps[this.mapId].layer.registerLayerConfig(unclusteredLayerConfig);
//     this.registerToLayerSets(unclusteredLayerConfig as TypeBaseLayerEntryConfig);
//     if (!layerGroup) layerGroup = this.createLayerGroup(unclusteredLayerConfig.parentLayerConfig as TypeLayerEntryConfig);
//     layerGroup!.getLayers().push(baseLayer!);
//   }
//   (listOfLayerEntryConfig[0].source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//     unclusteredLayerConfig.source!.cluster!.settings;
// }

// if (layerEntryConfig.entryType === 'vector' && (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
//   const unclusteredLayerConfig = cloneDeep(layerEntryConfig) as TypeVectorLayerEntryConfig;
//   unclusteredLayerConfig.layerId = `${layerEntryConfig.layerId}-unclustered`;
//   unclusteredLayerConfig.source!.cluster!.enable = false;
//   api.maps[this.mapId].layer.registerLayerConfig(unclusteredLayerConfig);
//   promiseOfLayerCreated.push(this.processOneLayerEntry(unclusteredLayerConfig as TypeBaseLayerEntryConfig));
//   (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//     unclusteredLayerConfig.source!.cluster!.settings;
// }

// packages\geoview-core\src\geo\layer\geoview-layers\vector\abstract-geoview-vector.ts
// createVectorLayer(
//   layerEntryConfig: TypeVectorLayerEntryConfig,
//   vectorSource: VectorSource<Feature<Geometry>>
// ): VectorLayer<VectorSource> {
//   layerEntryConfig.layerPhase = 'createVectorLayer';
//   let configSource: TypeBaseSourceVectorInitialConfig = {};
//   if (layerEntryConfig.source !== undefined) {
//     configSource = layerEntryConfig.source as TypeBaseSourceVectorInitialConfig;
//     if (configSource.cluster === undefined) {
//       configSource.cluster = { enable: false };
//     }
//   } else {
//     configSource = { cluster: { enable: false } };
//   }

//   const layerOptions: VectorLayerOptions<VectorSource> = {
//     properties: { layerEntryConfig },
//     source: configSource.cluster!.enable
//       ? new Cluster({
//           source: vectorSource as VectorSource<Feature<Geometry>>,
//           distance: configSource.cluster!.distance,
//           minDistance: configSource.cluster!.minDistance,
//           geometryFunction: ((feature): Point | null => {
//             const geometryExtent = feature.getGeometry()?.getExtent();
//             if (geometryExtent) {
//               const center = getCenter(geometryExtent) as Coordinate;
//               return new Point(center);
//             }
//             return null;
//           }) as (arg0: Feature<Geometry>) => Point,
//         })
//       : (vectorSource as VectorSource<Feature<Geometry>>),
//     style: (feature) => {
//       const { geoviewRenderer } = api.maps[this.mapId];

//       if (configSource.cluster!.enable) {
//         return geoviewRenderer.getClusterStyle(layerEntryConfig, feature as Feature<Geometry>);
//       }

//       if ('style' in layerEntryConfig) {
//         return geoviewRenderer.getFeatureStyle(feature as Feature<Geometry>, layerEntryConfig);
//       }

//       return undefined;
//     },
//   };

//   layerEntryConfig.olLayer = new VectorLayer(layerOptions);

//   if (layerEntryConfig.initialSettings?.extent !== undefined) this.setExtent(layerEntryConfig.initialSettings?.extent, layerEntryConfig);
//   if (layerEntryConfig.initialSettings?.maxZoom !== undefined)
//     this.setMaxZoom(layerEntryConfig.initialSettings?.maxZoom, layerEntryConfig);
//   if (layerEntryConfig.initialSettings?.minZoom !== undefined)
//     this.setMinZoom(layerEntryConfig.initialSettings?.minZoom, layerEntryConfig);
//   if (layerEntryConfig.initialSettings?.opacity !== undefined)
//     this.setOpacity(layerEntryConfig.initialSettings?.opacity, layerEntryConfig);
//   if (layerEntryConfig.initialSettings?.visible !== undefined)
//     this.setVisible(
//       !!(layerEntryConfig.initialSettings?.visible === 'yes' || layerEntryConfig.initialSettings?.visible === 'always'),
//       layerEntryConfig
//     );
//   this.applyViewFilter(layerEntryConfig, layerEntryConfig.layerFilter ? layerEntryConfig.layerFilter : '');

//   return layerEntryConfig.olLayer as VectorLayer<VectorSource>;
// }

// applyViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig, filter = '', CombineLegendFilter = true, checkCluster = true) {
//   const layerEntryConfig = (
//     typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
//   ) as TypeVectorLayerEntryConfig;
//   if (layerEntryConfig) {
//     const layerPath = layerEntryConfig.geoviewRootLayer
//       ? `${layerEntryConfig.geoviewRootLayer.geoviewLayerId}/${String(layerEntryConfig.layerId).replace('-unclustered', '')}`
//       : String(layerEntryConfig.layerId).replace('-unclustered', '');
//     const unclusteredLayerPath = `${layerPath}-unclustered`;
//     const cluster = !!api.maps[this.mapId].layer.registeredLayers[unclusteredLayerPath];
//     if (cluster && checkCluster) {
//       this.applyViewFilter(
//         api.maps[this.mapId].layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig,
//         filter,
//         CombineLegendFilter,
//         false
//       );
//       this.applyViewFilter(
//         api.maps[this.mapId].layer.registeredLayers[unclusteredLayerPath] as TypeVectorLayerEntryConfig,
//         filter,
//         CombineLegendFilter,
//         false
//       );
//       return;
//     }

// packages\geoview-core\src\geo\layer\geoview-layers\vector\geopackage.ts - processOneGeopackage
// protected processOneGeopackage(layerEntryConfig: TypeBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null> {
//   const promisedLayers = new Promise<BaseLayer | LayerGroup | null>((resolve) => {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     this.extractGeopackageData(layerEntryConfig).then(([layers, slds]) => {
//       if (layers.length === 1) {
//         if ((layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
//           const unclusteredLayerConfig = cloneDeep(layerEntryConfig) as TypeVectorLayerEntryConfig;
//           unclusteredLayerConfig.layerId = `${layerEntryConfig.layerId}-unclustered`;
//           unclusteredLayerConfig.source!.cluster!.enable = false;

//           this.processOneGeopackageLayer(unclusteredLayerConfig as TypeBaseLayerEntryConfig, layers[0], slds).then((baseLayer) => {
//             if (baseLayer) {
//               baseLayer.setVisible(false);
//               if (!layerGroup) layerGroup = this.createLayerGroup(unclusteredLayerConfig.parentLayerConfig as TypeLayerEntryConfig);
//               layerGroup.getLayers().push(baseLayer);
//               this.changeLayerStatus('processed', unclusteredLayerConfig);
//             }
//           });

//           (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//             unclusteredLayerConfig.source!.cluster!.settings;
//         }

//         this.processOneGeopackageLayer(layerEntryConfig, layers[0], slds).then((baseLayer) => {
//           if (baseLayer) {
//             this.changeLayerStatus('processed', layerEntryConfig);
//             if (layerGroup) layerGroup.getLayers().push(baseLayer);
//             resolve(layerGroup || baseLayer);
//           } else {
//             this.layerLoadError.push({
//               layer: Layer.getLayerPath(layerEntryConfig),
//               consoleMessage: `Unable to create layer ${Layer.getLayerPath(layerEntryConfig)} on map ${this.mapId}`,
//             });
//             this.changeLayerStatus('error', layerEntryConfig);
//             resolve(null);
//           }
//         });
//       } else {
//         layerEntryConfig.entryType = 'group';
//         (layerEntryConfig as TypeLayerEntryConfig).listOfLayerEntryConfig = [];
//         const newLayerGroup = this.createLayerGroup(layerEntryConfig);
//         for (let i = 0; i < layers.length; i++) {
//           const newLayerEntryConfig = cloneDeep(layerEntryConfig) as TypeBaseLayerEntryConfig;
//           newLayerEntryConfig.layerId = layers[i].name;
//           newLayerEntryConfig.layerName = { en: layers[i].name, fr: layers[i].name };
//           newLayerEntryConfig.entryType = 'vector';
//           newLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
//           if ((newLayerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
//             const unclusteredLayerConfig = cloneDeep(newLayerEntryConfig) as TypeVectorLayerEntryConfig;
//             unclusteredLayerConfig.layerId = `${layerEntryConfig.layerId}-unclustered`;
//             unclusteredLayerConfig.source!.cluster!.enable = false;

//             this.processOneGeopackageLayer(unclusteredLayerConfig as TypeBaseLayerEntryConfig, layers[0], slds).then((baseLayer) => {
//               if (baseLayer) {
//                 baseLayer.setVisible(false);
//                 newLayerGroup.getLayers().push(baseLayer);
//                 this.changeLayerStatus('processed', unclusteredLayerConfig);
//               }
//             });

//             (newLayerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
//               unclusteredLayerConfig.source!.cluster!.settings;
//           }

//           this.processOneGeopackageLayer(newLayerEntryConfig, layers[i], slds).then((baseLayer) => {
//             if (baseLayer) {
//               (layerEntryConfig as unknown as TypeLayerGroupEntryConfig).listOfLayerEntryConfig!.push(newLayerEntryConfig);
//               newLayerGroup.getLayers().push(baseLayer);
//               this.changeLayerStatus('processed', newLayerEntryConfig);
//             } else {
//               this.layerLoadError.push({
//                 layer: Layer.getLayerPath(layerEntryConfig),
//                 consoleMessage: `Unable to create layer ${Layer.getLayerPath(layerEntryConfig)} on map ${this.mapId}`,
//               });
//               this.changeLayerStatus('error', newLayerEntryConfig);
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
//   layerEntryConfig: TypeBaseLayerEntryConfig & {
//     style: TypeStyleConfig;
//   }
// ): Promise<TypeVectorLayerStyles> {
//   try {
//     const styleConfig: TypeStyleConfig = layerEntryConfig.style;
//     if (!styleConfig) return {};

//     const clusterCanvas =
//       layerEntryIsVector(layerEntryConfig) && (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).cluster?.enable
//         ? this.createPointCanvas(this.getClusterStyle(layerEntryConfig))
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
//   feature: Feature<Geometry>,
//   layerEntryConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
// ): Promise<HTMLCanvasElement | undefined> {
//   const promisedCanvas = new Promise<HTMLCanvasElement | undefined>((resolve) => {
//     const geometryType = getGeometryType(feature);
//     const { style, source } = layerEntryConfig as TypeVectorLayerEntryConfig;
//     // Get the style accordingly to its type and geometry.
//     if (style![geometryType] !== undefined) {
//       const styleSettings = style![geometryType]!;
//       const { styleType } = styleSettings;
//       const featureStyle = source?.cluster?.enable
//         ? this.getClusterStyle(layerEntryConfig as TypeVectorLayerEntryConfig, feature)
//         : this.processStyle[styleType][geometryType].call(
//             this,
//             styleSettings,
//             feature,
//             layerEntryConfig.olLayer!.get('filterEquation'),
//             layerEntryConfig.olLayer!.get('legendFilterIsOff')
//           );
//       if (featureStyle) {
//         if (geometryType === 'Point') {
//           if (
//             (isSimpleStyleConfig(styleSettings) && isSimpleSymbolVectorConfig((styleSettings as TypeSimpleStyleConfig).settings)) ||
//             (isUniqueValueStyleConfig(styleSettings) &&
//               isSimpleSymbolVectorConfig((styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[0].settings)) ||
//             (isClassBreakStyleConfig(styleSettings) &&
//               isSimpleSymbolVectorConfig((styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfo[0].settings)) ||
//             (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).cluster?.enable
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
 * @param {TypeBaseLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig The layer entry config that may have a style
 * configuration for the feature. If style does not exist for the geometryType, create it.
 * @param {Feature<Geometry>} feature The feature that need its style to be defined. When undefined, it's because we fetch the styles
 * for the legend.
 *
 * @returns {Style | undefined} The style applied to the feature or undefined if not found.
 */
// getClusterStyle(layerEntryConfig: TypeVectorLayerEntryConfig, feature?: Feature<Geometry>): Style | undefined {
//   const configSource = layerEntryConfig.source as TypeBaseSourceVectorInitialConfig;
//   if (!configSource.cluster?.textColor) configSource.cluster!.textColor = '';

//   const clusterSize = feature?.get('features')
//     ? (feature!.get('features') as Array<Feature<Geometry>>).reduce((numberOfFeatures, featureToTest) => {
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
//     const styleSettings = layerEntryConfig.source!.cluster!.settings!;
//     if (!styleSettings.color || !styleSettings.stroke?.color) {
//       const { style } = layerEntryConfig;
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

//     const pointStyle = this.processClusterSymbol(layerEntryConfig, feature);
//     if (pointStyle!.getText()!.getText() !== '1') return pointStyle;
//     let styleFound: Style | undefined;
//     const theUniqueVisibleFeature = (feature!.get('features') as Array<Feature<Geometry>>).find((featureToTest) => {
//       styleFound = this.getFeatureStyle(featureToTest, layerEntryConfig);
//       return styleFound;
//     });
//     return styleFound;
//   }

//   // When there is only a single feature left, use that features original geometry
//   if (clusterSize < 2) {
//     const originalFeature = clusterSize ? feature!.get('features')[0] : feature;

//     // If style does not exist for the geometryType, getFeatureStyle will create it.
//     return this.getFeatureStyle(originalFeature, layerEntryConfig);
//   }

//   return undefined;
// }

/** ***************************************************************************************************************************
 * Process a cluster circle symbol using the settings.
 *
 * @param {TypeBaseLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig The layer configuration.
 * @param {Feature<Geometry>} feature The feature that need its style to be defined. When undefined, it's because we fetch the styles
 * for the legend.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
// private processClusterSymbol(layerEntryConfig: TypeVectorLayerEntryConfig, feature?: Feature<Geometry>): Style | undefined {
//   const { settings } = layerEntryConfig.source!.cluster!;
//   const fillOptions: FillOptions = { color: settings!.color };
//   const strokeOptions: StrokeOptions = this.createStrokeOptions(settings!);
//   const circleOptions: CircleOptions = { radius: settings!.size !== undefined ? settings!.size + 10 : 14 };
//   circleOptions.stroke = new Stroke(strokeOptions);
//   circleOptions.fill = new Fill(fillOptions);
//   if (settings!.offset !== undefined) circleOptions.displacement = settings!.offset;
//   if (settings!.rotation !== undefined) circleOptions.rotation = settings!.rotation;
//   const text = feature
//     ? (feature.get('features') as Array<Feature<Geometry>>)
//         .reduce((numberOfVisibleFeature, featureToTest) => {
//           if (this.getFeatureStyle(featureToTest, layerEntryConfig)) {
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
//     color: layerEntryConfig.source?.cluster?.textColor !== '' ? layerEntryConfig.source!.cluster!.textColor : '#fff',
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
//   layerEntryConfig: TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
// ): TypeStyleConfig | undefined {
//   if (layerEntryConfig.style === undefined) layerEntryConfig.style = {};
//   const styleId = `${this.mapId}/${Layer.getLayerPath(layerEntryConfig)}`;
//   let label = getLocalizedValue(layerEntryConfig.layerName, this.mapId);
//   label = label !== undefined ? label : styleId;
//   if (geometryType === 'Point') {
//     const settings: TypeSimpleSymbolVectorConfig = {
//       type: 'simpleSymbol',
//       color: layerEntryConfig.source?.cluster?.settings?.color || this.getDefaultColor(0.25),
//       stroke: {
//         color: layerEntryConfig.source?.cluster?.settings?.stroke?.color || this.getDefaultColorAndIncrementIndex(1),
//         lineStyle: 'solid',
//         width: 1,
//       },
//       symbol: 'circle',
//     };
//     const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
//     layerEntryConfig.style[geometryType] = styleSettings;
//     return layerEntryConfig.style;
//   }
//   if (geometryType === 'LineString') {
//     const settings: TypeLineStringVectorConfig = {
//       type: 'lineString',
//       stroke: { color: layerEntryConfig.source?.cluster?.settings?.stroke?.color || this.getDefaultColorAndIncrementIndex(1) },
//     };
//     const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
//     layerEntryConfig.style[geometryType] = styleSettings;
//     return layerEntryConfig.style;
//   }
//   if (geometryType === 'Polygon') {
//     const settings: TypePolygonVectorConfig = {
//       type: 'filledPolygon',
//       color: layerEntryConfig.source?.cluster?.settings?.color || this.getDefaultColor(0.25),
//       stroke: { color: layerEntryConfig.source?.cluster?.settings?.stroke?.color || this.getDefaultColorAndIncrementIndex(1) },
//       fillStyle: 'solid',
//     };
//     const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
//     layerEntryConfig.style[geometryType] = styleSettings;
//     return layerEntryConfig.style;
//   }
//   // eslint-disable-next-line no-console
//   console.log(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
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

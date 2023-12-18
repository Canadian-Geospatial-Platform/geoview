/** The clusterCanvas property is used when the layer clustering is active (layerConfig.source.cluster.enable = true). */
/** ******************************************************************************************************************************
 * Type used to configure the cluster feature of a vector layer. Works out of the box with point geometries. If another geometry is
 * provided, it will be converted to points geometry.
 */
/** Vector source clustering configuration. */
/** Vector source clustering configuration. */
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
/** ***************************************************************************************************************************
 * Process a cluster circle symbol using the settings.
 *
 * @param {TypeBaseLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer configuration.
 * @param {Feature} feature The feature that need its style to be defined. When undefined, it's because we fetch the styles
 * for the legend.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
export {};

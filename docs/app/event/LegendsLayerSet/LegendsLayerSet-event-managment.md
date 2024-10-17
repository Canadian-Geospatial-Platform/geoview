# LegendsLayerSet Class

The `LegendsLayerSet` class is used to create objects that will keep legends associated with layer paths. It uses internally an instance of the `LayerSet` class to keep track of the layers loaded on the map. The property list of the LayerSet remains synchronized with all layer paths on the map at all times. However, the `LayerSet` has a registration condition function that filter out XYZ layers since they do not have an associated legend. If you delete or add a layer to the map, the LayerSet will be updated accordingly. The values associated with layer paths are of one of the following types: `null`, `undefined` or `TypeLegend`. A `null`value means the `getLegend` call did not get the expected legend due to an error. The `undefined`value is used to identify the layer paths that need to return there legend. A value of `TypeLegend` is the layer path legend. The structure of `TypeLegend` is shown below:

``` js
export type TypeLegend = {
  layerPath: string;
  layerName?: TypeLocalizedString;
  type: TypeGeoviewLayerType;
  styleConfig?: TypeStyleConfig;
  legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
};
```

The `layerPath` parameter is used to link the legend to the layer entry configuration in the map. The `layerName` is a bilingual string for display information. The `type` tells us how to handle the legend. The `styleConfig` parameter contains the configuration settings that describe the style of the legend. This can be a simple, a unique value, or a class break configuration. Finally, we have the `legend`, whose null value indicates that it is impossible to get a legend for the layer. When the type is `ogcWms`, the legend is a `HTMLCanvasElement`. Otherwise, it is a `TypeVectorLayerStyles`.
<p>&nbsp;</p>
<p align="center">
  <img src="./draw.io/LegendsLayerSet-class.drawio.svg" />
</p>

The class can be instantiated using the constructor or the create method. At creation time, the constructor instantiates a `LayerSet` object which will send a `LAYER_SET.REQUEST_LAYER_INVENTORY` event using a `mapId/LayerSetId` handler in order to get the list of all the layerPaths existing on the map. Throughout its existence, the `LegendsLayerSet` instance listens, through its `LayerSet` property, to the `LAYER_SET.LAYER_REGISTRATION` events that are emitted when a layer is created/destroyed on the map or in response to the inventory request to update its `ResultSet` property. It also listens to the `GET_LEGENDS.LEGEND_INFO` event. This listener receives the legend information returned by the layer's `getLegend` call and store it in the `LayerSet`. If all the registered layers have their legend information, a `GET_LEGENDS.LEGEND_LAYERSET_UPDATED` event is triggered with a `mapId/LayerSetId` handler.

When the `LegendsLayerSet` is created, a `LAYER_SET.UPDATED` listener is attached to the instance to wait for `LayerSet` modifications. Then, a `GET_LEGENDS.QUERY_LEGEND` event will be emited to all undefined legend of the `LayerSet` to obtain the legends.

The `LAYER_SET.UPDATED` listener will catch layer add/remove applied to the map. If a layer is added, a `GET_LEGENDS.QUERY_LEGEND` event will be emited for it and when all the registered layers have received their legend information, a `GET_LEGENDS.LEGEND_LAYERSET_UPDATED` event is emited using the `mapId/LayerSetId` as handler. The `GET_LEGENDS.LEGEND_LAYERSET_UPDATED` event is also emited when a layer is removed from the map to signal that a legend has been removed.

To see how you can use the `FeatureInfoLayerSet`, you can analyse the code of the following files:
- the constructor of the `DetailsAPI` class defined in [packages/geoview-core/src/core/components/details/details/details-api.ts](../../../../packages/geoview-core/src/core/components/details/details-api.ts#L25) and its `createDetails` function;
__DEPRECATED__
- the `GET_FEATURE_INFO.ALL_QUERIES_DONE` listener in the `DetailsItem` JSX.Element defined in [packages\geoview-details-panel\src\details-item.tsx](../../../../packages/geoview-details-panel/src/details-item.tsx#L43) and the `createDetails` API call near the end of the file;
- the `GET_FEATURE_INFO.ALL_QUERIES_DONE` listener in the `DetailsItem` JSX.Element defined in [packages\geoview-footer-panel\src\details-item.tsx](../../../../packages/geoview-footer-panel/src/details-item.tsx#L40) and the `createDetails` API call near the end of the file.

# LegendsLayerSet State Diagram

The life cycle of the `LegendsLayerSet` starts with the creation of a `LayerSet` object. This means that all the state transitions explained in the [`LayerSet` state diagram](../LayerSet/LayerSet-event-managment.md#layerset-state-diagram) are performed at creation time. To summarize what happens at this time, we must consider two cases:

- The `LegendsLayerSet` is instantiated before the associated map has created its layers and the layers will be added at the time of their creation.
- The `LegendsLayerSet` is instantiated when the associated map already has layers enabled and these will be added as a result of the inventory request made by the `LegendsLayerSet` when it is created.

All map layers added to the `LegendsLayerSet` will fetch their legend, but only when the `LegendsLayerSet` process has been triggered. As long as the `TRIGGER` event is not emitted, the collection of legends is not done.

Let's follow the thread of events for the first case. We create a `LegendsLayerSet`. As a result, a `LayerSet` is instanciated to associate each layer path with its legend. The `REQUEST_LAYER_INVENTORY` event that is thrown at this point in time is done for nothing, because the map does not contain a layer. However, each time a layer is added to the map, a `LAYER_REGISTRATION` event is emited to add its layer path to the `LayerSet`. This action will trigger a `LAYER_SET.UPDATED` event to tell the `LegendsLayerSet` instance that its `LayerSet` has been modified. If the `LegendsLayerSet` has received its `TRIGGER` event, It will react to the Layer_set.updated and request the legend for the newly added layer path. It is the code of the layer path of the GeoView layer instance that will request the legend and when it is obtained, a `LEGEND_INFO` event will be emitted for the layer path of the map. This will update the `LayerSet` and if all legends are fetched, an `LEGEND_LAYERSET_UPDATED` event is emited to signal to all listening object that the legends has changed.

The second case differs from the previous one only in the way the `REQUEST_LAYER_INVENTORY` event is handled. Since layers already exist on the map, they will identify themselves for registration. The rest of the logic is the same.
<p>&nbsp;</p>
<p align="center">
  <img src="./draw.io/LegendsLayerSet-state-diagram.drawio.svg" />
</p>

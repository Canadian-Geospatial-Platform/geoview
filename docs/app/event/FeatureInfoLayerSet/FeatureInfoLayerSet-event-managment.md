# FeatureInfoLayerSet Class

The `FeatureInfoLayerSet` class is used to create objects that will keep query results associated with layer paths. It uses internally an instance of the `LayerSet` class to keep track of the layers loaded on the map. The property list of the LayerSet remains synchronized with all layer paths on the map at all times. However, the `LayerSet` has a registration condition function that filter out all layers that are not queryable as defined in their metadata or configuration. If you delete or add a layer to the map, the `LayerSet` will be updated. The feature information is stored in the `resultSets` property and has a `TypeFeatureInfoResultSets` type which is an object whose properties are layer paths and the values are of one of the following types: `null`, `undefined` or `TypeArrayOfFeatureInfoEntries`. A `null`value means the `getLgetFeatureInfo` call did not get the expected data due to an error. The `undefined`value is used to identify the layer paths that need to return there result set. A value of `TypeArrayOfFeatureInfoEntries` is the layer path result set. The structure of `TypeArrayOfFeatureInfoEntries` is shown below:

```js
export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[];

export type TypeFeatureInfoEntry = {
  featureKey: number,
  geoviewLayerType: TypeGeoviewLayerType,
  extent: Extent,
  geometry: FeatureLike | null,
  featureIcon: HTMLCanvasElement,
  fieldInfo: Partial<Record<string, TypeFieldEntry>>,
  nameField: string | null,
};

export type TypeFieldEntry = {
  fieldKey: number,
  value: unknown,
  dataType: "string" | "date" | "number",
  alias: string,
  domain: null | codedValueType | rangeDomainType,
};
```

The `featureKey` property is a sequence number assigned to the row in the array. The `geoviewLayerType` property identifies the of GeoView layer type that returned the information. The `extent` property is the bounding box for the feature stored in the array row. The `geometry` is the feature object used to draw on the layer. The `featureIcon` is a snippet representation of the feature. Finally, the `fieldInfo` is an object whose properties are the field name as used internally and whose values are records of type `TypeFieldEntry`.

In a field entries, the `fieldKey` property is a sequence number assigned to the field. The `value` property is the actual value assigned to the field. The `dataType` property is the type of the value property. The `alias` is an alternative name for the field. Finally, `domain` is an object used by ESRI layers to describe the domain of values that can be assigned to the field value. When the value of `geoviewLayerType` is `esriDynamic` or `esriFeature`, you can use the `domain` property. Otherwise, you cannot.

<p>&nbsp;</p>
<p align="center">
  <img src="./draw.io/FeatureInfo-class.drawio.svg" />
</p>

The class can be instantiated using the constructor or the create method. At creation time, the constructor instantiates a `LayerSet` object which will send a `LAYER_SET.REQUEST_LAYER_INVENTORY` event using a `mapId/LayerSetId` handler in order to get the list of all the layer paths already placed on the map. Throughout its existence, the `FeatureInfoLayerSet` instance listens, through its LayerSet property, to the `LAYER_SET.LAYER_REGISTRATION` events that are emitted when a layer is created/destroyed on the map or in response to the inventory request to update its `ResultSet` property. It also listens to the `GET_FEATURE_INFO.QUERY_RESULT` event. This listener receives the feature information returned by the layer's `getFeatureInfo` calls and store it in the `LayerSet`. If all the registered layers have their feature information, a `GET_FEATURE_INFO.ALL_QUERIES_DONE` event is triggered with a `mapId/LayerSetId` handler.

When created, the `FeatureInfoLayerSet` start listening for `MAP.EVENT_MAP_SINGLE_CLICK` events. When the user click on the map, a `GET_FEATURE_INFO.QUERY_LAYER` event is thrown to the map with the click position as a payload. This event will trigger the get feature info on the listening layers and when the query result is returned, it is relayed to the `FeatureInfoLayerSet` using a `GET_FEATURE_INFO.QUERY_RESULT` event.

To see how you can use the `FeatureInfoLayerSet`, you can analyse the code of the following files:

- the constructor of the `DetailsAPI` class defined in [packages/geoview-core/src/core/components/details/details/details-api.ts](../../../../packages/geoview-core/src/core/components/details/details-api.ts#L25) and its `createDetails` function;
- the `GET_FEATURE_INFO.ALL_QUERIES_DONE` listener in the `DetailsItem` JSX.Element defined in [packages\geoview-details-panel\src\details-item.tsx](../../../../packages/geoview-details-panel/src/details-item.tsx#L43) and the `createDetails` API call near the end of the file;
- the `GET_FEATURE_INFO.ALL_QUERIES_DONE` listener in the `DetailsItem` JSX.Element defined in [packages\geoview-footer-panel\src\details-item.tsx](../../../../packages/geoview-footer-panel/src/details-item.tsx#L40) and the `createDetails` API call near the end of the file.

# FeatureInfoLayerSet State Diagram

The life cycle of the `FeatureInfoLayerSet` starts with the creation of a `LayerSet` object. This means that all the state transitions explained in the [`LayerSet` state diagram](../LayerSet/LayerSet-event-managment.md#layerset-state-diagram) are performed at creation time. To summarize what happens at this time, we must consider two cases:

- The `FeatureInfoLayerSet` is instantiated before the associated map has created its layers and the layers will be added at the time of their creation.
- The `FeatureInfoLayerSet` is instantiated when the associated map already has layers enabled and these will be added as a result of the inventory request made by the `LegendsLayerSet` when it is created.

All map layers added to the `FeatureInfoLayerSet` will fetch their feature information on user map click.

Let's follow the thread of events for the first case. We create a `FeatureInfoLayerSet`. As a result, a `LayerSet` is instanciated to associate each layer path with its feature info result set array. The `REQUEST_LAYER_INVENTORY` event that is thrown at this point in time is done for nothing, because the map does not contain a layer. However, each time a layer is added to the map, a `LAYER_REGISTRATION` event is emited to add its layer path to the `LayerSet`. This action will trigger a `LAYER_SET.UPDATED` event to tell the `FeatureInfoLayerSet` instance that its `LayerSet` has been modified. It is the code of the layer path of the GeoView layer instance that will request the feature information when the users issue a click on the map and when the query result is obtained, a `QUERY_RESULT` event will be emitted for the layer path of the map. This will update the `LayerSet` and if all feature info array are fetched, an `ALL_QUERIES_DONE` event is emited to signal to all listening object that all feature info layer sets are received.

The second case differs from the previous one only in the way the `REQUEST_LAYER_INVENTORY` event is handled. Since layers already exist on the map, they will identify themselves for registration. The rest of the logic is the same.

<p>&nbsp;</p>
<p align="center">
  <img src="./draw.io/FeatureInfo-state-diagram.drawio.svg" />
</p>

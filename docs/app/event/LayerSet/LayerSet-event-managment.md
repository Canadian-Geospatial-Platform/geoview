# LayerSet class

The `layerSet` class has four properties. The first is the identifier of the map to which it is attached. The second is the `layerSet` identifier used to differentiate the `layerSet` when we have several of them. Then we have the resultSets which will have as many properties as there are layer entries (sometimes named layer path) on the attached map. Finally, there is a registration condition function that will filter out layer entries that we don't want registered in the layerSet.

The class can be instantiated using the constructor or the create method. At creation time, the instance sends a `LAYER_SET.REQUEST_LAYER_INVENTORY` event in order to get the list of all the layerPaths existing on the map. This list is filtered with the registration condition function to keep only the layerPaths of interest. Throughout its existence, the instance listens to the `LAYER_SET.LAYER_REGISTRATION` events which are emitted when a layer is created/destroyed on the map or in response to an inventory request.
<p>&nbsp;</p>
<p align="center">
  <img src="./draw.io/LayerSet-class.drawio.svg" />
</p>

# LayerSet State Diagram

The `LayerSet` class allows to create objects whose properties correspond to the layer paths loaded on the map. The list of properties of a `LayerSet` remain synchronized at all times with all the layer paths of the map. If you delete or add a layer to the map, the `LayerSet` will be updated. The value associated to the layer path varies according to the usage. The Geoview viewer has two classes that use `layerSets` and can be examined to see how they can be used. These classes are [LegendsLayerSet](../LegendsLayerSet/LegendsLayerSet-event-managment.md) and [FeatureInfoLayerSet](../FeatureInfoLayerSet/FeatureInfoLayerSet-event-managment.md).

When we create a geoview layer, three listeners are attached to each layer entry that compose it. The first one is used to keep track of all the layer paths associated with the layer sets of the map, the second one is for the legend and the last one for the get feature info mechanism. Next, the geoview layer emit a layer registration event for each layer path added to the map. This event identifies the map and the layer path to be added to all layer sets already instantiated for the specified map. Here, the layer registration does not specify the `layerSetId` because we want to register to all `layerSet` that listen to the map.

In some cases, it is the layer set that is created when several layers already exist on the map. This situation is taken care of by sending a layer inventory request event when the layer set is created. In response to this signal, all existing layer path listeners will again issue a layer registration event to register their existence in the layer set. This time, the layer registration specify the `layerSetId` because we know whose layer set is requesting the inventory.

Each time a layer set is updated, a `LayerSet` updated event is issued to signal the change. This event is used to trigger the process that own the layer set.
<p>&nbsp;</p>
<p align="center">
  <img src="./draw.io/LayerSet-state-diagram.drawio.svg"/>
</p>

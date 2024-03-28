# Events API

The Event API provides an interface for managing events and event handlers on the GeoView core cgpv viewer. In the following sections, it is stated in some places that the event handler name must be a string concatenation separated by forward slashes. Although not mandatory, it is worth mentioning that this strategy is intended to allow bulk deactivation of event lists using a handler prefix, usually the map identifier. We will discuss that in the `offAll` section.

The event API will allow you to listen to events that are emitted from the viewer, create your own event listeners, emit events that are being listened from the viewer and emit your own created events.

An example event listener would be to listen to map drag events to get the new map position when a user moves around in the map. Another example is to listen to a panel open / close event.

The viewer exports many events that can be used to listen to or emit to. You need the event name to interact with any existing event. You can view a list of available event names by accessing this constant

```
cgpv.api.eventNames
```

You can also view the event names in the source code at [event.ts](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/api/events/event.ts#L81)

## Listening to Events

You can listen to events created by you or listen to existing events.

### Listening to existing events

To listen to existing events, make a note of the event name that you want to listen to and the payload structure that you will receive when the event is emitted. To view a list of payloads for each event [code](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/api/events/payloads) and [doc](event-payloads.md).

You can add an event listener by calling the `cgpv.api.event.on()` function.

The `on()` function takes two required parameters and one optional parameter.

#### First parameter

The **first** parameter is the event name as a string value. You can either use the existing exported values or you can enter the event name manually.

To listen to a map move end event when a user stops moving in a map you can access the event name with this `cgpv.api.eventNames.MAP.EVENT_MAP_MOVE_END`.

This will return `map/moveend` as string value. You can enter `map/moveend` manually if you prefer not to use the exported event names.

Event names are named by the component this event will interact with such as `map` followed by a forward slash, followed by the name of the event that will execute.

So far we have

`cgpv.api.event.on('map/moveend',...,...)`

or

`cgpv.api.event.on(cgpv.api.eventNames.MAP.EVENT_MAP_MOVE_END,...,...)`

#### Second parameter

The **second** parameter is a function callback that provides the **received payload** as the parameter of the callback function.

All existing events have certain payloads they emit and send, to view a list of all payloads for each event [code](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/api/events/payloads) and [doc](event-payloads.md).

This is what we have so far

```js
cgpv.api.event.on('map/moveend', function(payload) {
// validate payload
}, ...);
```

The viewer provides a function to **validate** each payload if it contains the correct data. This is helpful when using this in a typescript enviroment were you want to receive the correct payload type. The validate function will automatically convert the payload to it's correct type and provide you with auto completion. Documentation for payload validation functions for each event can be viewed here: [code](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/api/events/payloads) and [doc](event-payloads.md).

Validation functions starts with `payloadIs...` You can call `cgpv.types.payloadIs...` to access the validation functions for each event.

For our example, a map move end event sends a `lnglat` object with the payload containing the latitude and longtitude position. Therefore we have a validator function called `payloadIsALngLat`. The validation function will verify if the correct event was received and the payload contains the lnglat object and then convert it's type to LngLatPayload which will give you auto completion to access the payload content.

You can use this validation function as follow:

```js
cgpv.api.event.on('map/moveend', function(payload) {
	// before the validation, the type of payload is PayloadBaseClass
	if(cgpv.types.payloadIsALngLat(payload)) {
		// after the validation, the type of payload in this case is
    // LngLatPayload which will give access to the lnglat object
		console.log(payload.lnglat);
	}
}, ...);
```

#### Third optional parameter

The optional parameter is a handler name. It is used for listening on specefic handlers such as a specefic map, specefic panel in a map etc...

Some events emit only on one handler, other events emit to all maps so a handler is not required and others could emit on specefic panel on a map hence the need of a slash separated list of handlers. If a **handler** is used while emitting an event, then there must be a listener on the same event and handler if we want the callback function to be called. Handler names will automatically get added to the event names so for example, passing `mapOne` as the third parameter in the `on()` function will make the event name `map/moveend/mapOne`.

In our example, the emit function emits a map move end with the map id as the handler. So you can listen to a map move end event on that specefic map when you pass the map id handler to the third parameter of the `on()` function

Assuming our map is created with the id `mapOne`, our listener code will look like:

```js
cgpv.api.event.on(
  "map/moveend",
  function (payload) {
    // before the validation, the type of payload is PayloadBaseClass
    if (cgpv.types.payloadIsALngLat(payload)) {
      // after the validation, the type of payload in this case is LngLatPayload which will give access to the lnglat object
      console.log(payload.lnglat);
    }
  },
  "mapOne"
);
```

The callback function does not need to test that the handler name in the payload is the same as the name in the third parameter, because the callback function is only called if it is.

### Listening to events created by you

Listening for events you create is no different than listening for existing events. You should be able to use the same documentation without the validation function. And if you want to leverage your use of typescript, there's nothing stopping you from writing your own type protection functions.

### Listening to many events having the same event name and handler name

In some cases, we have to set listeners on the same event name and handler name. If we need to turn off only one of these listeners, we must keep a reference to the handler function that is used by the targetted handler. We will see how to tur off a single handler in the `off` section.

The handler function is returned by the `on` and `once` method of the Event class. It is the same as the callback function passed in as their second parameter.

## Emitting Events

You can create your own event emitter or emit to an existing event.

### Emitting to an existing event

Many of the existing events are being listened by the viewer so you can emit events and the viewer will interact with the emitted event.

Say you are trying to open a snackbar, the viewer listens to an event that opens the snackbar with a custom message.

To emit an event you need to call the `cgpv.api.event.emit()` function. The function takes 1 required parameter.

#### The emit parameter

The emit parameter is an object that contains the **event name** to emit to, a **handler name**, and the **payload data**.

Just like validation functions and event names, the viewer provides a function that creates the object for you. [Click here](event-payloads.md) to view a list of exported functions that creates the object for each event. Just like validation functions, the functions that creates the object are exported under `cgpv.types`.

The first parameter in the object creating function is required. To emit an event you must provide the event name to emit. Just like the `.on()` function, you can access the existing event names from `cgpv.api.eventNames`.

The second parameter is an optional parameter for the handler name, usually the map id. It can be set to null if you are emitting to all maps. If you want to target a specific map element, for example a panel, its value is a list of handler names separated by slashes.

The third parameter is payload data, this can be any types. For **existing** events you need to provide certain payload data. To list a list of payload data [click here](event-payloads.md)

```js
// here you will notice the second parameter for the snackbarMessagePayload function is mapOne. This can be null if you
// target all maps. In here the event name is snackbar/open. Providing the handler name it will automatically become
// snackbar/open/mapOne.
cgpv.api.event.emit(
  cgpv.types.snackbarMessagePayload(
    cgpv.api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN,
    "mapOne",
    "This is my message"
  )
);
```

#### The handler name parameters

Just like the `.on()` function, the `.emit()` function gives the user the option to provide a list of handler names. If you add handler names, you can use a slash
separated list of strings. The resulting handler names will automatically be appended to the event name, for example:

```js
// you will notice that the second parameter of snackbarMessagePayload is mapOne/panelOne. The event name will become
// snackbar/open/mapOne/panelOne. This way, we can provide multiple handler names to do things like open a specific panel
// in a specific map.

cgpv.api.event.emit(
  cgpv.types.snackbarMessagePayload(
    cgpv.api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN,
    "mapOne/panelOne",
    "This is my message"
  )
);
```

The use of a list of names separated by forward slashes is not mandatory. The important thing to remember is that listeners only react to emitters when the event name and handler string is the same.

### Creating your own event emitter

You can create your own event emitter in the same way as above except you will want to pass an object directly in the first parameter of the emit function instead of using a function that will create the object for you. Here is an example to emit the same function above to open a snackbar without using a converter function.

```js
cgpv.api.event.emit(
  {
    event: "snackbar/open",
    handlerName: "mapOne/panelOne",
    message: {
      type: "string",
      value: "Hello, World!",
    },
  }
);
```

## Turning off an event listener

It's always recommended to turn off the event listeners for clean up. However, you must be careful when disabling events, because if you disable an event associated with a viewer feature, you may interrupt the normal response of the viewer.

To turn off an event listener use the `cgpv.api.event.off()` function. The function takes one required parameter and two optional parameter. The first parameter is the event name and the second parameter is an optional handler name string. The last parameter is the optionnal handler function that is used to turn off a single event handler. The following line shows how to deactivate event `snackbar/open` on the map having the identifier `mapOne`.

```js
cgpv.api.event.off("snackbar/open", "mapOne");
```

The following lines show how to activate and deactivate a single event `snackbar/open` on the map having the identifier `mapOne`.

```js
const callbackFunction = (payload) => {
  if (payloadIsRequestLayerInventory(payload)) {
    const { layerSetId } = payload;
    api.event.emit(LayerSetPayload.createLayerRegistrationPayload(this.mapId, layerPath, 'add', layerSetId));
  }
};

api.event.on(EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY, callbackFunction, 'mapOne');

...

api.event.off(EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY, 'mapOne', callbackFunction);
```

## Bulk deactivation of listeners

The `offAll()` method takes a string parameter. All listeners whose handler name starts with the string assigned to the parameter will be disabled. You must be careful when disabling events, because if you disable an event associated with a viewer feature, you may interrupt the normal response of the viewer.

```js
cgpv.api.event.offAll("mapOne");
```

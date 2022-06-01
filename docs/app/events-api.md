# Events API

The events API provides an interface to manage events and event handlers on the GeoView core viewer cgpv.

The event API will allow you to listen to events that are emitted from the viewer, create your own event listeners, emit events that are being listened from the viewer and emit your own created events.

An example event listener would be to listen to map drag events to get the new map position when a user moves around in the map. Another example is to listen to a panel open / close event.

The viewer exports many events that can be used to listen to or emit to. You need the event name to interact with any existing event. You can view a list of available event names by accessing this constant

```
cgpv.api.eventNames
```

You can also view the event names in the source code at [event.ts](https://github.com/Canadian-Geospatial-Platform/GeoView/blob/develop/packages/geoview-core/src/api/events/event.ts#L81)

## Listening to Events

You can listen to events created by you or listen to existing events.

### Listening to existing events

To listen to existing events, make a note of the event name that you want to listen to and the payload structure that you will receive when the event is emitted. To view a list of payloads for each event [click here](event/event-payloads.md).

You can add an event listener by calling the `cgpv.api.event.on()` function.

The `on()` function takes two required parameters and a list of optional parameters.

#### First parameter

The **first** parameter is the event name as a string value. You can either use the existing exported values or you can enter the event name manually.

To listen to a map move end event when a user stops moving in a map you can access the event name with this `cgpv.api.eventNames.MAP.EVENT_MAP_MOVE_END`.

This will return `map/moveend` as string value. You can enter `map/moveend` manually if you prefer not to use the exported event names.

Event names are named by the component this event will interact with such as `map` followed by a forward slash, followed by the name of the event that will execute.

If a **handler** is added while emitting this event then another forward slash will follow with that handler name such as `map/moveend/mapOne/anotherHandler/anotherHandler` this will be explained later with the emit function.

So far we have

`cgpv.api.event.on('map/moveend',...,...)`

or

`cgpv.api.event.on(cgpv.api.eventNames.MAP.EVENT_MAP_MOVE_END,...,...)`

#### Second parameter

The **second** parameter is a function callback that provides the **received payload** as the parameter of the callback function.

All existing events have certain payloads they emit and send, to view a list of all payloads for each event [click here](event/event-payloads.md).

This is what we have so far

```js
cgpv.api.event.on('map/moveend', function(payload) {
// validate payload
}, ...);
```

The viewer provides a function to **validate** each payload if it contains the correct data. This is helpful when using this in a typescript enviroment were you want to receive the correct payload type. The validate function will automatically convert the payload to it's correct type and provide you with auto completion. Documentation for payload validation functions for each event can be viewed [here](event/event-payloads.md).

Validation functions starts with `payloadIs...` You can call `cgpv.types.payloadIs...` to access the validation functions for each event.

For our example, a map move end event sends a `latlng` object with the payload containing the latitude and longtitude position. Therefore we have a validator function called `payloadIsALatLng`. The validation function will verify if the correct event was received and the payload contains the latlng object and then convert it's type to LatLngPayload which will give you auto completion to access the payload content.

You can use this validation function as follow:

```js
cgpv.api.event.on('map/moveend', function(payload) {
	// before the validation, the type of payload is PayloadBaseClass
	if(cgpv.types.payloadIsALatLng(payload)) {
		// after the validation, the type of payload in this case is LatLngPayload which will give access to the latlng object
		console.log(payload.latlng);
	}
}, ...);
```

### Third+ - list of optional parameters

The optional parameters, are parameters for listening on specefic handlers such as a specefic map, specefic panel in a map etc...

Some events emit only on one handler, other events emit to all maps so a handler is not required and others could emit on specefic panel on a map hence the need of a list of parameters.

Handler names will automatically get added to the event names so for example, passing `mapOne` as the third parameter in the `on()` function will make the event name `map/moveend/mapOne`.

_The emitter function will have to emit the same handlers if you want to listen to it, will give an example on the emit function documentations._

In our example, the emit function emits a map move end with the map id as the handler. So you can listen to a map move end event on that specefic map when you pass the map id handler to the third parameter of the `on()` function

Assuming our map is created with the id `mapOne`, our listener code will look like:

```js
cgpv.api.event.on(
  "map/moveend",
  function (payload) {
    // before the validation, the type of payload is PayloadBaseClass
    if (cgpv.types.payloadIsALatLng(payload)) {
      // after the validation, the type of payload in this case is LatLngPayload which will give access to the latlng object
      console.log(payload.latlng);
    }
  },
  "mapOne"
);
```

### Listening to events created by you

Listening to events you create is not difference than listening to existing events. You should be able to use the same documentation without the validation function.

## Emitting Events

You can create your own event emitter or emit to an existing event.

### Emitting to an existing event

Many of the existing events are being listened by the viewer so you can emit events and the viewer will interact with the emitted event.

Say you are trying to open a snackbar, the viewer listens to an event that opens the snackbar with a custom message.

To emit an event you need to call the `cgpv.api.event.emit()` function. The function takes 1 required parameter and a list of optional parameters

#### The first parameter

The first parameter is an object that contains the **event name** to emit to, a **handler name**, and the **payload data**.

Just like validation functions and event names, the viewer provides a function that creates the object for you. [Click here](event/event-payloads.md) to view a list of exported functions that creates the object for each event. Just like validation functions, the functions that creates the object are exported under `cgpv.types`.

The first parameter in the object creating function is required. To emit an event you must provide the event name to emit. Just like the `.on()` function, you can access the existing event names from `cgpv.api.eventNames`.

The second parameter is an optional parameter for the handler name, usually its the map id. This can be set to null if you are emitting to all maps or if you want to set handler names in the second parameter of the `.emit()` function.

The third parameter is payload data, this can be any types. For **existing** events you need to provide certain payload data. To list a list of payload data [click here](event/event-payloads.md)

```js
// here you will notice the second parameter for the snackbarMessagePayload function is mapOne. This can be null and you can provide the handler id in the second paramter of the emit function. In here the event name is snackbar/open. Providing the handler name it will automatically become snackbar/open/mapOne. Here we omitted the second parameter for the emit function.
cgpv.api.event.emit(
  cgpv.types.snackbarMessagePayload(
    cgpv.api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN,
    "mapOne",
    {
      type: "string",
      value: "Hello, World!",
    }
  )
);
```

#### The second+ list of optional parameters

Just like the `.on()` function, the `.emit()` function gives the user the option to provide a list of handler names. This is optional because a user has the opportunity to provide a handler name (mainly the map id) in the first parameter. If you add handler names they will automatically be appended to the event name for example

```js
// you will notice that for the second paramter of the snackbarMessagePayload we set it to null. And for the second paramter of the emit function we provided the handler name. The event name will become snackbar/open/mapOne just like above. The reason we have this is because sometimes you might have multiple handlers such as opening a specefic panel in a specefic map, an example panel/open/mapOne/panelOne.

cgpv.api.event.emit(cgpv.types.snackbarMessagePayload(cgpv.api.eventNames.SNACKBAR.EVENT_SNACKBAR_OPEN, null, {
	type: "string",
	value: "Hello, World!"
}), "mapOne", // pass here another handler if needed)
```

### Creating your own event emitter

You can create your own event emitter in the same way as above except you will want to pass an object directly in the first parameter of the emit function instead of using a function that will create the object for you. Here is an example to emit the same function above to open a snackbar without using a converter function.

```js
cgpv.api.event.emit({
	event:  'snackbar/open',
	handlerName:  null,
	{
		type: "string",
		value: "Hello, World!"
	}
}, "mapOne");
```

## Turning off an event listener

It's always recommended to turn off the event listeners for clean up.

To turn off an event listener use the `cgpv.api.event.off()` function. The function takes 1 required parameter and a list of optional parameters. Like the `emit` and `on` functions. The first parameter is the event name and the second parameter is a list of optional handler names.

```js
cgpv.api.event.off("snackbar/open", "mapOne");
```

## Other available functions

`cgpv.api.event.offAll()` takes 1 parameter with a handler name. You can turn off all listeners that includes the handler name.

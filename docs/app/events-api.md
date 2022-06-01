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

### Creating your own event emitter

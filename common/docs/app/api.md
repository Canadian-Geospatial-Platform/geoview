# Events API

## Overview

The events API provides an interface to manage events and event handlers on the GeoView core viewer cgpv.

## Main Event Methods

### Reacting to an Event

To have a function run whenever an event fires, use the `on()` method. Supply the event name to listen for, the function to act as the event handler, and optionally a handler name.

Handler name is the name provided when an event is emitted, usually its the ID of the Map or a generated unique key

If a handler name is specified then the data related to the handler name will be returned

```js
var myHandler = function (param) {
    doStuff(param);
};
cgpv.api.on('map/moveend', myHandler, 'mapWM');
```

To listen to multiple events fired with the same event name, example in case two maps are rendered on same page and are emitting the mouseend event you can use `all()`, this method requires only the event name and a callback handler.

```js
var myHandler = function (param) {
    doStuff(param);
};
cgpv.api.all('map/moveend', myHandler);
```

Similarly, the `once()` method can be used to set up a one-time event handler. After the handler is triggered by the event, it is unregistered automatically.

```js
var myOneTimeHandler = function (param) {
    doStuff(param);
};
cgpv.api.once('map/moveend', myOneTimeHandler, 'mapWM');
```

### Removing an Event Handler

To cause an active event handler to stop reacting to an event, use the `off()` method. The event name is required to locate the handler to remove.

```js
// remove the handler set up in the .on() example
cgpv.api.off('map/moveend');
```

### Manually Firing an Event

To emit an event, use the `emit()` method. The event can be an existing event used by the viewer core, or can be a new custom event. Any handlers listening for the event will be executed. If the handlers are expecting a set of parameters, they are supplied after the event name. This method takes 3 parameters, the event name to trigger, the payload to send with the event, an optional handler name if you are firing this event for multiple instances for example multiple maps within the same page.

```js
// manually trigger a map click event
cgpv.api.emit('map/moveend', mapCenterPayload, 'map3');
```

While event names can be any string, it is suggested using the `domain/description` format.

## Other Event Methods

### List of Registered Events

The `getEvents()` method will return an object containing all triggered events that have been registered with their name with the API.

```js
var events = cgpv.api.getEvents();
// console.log(events);
/* 
{
  "map/moveend": {
    "mapWM": {
      "handlerName": "mapWM",
      "position": {
        "lat": 58.17070248348609,
        "lng": -98.17382812500001
      }
    },
    "mapLCC": {
      "handlerName": "mapLCC",
      "position": {
        "lat": 44.953966267787685,
        "lng": -74.99997877767534
      }
    }
  },
  "drawer/open_close": {
    "mapWM": {
      "handlerName": "mapWM",
      "id": "mapWM",
      "status": true
    },
    "mapLCC": {
      "handlerName": "mapLCC",
      "id": "mapLCC",
      "status": true
    }
  }
} 
*/
```

### List of Active Event Handlers

The `getHandlerNames()` method will return an array of event handler names that are registered with an event name. If an event has not been triggered yet with that handler name then the handler name will not be listed in the array. The method takes the event name and returns the list of handler names with it.

```js
var handlerNames = cgpv.api.getHandlerNames('map/moveend');

// (2) ["mapWM", "mapLCC"]
```

# HOW TO USE PLUGINS

## Plugin Support

Currently the viewer supports loading plugins as a React component template file

You can see an example plugin below

`public/plugins/panel/panel-content.js`

## Creating a plugin

A plugin can be created as a javascript file and can only import React, you will not be able to use third party libraries with this type of plugin.

The plugin can be either a function or a React component that returns a JSX element

See https://reactjs.org/docs/react-component.html for creating a component that returns a jsx element<br/>
See https://reactjs.org/docs/hooks-overview.html for creating a React function that returns a jsx element

The plugin file can be called anything but it's best to follow the name of the React function / component so if a component is called `PanelContent`, a file could be called `panel-content.js`

## Loading a plugin

You can load a plugin by calling the `loadRemoteComponent` function from the viewer API. This will return a promise with a React component

```js
const examplePlugin = await cgpv.api.loadRemoteComponent('example-plugin.js', {
    exampleProperty: 'exampleValue',
});
```

The loaded plugin can be then rendered by the viewer by passing it to available core viewer components. Currently creating a panel accepts a React component loaded from a plugin with a React template.

```js
const panel = {
    title: 'Test',
    icon: `<div>Icon</div>`,
    content: examplePlugin,
    width: 200,
};

// call an api function to add a panel with a button
cgpv.api.map('mapWM').createAppbarButtonPanel(button, panel, null);
```

> TODO: Add support for loading plugins with third party libraries

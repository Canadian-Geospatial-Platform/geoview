# HOW TO USE PLUGINS

## Plugin Support

The viewer allows loading plugins to extend the viewer's functionalities.

You can see an example plugin below

`public/plugins/basemap/basemap-switcher.js`

## Creating a plugin

To create a plugin, start by creating a JavaScript file preferably with the plugins name.

The plugin requires to be written inside an immediately invoked function expression [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)

```js
(function () {
    // create plugin class
})();
```

Inside this function you need to create a class that will be used to initialize the plugin

```js
(function () {
    class Test {}
})();
```

The class implements 1 constant `translations` and 2 hooks `added, removed` that will be accessed and called directly from the viewer, it will also automatically get access to `api`, `createElement`, `react`, `props`, `translate` and `makeStyles`.

The `translations` constant is an optional object, if defined then any translations provided will be passed to the core viewer translation instance (i18next) and will extend the current translations. Supported translations are for languages English and French and written as `en-CA` and `fr-CA` keys.

```js
(function () {
    class Test {
        translations = {
            'en-CA': {
                testMessage: 'Hello',
            },
            'fr-CA': {
                testMessage: 'Bonjour',
            },
        };
    }
})();
```

The `added` hook is a required function that is called from the viewer immediately after the plugin has been loaded. In this function you can create a react component and use the core viewer API calls.

As mentioned this class will automatically get access to few objects

`api` is an object used to call any available API function from the core viewer.

`createElement` is an essential function to create React HTML elements [see](#creating-a-react-component) for an example usage, `createElement` is part of `React` which takes 3 arguments, the first is the HTML element to create, an example would be a `button`, the second argument is the element attributes for example `onClick` or `className` or `style`..., the third argument is the element content / children for example `Click here`.

`react` is the an object to use React functions and hooks such as useState, useEffect etc... [see](https://reactjs.org/docs/hooks-intro.html) for more information.

`props` is an object containing the plugin properties passed when loading the plugin [see](#loading-external-plugins) for more information.

`translate` is an object to access `react-i18next` functions including `useTranslation` which will allow for accessing the viewer translations [see](https://react.i18next.com/latest/usetranslation-hook) for more information.

`makeStyles` is an object that will allow the plugin to use material ui themeing and access the core viewer theme [see](https://material-ui.com/styles/basics/)

The `removed` hook is a required function that is called from the viewer when a call has been made to remove the plugin. Any cleanup code should be written here, for example removing added components.

## Creating a React component

Using the `added` hook you can create and load a react component in the viewer

A react component can be a functional component or a class component [see](https://reactjs.org/docs/hooks-state.html) for more information on how to use each one.

Below is a simple example of a funcational component that will add a panel to the viewer on the appbar that will have a counter as it's content

```js
// counter.js
(function () {
    class Counter {
        // added panel
        panel = null;

        // optional
        translations = {
            'en-CA': {
                count: 'Count',
            },
            'fr-CA': {
                count: 'Compter',
            },
        };

        // required, called immediately after plugin loads
        added = {
            const { api, react, translate } = this;

            // get mapId passed from plugin properties when created
            const { mapId } = this.props;

            // used to create react element
            const h = this.createElement;

            const { useState } = react;
            const { useTranslation } = translate;

            // create a react functional component
            const Component = () => {
                const [count, setCount] = useState(0);

                // access translations
                const { t } = useTranslation();

                return h('button', {
                    onClick: () => setCount(count + 1)
                }, `${t('count')} ${count})`;
            }

            // button props
            const button = {
                tooltip: 'Counter',
                icon: '<i class="material-icons">add</i>',
            };

            // panel props
            const panel = {
                title: 'Counter',
                icon: '<i class="material-icons">add</i>',
                content: Component,
                width: 200,
            };

            // create a new button panel on the appbar
            this.panel = api.map(mapId).createAppbarPanel(button, panel, null);
        };

        // removed is a function called when removing a plugin to cleanup
        removed = () => {
            const { mapId } = this.props;

            this.api.map(mapId).removeAppbarPanel(this.panel.id);
        };
    }

    // export this plugin
    window.plugins = window.plugins || {};
    window.plugins.counter = Counter;
})();
```

A plugin needs to be exported before it can be loaded to the viewer. To export the plugin add this at the bottom of the plugin class, see example above for the example plugin.

```js
// export this plugin
window.plugins = window.plugins || {};
window.plugins.counter = Counter;
```

## Loading external plugins

There are two ways to load plugins

### Loading a plugin by calling the addPlugin function

You can load a plugin by first importing it in a script tag in the `<head>` element of the page

` <script src="./counter.js"></script>`

Then after the core viewer API is ready you can add the plugin to the viewer init callback using the `add` API function. This function takes 3 arguments, the first is the plugin name (should be unique name), the second is the exported plugin class, the third is the plugin properties. Plugin properties can be accessed using `this.props` inside the plugin `added` or `removed` functions.

`cgpv.api.addPlugin(name, pluginClass, props)`

```js
cgpv.init(function () {
    cgpv.api.addPlugin('counter', window.plugins['counter'], {
        mapId: 'mapLCC',
    });
});
```

### Loading a plugin by passing it's ID in the map config

You can load a plugin by first importing it in a script tag in the `<head>` element of the page.

` <script src="./counter.js"></script>`

After that you can load the plugin by passing the plugin name in the map config.

```html
<div
    id="mapWM"
    class="llwp-map"
    data-leaflet="{'name': 'LCC', 'projection': 3978, 'zoom': 4, 'center': [60,-100], 'language': 'en-CA', 'basemapOptions': { 'id': 'transport', 'shaded': false },
            'layers':[], 'plugins': ['basemapSwitcher']}"
></div>
```

**Note:** If you decide to load the plugin this way then you can't pass custom properties. `mapId` will be provided by default so you can access it from the `added` and `removed` functions inside the plugin using `this.props`

## Loading bundled plugins

You can call the `cgpv.api.addPlugin` to load plugins bundled by the viewer. Currently there are only one plugin available `details-panel`

To load the details panel plugin either use

```js
cgpv.api.addPlugin('details-panel', null, {
    mapId: 'mapLCC',
});
```

**Note:** You must provide the `mapId` you want to load the plugin to

`OR`

You can provide the `details-panel` entry in the `plugins` array in the map config. Please [see](#loading-a-plugin-by-passing-its-id-in-the-map-config)

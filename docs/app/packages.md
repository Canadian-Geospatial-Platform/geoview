# HOW TO USE packages

## Package Support

The viewer allows loading packages to extend the viewer's functionalities.

The viewer also supports few core packages such as a basemap panel, details panel, layers panel, overview map.

You can see an example package [here](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-basemap-panel)

## Creating a package using vanilla javascript

To create a package, start by creating a JavaScript file preferably with the packages name.

The package requires to be written inside an immediately invoked function expression [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)

```js
(function () {
  // create package class
})();
```

Inside this function you need to create a class that will be used to initialize the package

```js
(function () {
  class Test {}
})();
```

The class implements 1 constant `translations` and 2 hooks `added, removed` that will be accessed and called directly from the viewer, it will also automatically get access to `api`, `createElement`, `react`, `props`, `translate` and `makeStyles`.

The `translations` constant is an optional object, if defined then any translations provided will be passed to the core viewer translation instance (i18next) and will extend the current translations. Supported translations are for languages English and French and written as `en` and `fr` keys.

```js
(function () {
  class Test {
    translations = {
      en: {
        testMessage: "Hello",
      },
      fr: {
        testMessage: "Bonjour",
      },
    };
  }
})();
```

The `added` hook is a required function that is called from the viewer immediately after the package has been loaded. In this function you can create a react component and use the core viewer API calls.

As mentioned this class will automatically get access to few objects

`api` is an object used to call any available API function from the core viewer.

`createElement` is an essential function to create React HTML elements [see](#creating-a-react-component) for an example usage, `createElement` is part of `React` which takes 3 arguments, the first is the HTML element to create, an example would be a `button`, the second argument is the element attributes for example `onClick` or `className` or `style`..., the third argument is the element content / children for example `Click here`.

`react` is the an object to use React functions and hooks such as useState, useEffect etc... [see](https://reactjs.org/docs/hooks-intro.html) for more information.

`props` is an object containing the package properties passed when loading the package [see](#loading-the-package) for more information.

`translate` is an object to access `react-i18next` functions including `useTranslation` which will allow for accessing the viewer translations [see](https://react.i18next.com/latest/usetranslation-hook) for more information.

`makeStyles` is an object that will allow the package to use material ui themeing and access the core viewer theme [see](https://material-ui.com/styles/basics/)

The `removed` hook is a required function that is called from the viewer when a call has been made to remove the package. Any cleanup code should be written here, for example removing added components.

### Creating a React component

Using the `added` hook you can create and load a react component in the viewer

A react component can be a functional component or a class component [see](https://reactjs.org/docs/hooks-state.html) for more information on how to use each one.

Below is a simple example of a funcational component that will add a panel to the viewer on the app-bar that will have a counter as it's content

```js
// counter.js
(function () {
    class Counter {
        // added panel
        panel = null;

        // optional
        translations = {
            'en': {
                count: 'Count',
            },
            'fr': {
                count: 'Compter',
            },
        };

        // required, called immediately after package loads
        added = {
            const { api, react, translate } = this;

            // get mapId passed from package properties when created
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

            // create a new button panel on the app-bar
            this.panel = api.maps[mapId].createAppbarPanel(button, panel, null);
        };

        // removed is a function called when removing a package to cleanup
        removed = () => {
            const { mapId } = this.props;

            this.api.maps[mapId].removeAppbarPanel(this.panel.id);
        };
    }

    // export this package
    window.packages = window.packages || {};
    window.packages.counter = Counter;
})();
```

A package needs to be exported before it can be loaded to the viewer. To export the package add this at the bottom of the package class, see example above for the example package.

```js
// export this package
window.packages = window.packages || {};
window.packages.counter = Counter;
```

### Loading the package

You can load a package by first importing it in a script tag in the `<head>` element of the page

` <script src="./counter.js"></script>`

Then after the core viewer API is ready you can add the package to the viewer init callback using the `add` API function. This function takes 3 arguments, the first is the package name (should be unique name), the second is the exported package class, the third is the package properties. package properties can be accessed using `this.props` inside the package `added` or `removed` functions.

`cgpv.api.addPlugin(name, packageClass, props)`

```js
cgpv.init(function () {
  cgpv.api.addPlugin("counter", window.packages["counter"], {
    mapId: "mapLCC",
  });
});
```

## Loading bundled core packages

The viewer is bundled with core packages, you can load them by passing their id in the map config object in the `corePackages`, `footerBar.tabs.core` or `appBar.tabs.core` array as follows

```html
<div
  id="mapWM"
  class="geoview-map"
  data-lang="en"
  data-config="{
        'map': {
          'interaction': 'dynamic',
          'viewSettings': {
            'projection': 3857,
          },
          'basemapOptions': {
            'basemapId': 'transport',
            'shaded': false,
            'labeled': true
          }
        },
        'components': ['north-arrow', 'overview-map'],
        'corePackages': ['swiper'],
        'appBar': {
          'tabs': {
            'core': ['basemap-panel']
          }
        },
        'footerBar': {
          'tabs': {
            'core': ['time-slider']
          }
        },
        'theme': 'dark',
        'suportedLanguages': ['en']
      }"
></div>
```

Available package ids `basemap-panel`, `swiper`, `time-slider`, `geochart`

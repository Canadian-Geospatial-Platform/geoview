import React from 'react';
import ReactDOM from 'react-dom';

// Leaflet icons import to solve issues 4968
import { Icon, Marker } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { api } from './api/api';

import '../node_modules/leaflet/dist/leaflet.css';
import './assests/style/style.css';
import './assests/style/vendor.css';

import AppStart from './core/app-start';
import { manageKeyboardFocus } from './common/utilities';

// hack for default leaflet icon: https://github.com/Leaflet/Leaflet/issues/4968
// TODO: put somewhere else
const DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});
Marker.prototype.options.icon = DefaultIcon;

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
function init(callback: () => void) {
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);

    // set the API callback if a callback is provided
    if (callback) api.readyCallback = callback;

    ReactDOM.render(<AppStart />, document.getElementById('root'));
}

// cgpv object to be exported with the api for outside use
const cgpv = {
    init,
    api: {
        ...api,
        ...api.event,
        ...api.projection,
        ...api.plugin,
    },
};

// apply focus to element when keyboard navigation is use
manageKeyboardFocus();

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
window.cgpv = cgpv;

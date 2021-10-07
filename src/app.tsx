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
import { TypeCGPV, TypeWindow, TypeApi, Cast } from './types/cgpv-types';

// hack for default leaflet icon: https://github.com/Leaflet/Leaflet/issues/4968
// TODO: put somewhere else
const DefaultIcon = new Icon({
    iconUrl: icon,
    iconAnchor: [13, 40],
    shadowUrl: iconShadow,
});
Marker.prototype.options.icon = DefaultIcon;

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
function init(callback: () => void) {
    // apply focus to element when keyboard navigation is use
    manageKeyboardFocus();

    const html = document.body.innerHTML;

    document.body.innerHTML = '';

    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);

    // set the API callback if a callback is provided
    if (callback) api.readyCallback = callback;

    ReactDOM.render(<AppStart html={html} />, document.getElementById('root'));
}

// cgpv object to be exported with the api for outside use
const cgpv: TypeCGPV = {
    init,
    api: Cast<TypeApi>({
        ...api,
        ...api.event,
        ...api.projection,
        ...api.plugin,
    }),
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
Cast<TypeWindow>(window).cgpv = cgpv;

import './assests/i18n/i18n';
import i18n from 'i18next';

// Leaflet icons import to solve issues 4968
import { Icon, Marker } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { createMap } from './components/map/map';

import '../node_modules/leaflet/dist/leaflet.css';
import '../public/css/style.css';

// hack for default leaflet icon: https://github.com/Leaflet/Leaflet/issues/4968
// TODO: put somewhere else
const DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});
Marker.prototype.options.icon = DefaultIcon;

// loop trought all the maps and create an app for it.
const maps: Element[] = [...document.getElementsByClassName('llwb-map')];
[...maps].forEach((map: Element) => {
    // get the inline configuration
    // TODO: get config from CGP API, script mapping API and inline HTML
    // expression is not null or undefined, use the non-null assertion operator ! to coerce away those types
    const config = JSON.parse(map.getAttribute('data-leaflet')!.replace(/'/g, '"'));

    const i18nInstance = i18n.cloneInstance({
        lng: config.language,
        fallbackLng: config.language,
    });
    createMap(map, config, i18nInstance);
});

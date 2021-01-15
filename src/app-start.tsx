import React, { useEffect } from 'react';

import './assests/i18n/i18n';
import i18n from 'i18next';

import { createMap } from './components/map/map';

/**
 * Inialize the app with maps from inline html configs, url params
 */
const AppStart = (): JSX.Element => {
    /**
     * Create maps from inline configs with class name llwp-map in index.html
     */
    function getInlineMaps() {
        // get map configurations from inline data
        const maps: Element[] = [...document.getElementsByClassName('llwp-map')];

        // loop through all the maps and create an app for it.
        return [...maps].forEach((map: Element) => {
            // get the inline configuration
            const config = JSON.parse((map.getAttribute('data-leaflet') || '')?.replace(/'/g, '"'));

            const i18nInstance = i18n.cloneInstance({
                lng: config.language,
                fallbackLng: config.language,
            });

            // create the map and render it within it's own div
            createMap(map, config, i18nInstance);
        });
    }

    useEffect(() => {
        // get map configurations from html divs in index.html and render them
        getInlineMaps();
    }, []);

    return <></>;
};

export default AppStart;

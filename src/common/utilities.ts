import { api } from '../api/api';
import { EVENT_NAMES } from '../api/event';

/**
 * Apply outline to elements when keyboard is use to navigate
 * Issue in Leaflet... not implemented in the current release: Leaflet/Leaflet#7259
 * Code from: https://github.com/MaxMaeder/keyboardFocus.js
 */
export function manageKeyboardFocus(): void {
    // Remove the 'keyboard-focused' class from any elements that have it
    function removeFocusedClass() {
        const previouslyFocusedElement = document.getElementsByClassName('keyboard-focused')[0];
        if (previouslyFocusedElement) previouslyFocusedElement.classList.toggle('keyboard-focused');
    }

    // Add event listener for when tab pressed
    document.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        // get array of map elements
        const elements: Element[] = Array.from(document.getElementsByClassName('llwp-map'));
        const activeEl = document.activeElement;

        if (elements.some((element) => element.contains(activeEl))) {
            // Remove class on previous element then add the 'keyboard-focused' class to the currently focused element
            removeFocusedClass();
            activeEl?.classList.toggle('keyboard-focused');

            // Check if the focus element is a map. If so, emit the keyboard focus event with the map id
            if (activeEl?.className.match(/leaflet-map-*/g) !== null) {
                activeEl?.classList.forEach((item) => {
                    if (item.includes('leaflet-map-')) {
                        api.event.emit(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, item, {});
                    }
                });
            }
        }
    });

    // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
    document.addEventListener('click', removeFocusedClass);
    document.addEventListener('focusout', removeFocusedClass);
}

/**
 * Validate if a JSON string is well formatted
 * @param {string} str the string to test
 * @returns {bollean} true if the JSON is valid, false otherwise
 */
export function isJsonString(str: string): boolean {
    try {
        if (str !== '') {
            JSON.parse(str);
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Return the map server url from a layer service
 *
 * @param {string} url the service url for a wms / dynamic or feature layers
 * @param {boolean} rest boolean value to add rest services if not present (default false)
 * @returns the map server url
 */
export function getMapServerUrl(url: string, rest = false): string {
    let mapServerUrl = url.slice(0, url.indexOf('MapServer') + 'MapServer'.length);

    if (rest) {
        mapServerUrl = `${mapServerUrl.slice(0, url.indexOf('services/'))}rest${mapServerUrl.slice(url.indexOf('/services'))}`;
    }

    return mapServerUrl;
}

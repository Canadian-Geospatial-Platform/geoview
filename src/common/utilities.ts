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

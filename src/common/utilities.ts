/**
 * Apply outline to elements when keyboard is use to navigate
 * Issue in Leaflet... not implemented in the current release: Leaflet/Leaflet#7259
 * Code from: https://github.com/MaxMaeder/keyboardFocus.js
 */
export function manageKeyboardFocus(): void {
    // Remove the 'keyboardFocused' class from any elements that have it
    function removeFocusedClass() {
        const previouslyFocusedElement = document.getElementsByClassName('keyboardFocused')[0];
        if (previouslyFocusedElement) previouslyFocusedElement.classList.remove('keyboardFocused');
    }

    // Add event listener for when tab pressed
    document.addEventListener('keyup', (e) => {
        if (e.key !== 'Tab') return;

        // get array of map elements
        const elements: Element[] = Array.from(document.getElementsByClassName('llwp-map'));
        const activeEl = document.activeElement;

        if (elements.some((element) => element.contains(activeEl))) {
            // Remove class on previous element then add the 'keyboardFocused' class to the currently focused element
            removeFocusedClass();
            activeEl?.classList.add('keyboardFocused');
        }
    });

    // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
    document.addEventListener('click', removeFocusedClass);
    document.addEventListener('focusout', removeFocusedClass);
}

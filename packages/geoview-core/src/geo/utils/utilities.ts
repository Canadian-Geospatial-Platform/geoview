import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";
import { Cast, TypeCSSStyleDeclaration } from "../../core/types/cgpv-types";

/**
 * Apply outline to elements when keyboard is use to navigate
 * Issue in Leaflet... not implemented in the current release: Leaflet/Leaflet#7259
 * Code from: https://github.com/MaxMaeder/keyboardFocus.js
 */
export function manageKeyboardFocus(): void {
  // Remove the 'keyboard-focused' class from any elements that have it
  function removeFocusedClass() {
    const previouslyFocusedElement =
      document.getElementsByClassName("keyboard-focused")[0];
    if (previouslyFocusedElement)
      previouslyFocusedElement.classList.toggle("keyboard-focused");
  }

  // Add event listener for when tab pressed
  document.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    // get array of map elements
    const elements: Element[] = Array.from(
      document.getElementsByClassName("llwp-map")
    );
    const activeEl = document.activeElement;

    if (elements.some((element) => element.contains(activeEl))) {
      // Remove class on previous element then add the 'keyboard-focused' class to the currently focused element
      removeFocusedClass();
      activeEl?.classList.toggle("keyboard-focused");

      // Check if the focus element is a map. If so, emit the keyboard focus event with the map id
      if (activeEl?.className.match(/leaflet-map-*/g) !== null) {
        activeEl?.classList.forEach((item) => {
          if (item.includes("leaflet-map-")) {
            api.event.emit(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, item, {});
          }
        });
      }
    }
  });

  // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
  document.addEventListener("click", removeFocusedClass);
  document.addEventListener("focusout", removeFocusedClass);
}

/**
 * Return the map server url from a layer service
 *
 * @param {string} url the service url for a wms / dynamic or feature layers
 * @param {boolean} rest boolean value to add rest services if not present (default false)
 * @returns the map server url
 */
export function getMapServerUrl(url: string, rest = false): string {
  let mapServerUrl = url.slice(
    0,
    url.indexOf("MapServer") + "MapServer".length
  );

  if (rest) {
    mapServerUrl = `${mapServerUrl.slice(
      0,
      url.indexOf("services/")
    )}rest${mapServerUrl.slice(url.indexOf("/services"))}`;
  }

  return mapServerUrl;
}

/**
 * Gets computed translate values
 * https://zellwk.com/blog/css-translate-values-in-javascript/
 * @param {HTMLElement} element the HTML element to get value for
 * @returns {Object} the x, y and z translation values
 */
export function getTranslateValues(element: HTMLElement): {
  x: number;
  y: number;
  z: number;
} {
  const style = Cast<TypeCSSStyleDeclaration>(window.getComputedStyle(element));
  const matrix = style.transform || style.webkitTransform || style.mozTransform;
  const values = { x: 0, y: 0, z: 0 };

  // No transform property. Simply return 0 values.
  if (matrix === "none" || typeof matrix === "undefined") return values;

  // Can either be 2d or 3d transform
  const matrixType = matrix.includes("3d") ? "3d" : "2d";
  const matrixMatch = matrix.match(/matrix.*\((.+)\)/);
  const matrixValues = matrixMatch && matrixMatch[1].split(", ");

  // 2d matrices have 6 values
  // Last 2 values are X and Y.
  // 2d matrices does not have Z value.
  if (matrixType === "2d") {
    return {
      x: Number(matrixValues && matrixValues[4]),
      y: Number(matrixValues && matrixValues[5]),
      z: 0,
    };
  }

  // 3d matrices have 16 values
  // The 13th, 14th, and 15th values are X, Y, and Z
  if (matrixType === "3d") {
    return {
      x: Number(matrixValues && matrixValues[12]),
      y: Number(matrixValues && matrixValues[13]),
      z: Number(matrixValues && matrixValues[14]),
    };
  }

  return values;
}

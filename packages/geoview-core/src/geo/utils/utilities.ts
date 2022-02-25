import WMSCapabilities from "wms-capabilities";

import { Cast, TypeCSSStyleDeclaration } from "../../core/types/cgpv-types";
import { getXMLHttpRequest } from "../../core/utils/utilities";

import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";

export class GeoUtilities {
  /**
   * Fetch the json response from the ESRI map server to get REST endpoint metadata
   * @function getESRIServiceMetadata
   * @param {string} url the url of the ESRI map server
   * @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
   */
  getESRIServiceMetadata = async (
    url: string
  ): Promise<Record<string, unknown>> => {
    // fetch the map server returning a json object
    const response = await fetch(`${url}?f=json`);
    const result = await response.json();

    return result;
  };

  /**
   * Fetch the json response from the XML response of a WMS getCapabilities request
   * @function getWMSServiceMetadata
   * @param {string} url the url the url of the WMS server
   * @param {string} layers the layers to query separate by ,
   * @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
   */
  getWMSServiceMetadata = async (
    url: string,
    layers: string
  ): Promise<Record<string, unknown>> => {
    // query the WMS server
    const response = await getXMLHttpRequest(
      `${url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&layer=${layers}`
    );

    // parse the xml string and convert to json
    const result = new WMSCapabilities(response).toJSON();

    return result;
  };

  /**
   * Apply outline to elements when keyboard is use to navigate
   * Issue in Leaflet... not implemented in the current release: Leaflet/Leaflet#7259
   * Code from: https://github.com/MaxMaeder/keyboardFocus.js
   */
  manageKeyboardFocus = (): void => {
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
          const mapId = activeEl?.getAttribute("id");

          activeEl?.classList.forEach((item) => {
            if (item.includes("leaflet-map-")) {
              api.event.emit(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, mapId, {});
            }
          });
        }
      }
    });

    // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
    document.addEventListener("click", removeFocusedClass);
    document.addEventListener("focusout", removeFocusedClass);
  };

  /**
   * Return the map server url from a layer service
   *
   * @param {string} url the service url for a wms / dynamic or feature layers
   * @param {boolean} rest boolean value to add rest services if not present (default false)
   * @returns the map server url
   */
  getMapServerUrl = (url: string, rest = false): string => {
    let mapServerUrl = url.slice(
      0,
      url.indexOf("MapServer") + "MapServer".length
    );

    if (rest) {
      const urlRightSide = mapServerUrl.slice(
        mapServerUrl.indexOf("/services/")
      );
      mapServerUrl = `${mapServerUrl.slice(
        0,
        url.indexOf("services/")
      )}rest${urlRightSide}`;
    }

    return mapServerUrl;
  };

  /**
   * Gets computed translate values
   * https://zellwk.com/blog/css-translate-values-in-javascript/
   * @param {HTMLElement} element the HTML element to get value for
   * @returns {Object} the x, y and z translation values
   */
  getTranslateValues = (
    element: HTMLElement
  ): {
    x: number;
    y: number;
    z: number;
  } => {
    const style = Cast<TypeCSSStyleDeclaration>(
      window.getComputedStyle(element)
    );
    const matrix =
      style.transform || style.webkitTransform || style.mozTransform;
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
  };
}

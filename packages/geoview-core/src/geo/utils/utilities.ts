import axios from 'axios';

import { WMSCapabilities } from 'ol/format';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import { Color } from 'ol/color';

import { Cast, TypeJsonObject } from '../../core/types/global-types';
import { TypeFeatureStyle } from '../layer/vector/vector-types';
import { xmlToJson } from '../../core/utils/utilities';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';
import { inKeyfocusPayload } from '../../api/events/payloads/in-keyfocus-payload';

/**
 * Interface used for css style declarations
 */
interface TypeCSSStyleDeclaration extends CSSStyleDeclaration {
  mozTransform: string;
}

export class GeoUtilities {
  /**
  defaultDrawingStyle = (strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style => {
    // TODO: Refactoring - This method should be static, but since it goes through the api instance to be importable afterwards it loses non static methods. For this reason, I've left it like this. See api.constructor: this.geoUtilities = new GeoUtilities();
    return new Style({
      stroke: new Stroke({
        color: strokeColor || 'orange',
        width: strokeWidth || 2,
      }),
      fill: new Fill({
        color: fillColor || 'transparent',
      }),
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: fillColor || 'orange',
        }),
        stroke: new Stroke({
          color: strokeColor || 'orange',
          width: strokeWidth || 2,
        }),
      }),
    });
  };

  /**
   * Converts a TypeFeatureStyle to an Open Layers Style object.
   * @returns an Open Layers styling for drawing on a map or undefined
   */
  convertTypeFeatureStyleToOpenLayersStyle = (style?: TypeFeatureStyle): Style => {
    // TODO: Refactoring - This method should be static, but since it goes through the api instance to be importable afterwards it loses non static methods. For this reason, I've left it like this. See api.constructor: this.geoUtilities = new GeoUtilities();
    // TODO: Refactoring - This function could also be used by vector class when it works with the styling. So I'm putting it in this utilities class so that it eventually becomes shared between vector class and interactions classes.
    // Redirect
    return this.defaultDrawingStyle(style?.strokeColor, style?.strokeWidth, style?.fillColor);
  };

  /**
   * Fetch the json response from the ESRI map server to get REST endpoint metadata
   * @function getESRIServiceMetadata
   * @param {string} url the url of the ESRI map server
   * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
   */
  getESRIServiceMetadata = async (url: string): Promise<TypeJsonObject> => {
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
   * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
   */
  getWMSServiceMetadata = async (url: string, layers: string): Promise<TypeJsonObject> => {
    const parser = new WMSCapabilities();

    let capUrl = `${url}?service=WMS&version=1.3.0&request=GetCapabilities`;
    if (layers.length > 0) capUrl = capUrl.concat(`&layers=${layers}`);

    const response = await fetch(capUrl);

    const result = parser.read(await response.text());

    return result;
  };

  /**
   * Fetch the json response from the XML response of a WFS getCapabilities request
   * @function getWFSServiceMetadata
   * @param {string} url the url of the WFS server
   * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
   */
  getWFSServiceMetadata = async (url: string): Promise<TypeJsonObject> => {
    const res = await axios.get<TypeJsonObject>(url, {
      params: { request: 'getcapabilities', service: 'WFS' },
    });
    const xmlDOM = new DOMParser().parseFromString(res.data as string, 'text/xml');
    const json = xmlToJson(xmlDOM);
    const capabilities = json['wfs:WFS_Capabilities'];
    return capabilities;
  };

  /**
   * Apply outline to elements when keyboard is use to navigate
   * Code from: https://github.com/MaxMaeder/keyboardFocus.js
   */
  // TODO: Repair #335
  manageKeyboardFocus = (): void => {
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
        if (activeEl?.className.match(/mapContainer*/g) !== null) {
          const mapId = activeEl?.getAttribute('id')?.split('-')[1];
          api.event.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId!));
        }
      }
    });

    // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
    document.addEventListener('click', removeFocusedClass);
    document.addEventListener('focusout', removeFocusedClass);
  };

  /**
   * Return the map server url from a layer service
   *
   * @param {string} url the service url for a wms / dynamic or feature layers
   * @param {boolean} rest boolean value to add rest services if not present (default false)
   * @returns the map server url
   */
  getMapServerUrl = (url: string, rest = false): string => {
    let mapServerUrl = url;
    if (mapServerUrl.includes('MapServer')) {
      mapServerUrl = mapServerUrl.slice(0, mapServerUrl.indexOf('MapServer') + 'MapServer'.length);
    }
    if (mapServerUrl.includes('FeatureServer')) {
      mapServerUrl = mapServerUrl.slice(0, mapServerUrl.indexOf('FeatureServer') + 'FeatureServer'.length);
    }

    if (rest) {
      const urlRightSide = mapServerUrl.slice(mapServerUrl.indexOf('/services/'));
      mapServerUrl = `${mapServerUrl.slice(0, url.indexOf('services/'))}rest${urlRightSide}`;
    }

    return mapServerUrl;
  };

  /**
   * Return the root server url from a OGC layer service
   *
   * @param {string} url the service url for an ogc layer
   * @returns the root ogc server url
   */
  getOGCServerUrl = (url: string): string => {
    let ogcServerUrl = url;
    if (ogcServerUrl.includes('collections')) {
      ogcServerUrl = ogcServerUrl.slice(0, ogcServerUrl.indexOf('collections'));
    }
    return ogcServerUrl;
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
    const style = Cast<TypeCSSStyleDeclaration>(window.getComputedStyle(element));
    const matrix = style.transform || style.webkitTransform || style.mozTransform;
    const values = { x: 0, y: 0, z: 0 };

    // No transform property. Simply return 0 values.
    if (matrix === 'none' || matrix === undefined) return values;

    // Can either be 2d or 3d transform
    const matrixType = matrix.includes('3d') ? '3d' : '2d';
    const matrixMatch = matrix.match(/matrix.*\((.+)\)/);
    const matrixValues = matrixMatch && matrixMatch[1].split(', ');

    // 2d matrices have 6 values
    // Last 2 values are X and Y.
    // 2d matrices does not have Z value.
    if (matrixType === '2d') {
      return {
        x: Number(matrixValues && matrixValues[4]),
        y: Number(matrixValues && matrixValues[5]),
        z: 0,
      };
    }

    // 3d matrices have 16 values
    // The 13th, 14th, and 15th values are X, Y, and Z
    if (matrixType === '3d') {
      return {
        x: Number(matrixValues && matrixValues[12]),
        y: Number(matrixValues && matrixValues[13]),
        z: Number(matrixValues && matrixValues[14]),
      };
    }

    return values;
  };
}

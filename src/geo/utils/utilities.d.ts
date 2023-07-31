import { ReadOptions } from 'ol/format/Feature';
import { Geometry } from 'ol/geom';
import { Extent } from 'ol/extent';
import { Style } from 'ol/style';
import { Color } from 'ol/color';
import { TypeJsonObject } from '@/core/types/global-types';
import { TypeFeatureStyle } from '../layer/vector/vector-types';
import { TypeListOfLayerEntryConfig } from '../map/map-schema-types';
import { AbstractGeoViewLayer } from '../layer/geoview-layers/abstract-geoview-layers';
export declare class GeoUtilities {
    /**
     * Set the layerStatus code of all layers in the listOfLayerEntryConfig.
     *
     * @param {AbstractGeoViewLayer} geoviewLayerInstance The GeoView layer instance.
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration.
     * @param {string} errorMessage The error message.
     */
    setAllLayerStatusToError(geoviewLayerInstance: AbstractGeoViewLayer, listOfLayerEntryConfig: TypeListOfLayerEntryConfig, errorMessage: string): void;
    /**
     * Returns the WKT representation of a given geometry
     * @function geometryToWKT
     * @param {string} geometry the geometry
     * @returns {string | null} the WKT representation of the geometry
     */
    geometryToWKT: (geometry: Geometry) => string | null;
    /**
     * Returns the Geometry representation of a given wkt
     * @function wktToGeometry
     * @param {string} wkt the well known text
     * @param {ReadOptions} readOptions read options to convert the wkt to a geometry
     * @returns {Geometry | null} the Geometry representation of the wkt
     */
    wktToGeometry: (wkt: string, readOptions: ReadOptions) => Geometry | null;
    /**
     * Returns the Geometry representation of a given geojson
     * @function geojsonToGeometry
     * @param {string} geojson the geojson
     * @param {ReadOptions} readOptions read options to convert the geojson to a geometry
     * @returns {Geometry | null} the Geometry representation of the geojson
     */
    geojsonToGeometry: (geojson: string, readOptions: ReadOptions) => Geometry | null;
    /**
     * Returns the Geometry representation of a given geojson
     * @function geojsonToGeometry
     * @param {string} geojson the geojson
     * @param {ReadOptions} readOptions read options to convert the geojson to a geometry
     * @returns {Geometry | null} the Geometry representation of the geojson
     */
    getExtent: (coordinates: number[], inCrs: number, outCrs: number) => Extent;
    /**
     * Default drawing style for GeoView
     * @returns an Open Layers styling for drawing on a map
     */
    defaultDrawingStyle: (strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string) => Style;
    /**
     * Gets the area of a given geometry
     * @param {Geometry} geometry the geometry to calculate the area
     * @returns the area of the given geometry
     */
    getArea: (geometry: Geometry) => number;
    /**
     * Converts a TypeFeatureStyle to an Open Layers Style object.
     * @returns an Open Layers styling for drawing on a map or undefined
     */
    convertTypeFeatureStyleToOpenLayersStyle: (style?: TypeFeatureStyle) => Style;
    /**
     * Fetch the json response from the ESRI map server to get REST endpoint metadata
     * @function getESRIServiceMetadata
     * @param {string} url the url of the ESRI map server
     * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
     */
    getESRIServiceMetadata: (url: string) => Promise<TypeJsonObject>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request
     * @function getWMSServiceMetadata
     * @param {string} url the url the url of the WMS server
     * @param {string} layers the layers to query separate by ,
     * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
     */
    getWMSServiceMetadata: (url: string, layers: string) => Promise<TypeJsonObject>;
    /**
     * Fetch the json response from the XML response of a WFS getCapabilities request
     * @function getWFSServiceMetadata
     * @param {string} url the url of the WFS server
     * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
     */
    getWFSServiceMetadata: (url: string) => Promise<TypeJsonObject>;
    /**
     * Apply outline to elements when keyboard is use to navigate
     * Code from: https://github.com/MaxMaeder/keyboardFocus.js
     */
    manageKeyboardFocus: () => void;
    /**
     * Return the map server url from a layer service
     *
     * @param {string} url the service url for a wms / dynamic or feature layers
     * @param {boolean} rest boolean value to add rest services if not present (default false)
     * @returns the map server url
     */
    getMapServerUrl: (url: string, rest?: boolean) => string;
    /**
     * Return the root server url from a OGC layer service
     *
     * @param {string} url the service url for an ogc layer
     * @returns the root ogc server url
     */
    getOGCServerUrl: (url: string) => string;
    /**
     * Gets computed translate values
     * https://zellwk.com/blog/css-translate-values-in-javascript/
     * @param {HTMLElement} element the HTML element to get value for
     * @returns {Object} the x, y and z translation values
     */
    getTranslateValues: (element: HTMLElement) => {
        x: number;
        y: number;
        z: number;
    };
}

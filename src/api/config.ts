/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import { LatLngTuple } from 'leaflet';

import { generateId } from '../common/constant';
import { LayerConfig } from '../common/layers/layer';
import { isJsonString } from '../common/utilities';

/**
 * Interface used when creating a map to validate configuration object
 */
export interface MapConfigProps {
    id?: string;
    center: LatLngTuple;
    zoom: number;
    projection: number;
    language: string;
    basemapOptions: BasemapOptions;
    layers?: LayerConfig[];
    plugins: string[];
}

/**
 * interface for basemap options
 */
export interface BasemapOptions {
    id: string;
    shaded: boolean;
    labeled: boolean;
}

/**
 * Class to handle configuration validation. Will validate every item for structure and valid values. If error found, will replace by default values
 * and sent a message in the console for developers to know something went wrong
 *
 * @exports
 * @class
 */
export class Config {
    // default config if provided configuration is missing or wrong
    private _config: MapConfigProps = {
        id: generateId(null),
        center: [60, -100] as LatLngTuple,
        zoom: 4,
        projection: 3978,
        language: 'en-CA',
        basemapOptions: { id: 'transport', shaded: true, labeled: true },
        layers: [],
        plugins: [],
    };

    // validations values
    private _projections: number[] = [3857, 3978];

    private _basemapId = { 3857: ['transport'], 3978: ['transport', 'simple', 'shaded'] };

    private _basemapShaded = { 3857: [false], 3978: [true, false] };

    private _basemaplabeled = { 3857: [true, false], 3978: [true, false] };

    private _center = { 3857: { lat: [-90, 90], long: [-180, 180] }, 3978: { lat: [40, 90], long: [-140, 40] } };

    private _languages = ['en-CA', 'fr-CA'];

    /**
     * Get map configuration object
     */
    get configuration(): MapConfigProps {
        return this._config;
    }

    /**
     * Get map id
     */
    get id(): string {
        return this._config.id as string;
    }

    /**
     * Get map language
     */
    get language(): string {
        return this._config.language;
    }

    /**
     * Create the validation object
     * @param {string} id the map id
     * @param {string} config configuration string to validate
     */
    constructor(id: string, config: string) {
        // check if a config is provided and valid JSON object, if so validate, if not set to default
        this._config.id = id !== '' ? id : this._config.id;
        this._config = config !== '' && isJsonString(config) ? this.validate(id, config) : this._config;

        if (config === '' || !isJsonString(config))
            console.log(`- map: ${id} - Invalid or empty JSON configuration object, using default -`);
    }

    /**
     * Validate the configuration file
     * @param {string} id map id
     * @param {JSON} config JSON configuration object
     * @returns {MapConfigProps} valid JSON configuration object
     */
    private validate(id: string, config: string): MapConfigProps {
        // merge default and provided configuration
        const tmpConfig: MapConfigProps = { ...this._config, ...JSON.parse(config) };

        // do validation for every pieces
        // TODO: if the config becomes too complex, need to break down.... try to maintain config simple
        const projection = this.validateProjection(Number(tmpConfig.projection));
        const basemapOptions = this.validateBasemap(projection, tmpConfig.basemapOptions);
        const center = this.validateCenter(projection, tmpConfig.center);
        const zoom = this.validateZoom(Number(tmpConfig.zoom));
        const language = this.validateLanguage(tmpConfig.language);
        const plugins = this.validatePlugins(tmpConfig.plugins);

        // validatio is done in layer class
        const { layers } = tmpConfig;

        // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
        const validConfig: MapConfigProps = { id, projection, zoom, center, language, basemapOptions, layers, plugins };
        this.logModifs(tmpConfig, validConfig);

        return validConfig;
    }

    /**
     * Log modifications made to configuration by the validator
     * @param {MapConfigProps} inConfig input config
     * @param {MapConfigProps} validConfig valid config
     */
    private logModifs(inConfig: MapConfigProps, validConfig: MapConfigProps): void {
        if (inConfig.projection !== validConfig.projection) {
            console.log(`- map: ${validConfig.id} - Invalid projection ${inConfig.projection} replaced by ${validConfig.projection} -`);
        }
        if (inConfig.zoom !== validConfig.zoom) {
            console.log(`- map: ${validConfig.id} - Invalid zoom level ${inConfig.zoom} replaced by ${validConfig.zoom} -`);
        }
        if (JSON.stringify(inConfig.center) !== JSON.stringify(validConfig.center)) {
            console.log(`- map: ${validConfig.id} - Invalid center ${inConfig.center} replaced by ${validConfig.center} -`);
        }
        if (inConfig.language !== validConfig.language) {
            console.log(`- map: ${validConfig.id} - Invalid language ${inConfig.language} replaced by ${validConfig.language} -`);
        }
        if (JSON.stringify(inConfig.basemapOptions) !== JSON.stringify(validConfig.basemapOptions)) {
            console.log(
                `- map: ${validConfig.id} - Invalid basemap options ${JSON.stringify(inConfig.basemapOptions)} replaced by ${JSON.stringify(
                    validConfig.basemapOptions
                )} -`
            );
        }
        const pluginsDiff = inConfig.plugins.filter((plugin) => !validConfig.plugins.includes(plugin));
        if (pluginsDiff.length > 0) {
            console.log(
                `- map: ${validConfig.id} - Invalid plugin options ${JSON.stringify(inConfig.plugins)} replaced by ${JSON.stringify(
                    validConfig.plugins
                )} -`
            );
        }
    }

    /**
     * Validate projection
     * @param {number} projection provided projection
     * @returns {number} valid projection
     */
    private validateProjection(projection: number): number {
        return this._projections.includes(projection) ? projection : 3978;
    }

    /**
     * Validate basemap options
     * @param {number} projection valid projection
     * @param {BasemapOptions} basemapOptions basemap options
     * @returns {BasemapOptions} valid basemap options
     */
    private validateBasemap(projection: number, basemapOptions: BasemapOptions): BasemapOptions {
        const id: string = this._basemapId[projection].includes(basemapOptions.id) ? basemapOptions.id : this._basemapId[projection][0];
        const shaded = this._basemapShaded[projection].includes(basemapOptions.shaded)
            ? basemapOptions.shaded
            : this._basemapShaded[projection][0];
        const labeled = this._basemaplabeled[projection].includes(basemapOptions.labeled)
            ? basemapOptions.labeled
            : this._basemaplabeled[projection][0];

        return { id, shaded, labeled };
    }

    /**
     * Validate the center
     * @param {number} projection valid projection
     * @param {LatLngTuple} center center of the map
     * @returns {LatLngTuple} valid center of the map
     */
    private validateCenter(projection: number, center: LatLngTuple): LatLngTuple {
        const xVal = Number(center[1]);
        const yVal = Number(center[0]);

        const x =
            !Number.isNaN(xVal) && xVal > this._center[projection].long[0] && xVal < this._center[projection].long[1]
                ? xVal
                : this._config.center[1];
        const y =
            Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && xVal < this._center[projection].lat[1]
                ? yVal
                : this._config.center[0];

        return [y, x];
    }

    /**
     * Validate zoom level
     * @param {number} zoom provided zoom level
     * @returns {number} valid zoom level
     */
    private validateZoom(zoom: number): number {
        return !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : 4;
    }

    /**
     * Validate map language
     * @param {string} language provided language
     * @returns {string} valid language
     */
    private validateLanguage(language: string): string {
        return this._languages.includes(language) ? language : this._languages[0];
    }

    /**
     * Validate the plugins array
     * @param {string[]} plugins the plugins array
     * @returns {string[]} valid plugins
     */
    private validatePlugins(plugins: string[]): string[] {
        const validPlugins: string[] = [];

        if (Array.isArray(plugins)) {
            // loop through the array and check each element if its valid string
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < plugins.length; i++) {
                if (typeof plugins[i] === 'string' && plugins[i].length > 0) validPlugins.push(plugins[i]);
            }

            return validPlugins;
        }

        return this._config.plugins;
    }
}

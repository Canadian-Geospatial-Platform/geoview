import { ReactElement } from 'react';
import { Projection } from 'ol/proj';
import { Geometry } from 'ol/geom';
import { DataTableData } from './data-table';
import { TypeLayerDataGridProps, TypeListOfLayerEntryConfig, TypeArrayOfFeatureInfoEntries } from '@/app';
export declare class DataTableApi {
    mapId: string;
    /**
     * initialize the data table api
     *
     * @param mapId the id of the map this data table belongs to
     */
    constructor(mapId: string);
    /**
     * Create a data table as an element
     *
     * @param { 'materialReactDataTable'} tableType type of table that user want to create.
     * @return {ReactElement} the data table react element
     */
    createDataTable: ({ data }: {
        data: DataTableData;
    }) => ReactElement;
    /**
     * Create group layer keys based on layer rendered on map
     *
     * @param {TyepListOfLayerEntryConfig} listOfLayerEntryConfig list of layers configured to be rendered on map.
     * @param {string} parentLayerId layer id
     * @param {string[]} grouplayerKeys list of keys already exists.
     * @returns {string[]} array of layer keys
     */
    getGroupKeys: (listOfLayerEntryConfig: TypeListOfLayerEntryConfig, parentLayerId: string, grouplayerKeys: string[]) => string[];
    /**
     * Create a geometry json
     *
     * @param {Geometry} geometry the geometry
     * @param {Projection} projectionConfig projection config to transfer lat long.
     * @return {TypeJsonObject} the geometry json
     *
     */
    buildGeometry: (geometry: Geometry, projectionConfig: Projection) => {
        type: string;
        coordinates: import("ol/coordinate").Coordinate[][];
    } | {
        type: string;
        coordinates: import("ol/coordinate").Coordinate[];
    } | {
        type: string;
        coordinates: import("ol/coordinate").Coordinate;
    } | {
        type?: undefined;
        coordinates?: undefined;
    };
    /**
     * Create a data table rows
     *
     * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data table to be created
     * @param {Projection} projectionConfig projection config to transfer lat long.
     * @return {TypeJsonArray} the data table rows
     */
    buildFeatureRows: (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries, projectionConfig: Projection) => {
        features: {
            featureKey: {
                featureInfoKey: string;
                featureInfoValue: number;
                fieldType: string;
            };
            featureIcon: {
                featureInfoKey: string;
                featureInfoValue: string;
                fieldType: string;
            };
            featureActions: {
                featureInfoKey: string;
                featureInfoValue: string;
                fieldType: string;
            };
            geometry: Geometry;
            extent: import("ol/extent").Extent;
            rows: Record<string, string>;
        }[];
        fieldAliases: Record<string, string>;
    };
    /**
     * Create data table based on layer id from map.
     * @param {string} layerId layerId of the feature added on map.
     * @returns {Promise<ReactElement | null>} Promise of ReactElement.
     */
    createDataTableByLayerId: ({ layerId }: TypeLayerDataGridProps) => Promise<ReactElement | null>;
}

import { ReactElement } from 'react';
import { DataTableData } from './data-table';
import { TypeListOfLayerEntryConfig, TypeArrayOfFeatureInfoEntries, TypeFieldEntry } from '@/app';
interface CreataDataTableProps {
    layerId: string;
    layerKey: string;
}
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
     * Create a data table rows
     *
     * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data table to be created
     * @return {TypeJsonArray} the data table rows
     */
    buildFeatureRows: (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries) => {
        features: {
            rows: Record<string, string>;
            featureKey: number;
            geoviewLayerType: import("@/app").TypeGeoviewLayerType;
            extent: import("ol/extent").Extent;
            geometry: import("ol/Feature").FeatureLike | null;
            featureIcon: HTMLCanvasElement;
            fieldInfo: Partial<Record<string, TypeFieldEntry>>;
            nameField: string | null;
        }[];
        fieldAliases: Record<string, TypeFieldEntry>;
    };
    /**
     * Create data table based on layer id from map.
     * @param {string} layerId layerId of the feature added on map.
     * @param {string} layerKey layerKey of the feature added on map.
     * @returns {Promise<ReactElement | null>} Promise of ReactElement.
     */
    createDataTableByLayerId: ({ layerId, layerKey }: CreataDataTableProps) => Promise<ReactElement | null>;
}
export {};

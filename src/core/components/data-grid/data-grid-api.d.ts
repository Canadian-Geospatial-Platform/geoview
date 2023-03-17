import { ReactElement } from 'react';
import { TypeDisplayLanguage } from '../../../app';
export interface TypeLayerDataGridProps {
    layerId: string;
}
/**
 * API to manage data grid component
 *
 * @exports
 * @class DataGridAPI
 */
export declare class DataGridAPI {
    mapId: string;
    displayLanguage: TypeDisplayLanguage;
    /**
     * initialize the data grid api
     *
     * @param mapId the id of the map this data grid belongs to
     */
    constructor(mapId: string);
    /**
     * Create a data grid
     *
     * @param {TypeLayerDataGridProps} layerDataGridProps the properties of the data grid to be created
     * @return {ReactElement} the data grid react element
     *
     */
    createDataGrid: (layerDataGridProps: TypeLayerDataGridProps) => ReactElement;
}

import { AbstractEventProcessor } from '../abstract-event-processor';
export declare class DataTableProcessor extends AbstractEventProcessor {
    /**
     * Filter the map based on filters set on date table.
     * @param {string} mapId  id of the map.
     * @param {string} layerPath  path of the layer
     * @param {string} filterStrings filters set on the data table
     * @param {boolean} isMapRecordExist filtered Map switch is on off.
     */
    static applyFilters(mapId: string, layerPath: string, filterStrings: string, isMapRecordExist: boolean): void;
}

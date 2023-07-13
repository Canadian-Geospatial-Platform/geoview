import { createElement } from 'react';
import DataTable from './data-table';

export class DataTableApi {
  mapId!: string;

  /**
   * initialize the data table api
   * @param mapId the id of the map this data table belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }
  /**
   * Create a data table as an element
   * @param { 'materialReactDataTable' | 'muiDataTable'} tableType type of table that user want to create.
   * @return {ReactElement} the data table react element
   */

  createDataTable = (tableType: 'materialReactDataTable' | 'muiDataTable') => {
    return createElement(DataTable, { tableType }, []);
  };
}

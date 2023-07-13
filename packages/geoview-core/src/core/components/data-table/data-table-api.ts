import { createElement } from 'react';
import DataTable, { DataTableData } from './data-table';

export class DataTableApi {
  mapId!: string;

  /**
   * initialize the data table api
   *
   * @param mapId the id of the map this data table belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }
  /**
   * Create a data table as an element
   *
   * @param { 'materialReactDataTable'} tableType type of table that user want to create.
   * @return {ReactElement} the data table react element
   */

  createDataTable = ({ data }: { data: DataTableData }) => {
    return createElement(DataTable, { data }, []);
  };
}

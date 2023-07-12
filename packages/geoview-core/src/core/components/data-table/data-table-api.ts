import { createElement } from 'react';
import DataTable from './data-table';

export class DataTableApi {
  mapId!: string;

  constructor(mapId: string) {
    this.mapId = mapId;
  }

  createDataTable = (tableType: 'materialReactDataTable' | 'muiDataTable') => {
    return createElement(DataTable, { tableType }, []);
  };
}

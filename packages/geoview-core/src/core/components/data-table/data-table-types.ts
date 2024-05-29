import { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { TypeFieldEntry } from '@/geo/map/map-schema-types';

export interface MappedLayerDataType extends TypeAllFeatureInfoResultSetEntry {
  fieldInfos: Partial<Record<string, TypeFieldEntry>>;
}

export interface ColumnsType {
  ICON: TypeFieldEntry;
  ZOOM: TypeFieldEntry;
  [key: string]: TypeFieldEntry;
}

export interface DataTableProps {
  data: MappedLayerDataType;
  layerPath: string;
  tableHeight: number;
}

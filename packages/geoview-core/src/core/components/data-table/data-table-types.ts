import { TypeFieldEntry, TypeLayerData } from '@/geo/map/map-schema-types';

export interface MappedLayerDataType extends TypeLayerData {
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

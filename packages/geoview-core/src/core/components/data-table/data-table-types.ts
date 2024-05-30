import { TypeFieldEntry, TypeLayerData } from '@/geo/layer/layer-sets/abstract-layer-set';

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
  tableHeight: string;
}

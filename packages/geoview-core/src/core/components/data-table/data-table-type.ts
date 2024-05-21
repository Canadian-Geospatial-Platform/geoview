import { TypeFieldEntry, TypeLayerData } from '@/geo/layer/layer-sets/abstract-layer-set';

export interface MappedLayerDataType extends TypeLayerData {
  fieldInfos: Record<string, TypeFieldEntry | undefined>;
}

export interface FieldInfos {
  alias: string;
  dataType: string;
  domain?: string;
  fieldKey: number;
  value: string | null;
}

export interface ColumnsType {
  ICON: FieldInfos;
  ZOOM: FieldInfos;
  [key: string]: FieldInfos;
}

export interface DataTableProps {
  data: MappedLayerDataType;
  layerPath: string;
  tableHeight: number;
}

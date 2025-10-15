import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';

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
  containerType: TypeContainerBox;
}

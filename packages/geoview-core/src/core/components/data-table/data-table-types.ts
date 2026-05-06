import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/states/data-table-state';
import type { TypeFieldEntry, TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import type { ReactElement } from 'react';

/** Mapped layer data with field info columns. */
export interface MappedLayerDataType extends TypeAllFeatureInfoResultSetEntry {
  fieldInfos: Partial<Record<string, TypeFieldEntry>>;
}

/**
 * Data table row type combining action columns, feature reference, and dynamic field data.
 */
export interface DataTableRow {
  /** The full feature information object for handler access. */
  gvFeature: TypeFeatureInfoEntry;
  /** Icon column rendering. */
  ICON: ReactElement;
  /** Zoom action button column rendering. */
  ZOOM: ReactElement;
  /** Details action button column rendering. */
  DETAILS: ReactElement;
  /** Dynamic field columns from the feature's fieldInfo. */
  [key: string]: TypeFieldEntry | ReactElement | TypeFeatureInfoEntry;
}

/** Properties for the DataTable component. */
export interface DataTableProps {
  data: MappedLayerDataType;
  layerPath: string;
  containerType: TypeContainerBox;
  unfilteredFeaturesCount: number;
}

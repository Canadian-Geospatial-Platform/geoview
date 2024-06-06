import { Dispatch, SetStateAction, useEffect, useState, useMemo } from 'react';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { MappedLayerDataType } from '../data-table-types';
import { type MRT_ColumnFilterFnsState as MRTColumnFilterFnsState, type MRT_FilterOption as MRTFilterOption } from '@/ui';

export interface TypeUseFilterFns {
  layerPath: string;
  data: MappedLayerDataType;
}

interface TypeReturnUseFiltersFns {
  filterFns: MRTColumnFilterFnsState;
  setFilterFns: Dispatch<SetStateAction<MRTColumnFilterFnsState>>;
}
/**
 * Custom hook to set the filter function of each column
 * @param {string} layerPath key of the layer selected.
 * @param {MappedLayerDataType} data table data
 * @returns {Object}
 */
export function useFilterFns({ data, layerPath }: TypeUseFilterFns): TypeReturnUseFiltersFns {
  const datatableSettings = useDataTableLayerSettings();

  const { setColumnFilterFnsEntry } = useDataTableStoreActions();

  const buildFilterFns = useMemo(() => {
    return Object.keys(data.fieldInfos).reduce((acc, curr) => {
      if (data.fieldInfos[curr]?.dataType === 'number' || data.fieldInfos[curr]?.dataType === 'date') {
        acc[curr] = 'between';
      } else {
        acc[curr] = 'contains';
      }

      return acc;
    }, {} as Record<string, MRTFilterOption>);
  }, [data.fieldInfos]);

  const filterFnsRecord = Object.keys(datatableSettings[layerPath]?.columnFilterFnsRecord ?? {}).length
    ? datatableSettings[layerPath]?.columnFilterFnsRecord
    : buildFilterFns;

  const [filterFns, setFilterFns] = useState<MRTColumnFilterFnsState>(filterFnsRecord);

  // update store column filter fns
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilterFns', filterFns);

    setColumnFilterFnsEntry(filterFns, layerPath);
  }, [filterFns, setColumnFilterFnsEntry, layerPath]);

  return { filterFns, setFilterFns };
}

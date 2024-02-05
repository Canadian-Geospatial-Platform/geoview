import { useEffect, useState } from 'react';
import {
  useDataTableStoreActions,
  useDataTableStoreRowSelectionsRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

interface UseSelectedRowMessageProps {
  layerPath: string;
}

/**
 * Custom hook to set the selected rows for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export function useSelectedRows({ layerPath }: UseSelectedRowMessageProps) {
  // get store values
  const rowSelectionsRecord = useDataTableStoreRowSelectionsRecord();

  // internal state
  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>(rowSelectionsRecord[layerPath] ?? {});
  const { setRowSelectionsEntry } = useDataTableStoreActions();

  // update store row selections.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USESELECTEDROWS - RowSelection', rowSelection);

    setRowSelectionsEntry(rowSelection, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  return { rowSelection, setRowSelection };
}

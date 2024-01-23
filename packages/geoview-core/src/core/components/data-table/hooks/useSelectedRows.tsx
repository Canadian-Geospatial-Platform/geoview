import { useEffect, useState } from 'react';
import {
  useDataTableStoreActions,
  useDataTableStoreRowSelectionsRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

interface UseSelectedRowMessageProps {
  layerKey: string;
}

/**
 * Custom hook to set the selected rows for data table.
 * @param {string} layerKey key of the layer selected.
 * @returns {Object}
 */
export function useSelectedRows({ layerKey }: UseSelectedRowMessageProps) {
  // get store values
  const rowSelectionsRecord = useDataTableStoreRowSelectionsRecord();

  // internal state
  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>(rowSelectionsRecord[layerKey] ?? {});
  const { setRowSelectionsEntry } = useDataTableStoreActions();

  // update store row selections.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USESELECTEDROWS - RowSelection', rowSelection);

    setRowSelectionsEntry(rowSelection, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  return { rowSelection, setRowSelection };
}

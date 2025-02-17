import { memo } from 'react';
import { MaterialReactTable, MRT_TableOptions as MRTTableOptions, type MRT_RowData as MRTRowData } from 'material-react-table';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material React Table component (https://www.material-react-table.com/).
 * This is a simple wrapper around Material React Table that maintains
 * full compatibility with Material-React's Table props.
 *
 * @param {MRTTableOptions} props - All valid Material React Table props
 * @returns {JSX.Element} The Table component
 */
export const MRTTable = memo(function MRTTable<TData extends MRTRowData>(tableOptions: MRTTableOptions<TData>): JSX.Element {
  logger.logTraceRender('ui/table/table', tableOptions);

  return <MaterialReactTable {...tableOptions} />;
});

export * from 'material-react-table';

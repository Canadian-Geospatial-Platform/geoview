import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton } from '@/ui';
import type { SxStyles } from '@/ui/style/types';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './data-skeleton-style';

/**
 * Renders a skeleton loading placeholder for the data table.
 *
 * @returns The data table skeleton element
 */
export default function DataSkeleton(): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-skeleton');

  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('DATA-SKELETON - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {[...Array(5).keys()].map((value) => (
              <TableCell sx={memoSxClasses.skeletonCell} key={value}>
                <Skeleton variant="text" width="100%" height="25px" sx={memoSxClasses.skeletonBar} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(20).keys()].map((row) => (
            <TableRow key={row} sx={memoSxClasses.skeletonRow}>
              {[...Array(5).keys()].map((value) => (
                <TableCell sx={memoSxClasses.skeletonCell} key={value}>
                  <Skeleton variant="text" width="100%" height="25px" sx={memoSxClasses.skeletonBar} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

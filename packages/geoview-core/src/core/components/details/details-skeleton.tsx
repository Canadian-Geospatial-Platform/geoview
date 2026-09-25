import { memo, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Skeleton } from '@/ui';
import { getSxClasses } from './details-style';
import { logger } from '@/core/utils/logger';
import type { SxStyles } from '@/ui/style/types';

// Constants outside component to prevent recreating every render
/** Skeleton width percentages for each row. */
const sizes = ['15%', '10%', '15%', '25%', '10%', '20%', '10%'];

/**
 * Creates the details skeleton placeholder component.
 *
 * Memoized to prevent re-renders since it has no props.
 *
 * @returns The skeleton component
 */
export const DetailsSkeleton = memo((): JSX.Element => {
  const theme = useTheme();

  /**
   * Computes the style classes for the skeleton.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('DETAILS-SKELETON - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  return (
    <Box sx={memoSxClasses.skeletonBox}>
      <Skeleton variant="text" width="60%" height={32} sx={memoSxClasses.skeletonTitle} />
      <Box sx={memoSxClasses.skeletonBox}>
        {sizes.map((size, index) => (
          <Box sx={memoSxClasses.skeletonRow} key={`${index.toString()}-${size}`}>
            <Skeleton variant="text" width={size} height="25px" />
            <Skeleton variant="text" width={size} height="25px" />
          </Box>
        ))}
      </Box>
    </Box>
  );
});
DetailsSkeleton.displayName = 'DetailsSkeleton';

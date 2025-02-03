import { memo } from 'react';
import { Box, Skeleton } from '@/ui';

// Constants outside component to prevent recreating every render
const sizes = ['15%', '10%', '15%', '25%', '10%', '20%', '10%'];

const SKELETON_STYLES = {
  box: { padding: '10px' },
  title: { mb: 1 },
  text: { pt: 4, pb: 4 },
} as const;

/**
 * Custom details skeleton build with mui skeleton component.
 * @returns {JSX.Element}
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const DetailsSkeleton = memo(function DetailsSkeleton(): JSX.Element {
  return (
    <Box sx={SKELETON_STYLES.box}>
      <Skeleton variant="text" width="60%" height={32} sx={SKELETON_STYLES.title} />
      <Box sx={SKELETON_STYLES.box}>
        {sizes.map((size, index) => (
          <Box display="flex" justifyContent="space-between" sx={SKELETON_STYLES.text} key={`${index.toString()}-${size}}`}>
            <Skeleton variant="text" width={size} height="25px" />
            <Skeleton variant="text" width={size} height="25px" />
          </Box>
        ))}
      </Box>
    </Box>
  );
});

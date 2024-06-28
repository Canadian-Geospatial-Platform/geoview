import { Box, Skeleton } from '@/ui';

/**
 * Custom details skeleton build with mui skeleton component.
 * @returns {JSX.Element}
 */
export default function DetailsSkeleton(): JSX.Element {
  const sizes = ['15%', '10%', '15%', '25%', '10%', '20%', '10%'];
  return (
    <Box padding={8}>
      <Box pb={8}>
        {sizes.map((size) => (
          <Box display="flex" justifyContent="space-between" pt={4} pb={4} key={size.toString()}>
            <Skeleton variant="text" width={size} height="25px" />
            <Skeleton variant="text" width={size} height="25px" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

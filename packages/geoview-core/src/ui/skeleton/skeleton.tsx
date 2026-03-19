import type { SkeletonProps } from '@mui/material';
import { Skeleton as MaterialSkeleton } from '@mui/material';

/**
 * Material-UI Skeleton component for loading state placeholders.
 *
 * Wraps Material-UI's Skeleton to provide animated placeholder elements while content loads.
 * Supports multiple variants (text, circular, rectangular) and customizable dimensions.
 * All Material-UI Skeleton props are supported and passed through directly.
 *
 * @param props - Skeleton configuration (see SkeletonProps)
 * @returns Skeleton placeholder element with animation
 *
 * @example
 * ```tsx
 * // Text skeleton with specific dimensions
 * <Skeleton variant="text" width={200} height={20} />
 *
 * // Circular skeleton
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * // Rectangular skeleton with wave animation
 * <Skeleton variant="rectangular" width="100%" height={118} animation="wave" />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-skeleton/}
 */
function SkeletonUI(props: SkeletonProps): JSX.Element {
  return <MaterialSkeleton {...props} />;
}

export const Skeleton = SkeletonUI;

import { Skeleton as MaterialSkeleton, SkeletonProps } from '@mui/material';

/**
 * Create a customized Material UI Skeleton component.
 * This is a simple wrapper around MaterialSkeleton that maintains
 * full compatibility with Material-UI's Skeleton props.
 *
 * @param {SkeletonProps} props - All valid Material-UI Skeleton props
 * @returns {JSX.Element} The Skeleton component
 */
export function Skeleton(props: SkeletonProps): JSX.Element {
  return <MaterialSkeleton {...props} />;
}

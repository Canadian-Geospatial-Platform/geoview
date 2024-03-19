import { Skeleton as MaterialSkeleton, SkeletonProps } from '@mui/material';

/**
 * Skeleton Component
 * @param {string} variant style of the variant inherit from material ui.
 * @param {number} width width of the skeleton
 * @param {height} height height of the skeleton
 * @returns JSX.Element
 */
export function Skeleton({ variant, width = 250, height = 250, ...rest }: SkeletonProps) {
  return <MaterialSkeleton variant={variant} width={width} height={height} {...rest} />;
}

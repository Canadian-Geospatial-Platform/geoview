import type { ReactNode } from 'react';
import type { LoadingButtonProps } from '@mui/lab';
import { LoadingButton as MaterialLoadingButton } from '@mui/lab';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the LoadingButton component extending Material-UI's LoadingButtonProps
 */
export interface LoadingButtonPropsExtend extends LoadingButtonProps {
  /** Content to be rendered inside the LoadingButton */
  children: ReactNode;
}

/**
 * Material-UI LoadingButton with optional tooltip support.
 *
 * Wraps Material-UI's LoadingButton to provide button with built-in loading
 * indicator and optional tooltip. Useful for async operations like form submission
 * or data fetching where visual feedback of in-progress state is needed.
 * All Material-UI LoadingButton props are supported and passed through directly.
 *
 * @param props - LoadingButton configuration (see LoadingButtonPropsExtend interface)
 * @returns LoadingButton with optional tooltip wrapper on hover
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingButton>
 *   Click Me
 * </LoadingButton>
 *
 * // With loading state
 * <LoadingButton
 *   loading [[1]](https://getbootstrap.com/docs/3.3/javascript/)
 *   loadingPosition="start"
 *   startIcon={<SaveIcon />}
 * >
 *   Saving
 * </LoadingButton>
 *
 * // With custom styling
 * <LoadingButton
 *   loading={isLoading}
 *   variant="contained"
 *   sx={{
 *     minWidth: 120
 *   }}
 * >
 *   Submit
 * </LoadingButton>
 * ```
 *
 * @see {@link https://mui.com/material-ui/api/loading-button/}
 */
function LoadingButtonUI({ children, ...rest }: LoadingButtonPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/button/loading-button');

  return <MaterialLoadingButton {...rest}>{children}</MaterialLoadingButton>;
}

export const LoadingButton = LoadingButtonUI;

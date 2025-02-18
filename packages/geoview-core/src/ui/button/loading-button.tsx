import { ReactNode } from 'react';
import { LoadingButton as MaterialLoadingButton, LoadingButtonProps } from '@mui/lab';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the LoadingButton component extending Material-UI's LoadingButtonProps
 */
export interface LoadingButtonPropsExtend extends LoadingButtonProps {
  /** Content to be rendered inside the LoadingButton */
  children: ReactNode;
}

/**
 * A customized Material-UI Loading Button component.
 *
 * @component
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
 * @param {LoadingButtonPropsExtend} props - The properties for the LoadingButton component
 * @returns {JSX.Element} A rendered LoadingButton component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/api/loading-button/}
 */
function LoadingButtonUI({ children, ...rest }: LoadingButtonPropsExtend): JSX.Element {
  logger.logTraceRender('ui/button/loading-button');

  return <MaterialLoadingButton {...rest}>{children}</MaterialLoadingButton>;
}

export const LoadingButton = LoadingButtonUI;

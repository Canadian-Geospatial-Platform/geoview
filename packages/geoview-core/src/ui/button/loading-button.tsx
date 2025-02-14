import { memo, ReactNode } from 'react';
import { LoadingButton as MaterialLoadingButton, LoadingButtonProps } from '@mui/lab';
import { logger } from '@/core/utils/logger';

interface LoadingButtonType extends LoadingButtonProps {
  children: ReactNode;
}

/**
 * Create a customized Material UI Loading Button component.
 * This is a simple wrapper around MaterialLoadingButton that maintains
 * full compatibility with Material-UI's Loading Button props.
 *
 * @param {LoadingButtonProps} props - All valid Material-UI Badge props + children
 * @returns {JSX.Element} The Loading Button component
 */
export const LoadingButton = memo(function LoadingButton({ children, ...rest }: LoadingButtonType): JSX.Element {
  logger.logTraceRender('ui/button/loading-button');

  return <MaterialLoadingButton {...rest}>{children}</MaterialLoadingButton>;
});

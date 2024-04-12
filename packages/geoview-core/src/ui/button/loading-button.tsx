import { LoadingButton as MaterialLoadingButton, LoadingButtonProps } from '@mui/lab';
import { ReactNode } from 'react';

interface LoadingButtonType extends LoadingButtonProps {
  children: ReactNode;
}

export function LoadingButton({ children, ...rest }: LoadingButtonType): JSX.Element {
  return <MaterialLoadingButton {...rest}>{children}</MaterialLoadingButton>;
}

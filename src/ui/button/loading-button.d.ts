import { LoadingButtonProps } from '@mui/lab';
import { ReactNode } from 'react';
interface LoadingButtonType extends LoadingButtonProps {
    children: ReactNode;
}
export declare function LoadingButton({ children, ...rest }: LoadingButtonType): JSX.Element;
export {};

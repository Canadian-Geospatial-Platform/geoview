import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { CircularProgressProps } from '@mui/material';
/**
 * Circular Progress Properties
 */
interface TypeCircularProgressProps extends CircularProgressProps {
    isLoaded: boolean;
    style?: CSSProperties;
    sx?: SxProps<Theme>;
}
/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export declare function CircularProgress(props: TypeCircularProgressProps): JSX.Element;
export {};

import { CSSProperties } from 'react';
import { CircularProgressProps } from '@mui/material';
/**
 * Circular Progress Properties
 */
interface TypeCircularProgressProps extends CircularProgressProps {
    className?: string;
    style?: CSSProperties;
    isLoaded: boolean;
}
/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export declare function CircularProgress(props: TypeCircularProgressProps): JSX.Element;
export {};

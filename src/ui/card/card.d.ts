/// <reference types="react" />
import { CardProps } from '@mui/material';
export interface TypeCardProps extends CardProps {
    title?: string;
    contentCard?: React.ReactNode | Element;
}
/**
 * Create a customized Material UI Card
 *
 * @param {TypeCardProps} props the properties passed to the Card element
 * @returns {JSX.Element} the created Card element
 */
export declare function Card(props: TypeCardProps): JSX.Element;

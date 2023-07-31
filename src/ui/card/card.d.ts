import { ReactNode } from 'react';
import { CardProps } from '@mui/material';
export interface TypeCardProps extends CardProps {
    title?: string;
    contentCard?: ReactNode;
}
/**
 * Create a customized Material UI Card
 *
 * @param {TypeCardProps} props the properties passed to the Card element
 * @returns {JSX.Element} the created Card element
 */
export declare function Card(props: TypeCardProps): JSX.Element;

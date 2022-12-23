/// <reference types="react" />
import { ListProps } from '@mui/material';
/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
    type?: 'ul' | 'ol';
    innerref?: (element: HTMLElement | null) => void;
}
/**
 * Create a customized Material UI List
 *
 * @param {TypeListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export declare function List(props: TypeListProps): JSX.Element;

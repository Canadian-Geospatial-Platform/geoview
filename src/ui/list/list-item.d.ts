/// <reference types="react" />
import { ListItemProps } from '@mui/material';
/**
 * Custom MUI ListItem Props
 */
interface TypeListItemProps extends ListItemProps {
    innerref?: (element: HTMLElement | null) => void;
}
/**
 * Create a customized Material UI List Item
 *
 * @param {TypeListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export declare function ListItem(props: TypeListItemProps): JSX.Element;
export {};

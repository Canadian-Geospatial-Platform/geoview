import { CSSProperties } from 'react';
/**
 * Properties for the Custom Select component
 */
interface TypeCustomSelectProps {
    labelId: string;
    className?: string;
    style?: CSSProperties;
    label: string;
    selectItems: Array<Record<string, TypeSelectItems>> | Array<Record<string, TypeItemProps>>;
    callBack?: <T>(params: T) => void;
    helperText?: string;
    multiple?: boolean;
}
/**
 * Required and optional properties for the items (options) of select
 */
interface TypeSelectItems {
    category?: string;
    items: Array<TypeItemProps>;
}
/**
 * Required and optional properties for the item object
 */
export interface TypeItemProps {
    itemId: string;
    value: string;
    default?: boolean;
}
/**
 * Create a customizable Material UI Select
 *
 * @param {TypeCustomSelectProps} props the properties passed to the Select component
 * @returns {JSX.Element} the created Select element
 */
export declare function CustomSelect(props: TypeCustomSelectProps): JSX.Element;
export {};

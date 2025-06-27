import { ListProps } from '@mui/material';
/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
    type?: 'ul' | 'ol';
}
export declare const List: import("react").ForwardRefExoticComponent<Omit<TypeListProps, "ref"> & import("react").RefAttributes<HTMLUListElement>>;
//# sourceMappingURL=list.d.ts.map
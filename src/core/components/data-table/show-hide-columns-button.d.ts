import type { MRT_TableInstance as MRTTableInstance } from 'material-react-table';
import type { DataTableRow } from './data-table-types';
/** Properties for the ShowHideColumnsButton component. */
interface ShowHideColumnsButtonProps {
    /** The Material React Table instance. */
    table: MRTTableInstance<DataTableRow>;
}
/**
 * Renders a show/hide columns button with a keyboard-navigable menu.
 *
 * @param props - Properties defined in ShowHideColumnsButtonProps interface
 * @returns The show/hide columns button element
 */
export declare function ShowHideColumnsButton({ table }: ShowHideColumnsButtonProps): JSX.Element;
export {};
//# sourceMappingURL=show-hide-columns-button.d.ts.map
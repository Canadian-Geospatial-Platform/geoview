import type { CSSProperties } from 'react';
import type { Theme } from '@mui/material/styles';
import type { SxProps, SxStyles } from '@/ui/style/types';
/**
 * Styles the data table modal content area.
 */
export declare const dataTableModalContentStyle: CSSProperties;
/**
 * Gets styles for the data table modal text container.
 *
 * @param theme - The theme object
 * @returns The data table modal text container styles
 */
export declare const getDataTableModalContentTextStyle: (theme: Theme) => CSSProperties;
/**
 * Sx for truncated, single-line cell content (tooltip wrapper).
 *
 * No theme dependency, so exported as a standalone constant for components without theme access.
 */
export declare const truncatedCellContentSx: SxProps<Theme>;
/**
 * Gets custom sx classes for the data table.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxStyles;
//# sourceMappingURL=data-table-style.d.ts.map
import type { Theme } from '@mui/material/styles';
import type { SxProps, SystemStyleObject } from '@mui/system';
/** Style definitions for the map information rotation button. */
interface MapInfoRotationButtonStyles {
    /** Styles for the button container. */
    container: SxProps<Theme>;
    /** Styles for the rotating arrow; kept as a single object for safe sx-array composition. */
    arrow: SystemStyleObject<Theme>;
}
/**
 * Gets custom sx classes for the map information rotation button.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => MapInfoRotationButtonStyles;
export {};
//# sourceMappingURL=map-info-rotation-button-style.d.ts.map
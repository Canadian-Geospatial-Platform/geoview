import { Theme } from '@mui/material/styles';
type SxClasses = Record<string, object>;
/**
 * Generates the main SX classes for styling components
 * @param {boolean} isFullScreen - Indicates if the component is in fullscreen mode
 * @param {number} footerPanelResizeValue - The resize value for the footer panel in viewport height units
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is collapsed
 * @param {string} containerType - The type of container ('app-bar' or 'footer-bar')
 * @returns {SxClasses} An object containing the style classes
 */
export declare const getSxClassesMain: (isFullScreen: boolean, footerPanelResizeValue: number, footerBarIsCollapsed: boolean, containerType: string) => SxClasses;
/**
 * Get custom sx classes for the legend
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxClasses;
export {};

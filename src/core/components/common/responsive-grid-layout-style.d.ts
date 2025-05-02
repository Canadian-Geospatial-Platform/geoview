import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';
type SxClasses = Record<string, object>;
/**
 * Generates the main SX classes for styling components
 * @param {boolean} isFullScreen - Indicates if the component is in fullscreen mode
 * @param {number} footerPanelResizeValue - The resize value for the footer panel in viewport height units
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is collapsed
 * @param {string} containerType - The type of container ('app-bar' or 'footer-bar')
 * @returns {SxClasses} An object containing the style classes
 */
export declare const getSxClassesMain: (isFullScreen: boolean, footerPanelResizeValue: number, mapHeight: number, footerBarIsCollapsed: boolean, containerType: string) => SxClasses;
/**
 *  Get custom sx classes for the common grid layout
 *
 * @param {Theme} theme - The MUI theme object containing styling configurations
 * @param {boolean} isMapFullScreen - Indicates if the map is in fullscreen mode
 * @param {number} footerPanelResizeValue - The resize value for the footer panel in pixels
 * @param {number} mapHeight - The height of the map component in pixels
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is collapsed
 * @param {string} containerType - The type of container being styled
 * @param {number} topHeight - The height of the top section in pixels
 * @returns {SxStyles} An object containing MUI SX styling properties
 */
export declare const getSxClasses: (theme: Theme, isMapFullScreen: boolean, footerPanelResizeValue: number, mapHeight: number, footerBarIsCollapsed: boolean, containerType: string, topHeight: number) => SxStyles;
export {};

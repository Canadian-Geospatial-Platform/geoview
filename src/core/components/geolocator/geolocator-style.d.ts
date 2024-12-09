import { Input, Theme } from '@mui/material';
import { SxStyles } from '@/ui/style/types';
/**
 * Get custom sx classes for the geolocator
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxStyles;
/**
 * Get custom sx classes for the geolocator list
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export declare const getSxClassesList: (theme: Theme) => SxStyles;
export declare const StyledInputField: typeof Input;

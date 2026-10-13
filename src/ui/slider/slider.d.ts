import type { AriaAttributes, CSSProperties, ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { type SliderProps as MuiSliderProps } from '@mui/material';
import type { Mark } from '@mui/material/Slider/useSlider.types';
/**
 * Properties for the Slider.
 */
type SliderProps = {
    /** Minimum slider value. */
    min: number;
    /** Maximum slider value. */
    max: number;
    /** Controlled slider value. */
    value?: number[] | number;
    /** Initial value for an uncontrolled slider. */
    defaultValue?: number[] | number;
    /** Additional CSS class name. */
    className?: string;
    /** Inline styles applied to the slider. */
    style?: CSSProperties;
    /** Theme-aware styles applied to the slider. */
    sx?: SxProps<Theme>;
    /** Callback invoked when the slider value changes. */
    onChange?: (value: number | number[], activeThumb: number) => void;
    /** Callback invoked when a slider interaction is committed. */
    onChangeCommitted?: (value: number | number[]) => void;
    /** Formats the visible value label. */
    onValueLabelFormat?: (value: number, index: number) => string;
    /** Formats the accessible value text. */
    onValueDisplayAriaLabel?: (value: number, index: number) => string;
    /** Callback invoked when a key is pressed on the slider. */
    onKeyDown?: (event: React.KeyboardEvent) => void;
    /** Whether the slider is disabled. */
    disabled?: boolean;
    /** Marks displayed along the slider track. */
    marks?: Mark[];
    /** Slider orientation. */
    orientation?: 'vertical' | 'horizontal';
    /** Distance between slider steps; null permits mark-only steps. */
    step?: number | null;
    /** Slider size. */
    size?: 'small' | 'medium';
    /** Track display mode. */
    track?: 'inverted' | 'normal' | false;
    /** MUI value label format. */
    valueLabelFormat?: string | ((value: number, index: number) => ReactNode);
    /** Visibility of the value label. */
    valueLabelDisplay?: 'auto' | 'on' | 'off';
    /** Props passed to MUI slider slots. */
    slotProps?: MuiSliderProps['slotProps'];
    /** Per-thumb aria-label, taking precedence over aria-label; use for range sliders without aria-labelledby. */
    getAriaLabel?: (index: number) => string;
} & AriaAttributes;
/**
 * Custom Material-UI Slider component with advanced label and mark management.
 *
 * Wraps Material-UI's Slider with intelligent mark limiting (max 30 visible marks)
 * and overlap detection for labels. Handles both single and range values, controlled
 * and uncontrolled modes. Includes keyboard focus workaround for arrow key interactions.
 * Accepts standard ARIA attributes and forwards them to the underlying MUI slider.
 *
 * MUI uses getAriaLabel(index) instead of aria-label when both are supplied. A valid
 * aria-labelledby reference takes precedence over either in accessible-name computation.
 * Prefer one naming strategy: aria-label or aria-labelledby for a single thumb, and
 * getAriaLabel for distinct range-thumb names. Input slot props can override these attributes.
 *
 * @param props - Slider configuration (see SliderProps)
 * @returns Slider component with optimized mark/label rendering
 *
 * @example
 * ```tsx
 * // Basic range slider
 * <Slider min={0} max={100} value={[30, 70]} onChange={handleChange} />
 *
 * // With marks and labels
 * <Slider
 *   min={0}
 *   max={100}
 *   marks={[{ value: 0, label: '0' }, { value: 100, label: '100' }]}
 *   valueLabelDisplay="on"
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-slider/}
 */
declare function SliderUI(props: SliderProps): JSX.Element;
export declare const Slider: typeof SliderUI;
export {};
//# sourceMappingURL=slider.d.ts.map
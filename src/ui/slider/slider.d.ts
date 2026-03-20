import type { CSSProperties, ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Mark } from '@mui/base';
/**
 * Properties for the Slider
 */
type SliderProps = {
    min: number;
    max: number;
    value?: number[] | number;
    defaultValue?: number[] | number;
    className?: string;
    style?: CSSProperties;
    sx?: SxProps<Theme>;
    onChange?: (value: number | number[], activeThumb: number) => void;
    onChangeCommitted?: (value: number | number[]) => void;
    onValueLabelFormat?: (value: number, index: number) => string;
    onValueDisplayAriaLabel?: (value: number, index: number) => string;
    disabled?: boolean;
    marks?: Mark[];
    orientation?: 'vertical' | 'horizontal';
    step?: number | null;
    size?: 'small' | 'medium';
    track?: 'inverted' | 'normal' | false;
    ariaLabelledby?: string;
    valueLabelFormat?: string | ((value: number, index: number) => ReactNode);
    valueLabelDisplay?: 'auto' | 'on';
};
/**
 * Custom Material-UI Slider component with advanced label and mark management.
 *
 * Wraps Material-UI's Slider with intelligent mark limiting (max 30 visible marks)
 * and overlap detection for labels. Handles both single and range values, controlled
 * and uncontrolled modes. Includes keyboard focus workaround for arrow key interactions.
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
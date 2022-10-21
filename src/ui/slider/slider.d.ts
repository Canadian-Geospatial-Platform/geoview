import { CSSProperties } from 'react';
import { SliderProps } from '@mui/material';
/**
 * Properties for the Slider
 */
interface TypeSliderProps extends SliderProps {
    sliderId: string;
    className?: string;
    style?: CSSProperties;
    min: number;
    max: number;
    value: Array<number> | number;
    customOnChange?: (value: number[] | number) => void;
    disabled?: boolean;
    marks?: Array<{
        label?: string;
        value: number;
    }>;
    orientation?: 'vertical' | 'horizontal' | undefined;
    step?: number;
    size?: 'small' | 'medium';
    track?: 'inverted' | 'normal' | false;
    ariaLabelledby?: string;
    mapId?: string;
}
/**
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
export declare function Slider(props: TypeSliderProps): JSX.Element;
export {};

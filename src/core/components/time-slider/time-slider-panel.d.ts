import React from 'react';
import { SliderFilterProps } from './time-slider-api';
interface TimeSliderPanelProps {
    mapId: string;
    layerPath: string;
    sliderFilterProps: SliderFilterProps;
}
/**
 * Creates a panel with time sliders
 *
 * @param {TimeSliderPanelProps} TimeSliderPanelProps time slider panel properties
 * @returns {JSX.Element} the slider panel
 */
export declare function TimeSliderPanel(TimeSliderPanelProps: TimeSliderPanelProps): React.JSX.Element;
export {};

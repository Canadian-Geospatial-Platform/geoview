import { useState, useEffect, CSSProperties, useLayoutEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Slider as MaterialSlider } from '@mui/material';
import { Mark } from '@mui/base';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from '@/ui/slider/slider-style';
import { generateId } from '@/core/utils/utilities';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';

/**
 * Properties for the Slider
 */
type SliderProps = {
  // Important props: min, max, value
  min: number;
  max: number;
  value: Array<number> | number;

  // custom slider classes and styles
  className?: string;
  style?: CSSProperties;

  // custom onChange callback
  onChange?: (value: number | number[], activeThumb: number) => void;
  onChangeCommitted?: (value: number | number[]) => void;
  onValueLabelFormat?: (value: number, index: number) => string;
  onValueDisplayAriaLabel?: (value: number, index: number) => string;

  // MUI optional props
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
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
function SliderUI(props: SliderProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/slider/slider');

  // Get constant from props
  const {
    value: parentValue,
    min,
    max,
    marks,
    valueLabelDisplay,
    orientation,
    className,
    onChange,
    onChangeCommitted,
    onValueLabelFormat,
    onValueDisplayAriaLabel,
    ...properties
  } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Ref
  const sliderRef = useRef<HTMLDivElement>(null);

  const containerId = generateId(18);
  const valueLabelDisplayOption = valueLabelDisplay === undefined ? 'on' : 'auto';

  // State
  const [value, setValue] = useState<number[] | number>(parentValue);
  const [activeThumb, setActiveThumb] = useState<number>(-1);

  // Memoize the className calculation
  const finalClassName = useMemo(() => {
    const shouldSpreadLabel = Array.isArray(value) && value.length >= 2 && (!orientation || orientation === 'horizontal');

    if (!shouldSpreadLabel) return className;

    return className ? `${className} MuiSlider-labelSpread` : 'MuiSlider-labelSpread';
  }, [value, orientation, className]);

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], newActiveThumb: number): void => {
    // Update the internal state
    setActiveThumb(newActiveThumb);
    setValue(newValue);
    event.preventDefault();

    // Callback
    onChange?.(newValue, activeThumb);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]): void => {
    // Callback
    onChangeCommitted?.(newValue);
  };

  // Focus on slider handle
  const focusSlider = useCallback(() => {
    if (sliderRef.current) {
      // Find the hidden input element and focus it
      const input = sliderRef.current.querySelectorAll('input[type="range"]');
      if (input[0]) {
        (input[0] as HTMLElement).focus();
      }
    }
  }, []);

  // GV There is a bug with focus on slider element. When the arrow key is pressed, the event trigger value change
  // GV for the slider then the slider value is updated. This causes the slider to lose focus.
  // GV The solution is to manually focus the slider element when the arrow key is pressed.
  // GV This is a workaround until the issue is fixed in the Material UI library.
  // GV When there is 2 handles, the focus on the second handle is lost and the focus is back to first handle
  // TODO: https://github.com/Canadian-Geospatial-Platform/geoview/issues/2560
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        focusSlider();
      }
    },
    [focusSlider]
  );

  /**
   * Checks if two HTML elements overlap, considering the slider's orientation and adding padding.
   *
   * @param {HTMLElement} el1 - The first element to check for overlap.
   * @param {HTMLElement} el2 - The second element to check for overlap.
   * @param {string} [orientationIn='horizontal'] - The orientation of the slider ('horizontal' or 'vertical').
   * @returns {boolean} True if the elements overlap, false otherwise.
   */
  const checkOverlap = useCallback((el1: HTMLElement, el2: HTMLElement, orientationIn: string): boolean => {
    if (!el1 || !el2) return false;
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const padding = 50;

    return orientationIn === 'vertical'
      ? !(rect1.bottom + padding < rect2.top || rect1.top > rect2.bottom + padding)
      : !(rect1.right + padding < rect2.left || rect1.left > rect2.right + padding);
  }, []);

  /**
   * Removes overlapping labels in a slider component.
   *
   * @description
   * This function identifies and hides overlapping labels in a slider component.
   * It works for both horizontal and vertical sliders, starting from both ends
   * and moving towards the center. The function ensures that the maximum number
   * of labels are visible without overlap.
   *
   * The process includes:
   * 1. Identifying the slider container and its orientation.
   * 2. Resetting all labels to visible state.
   * 3. Iterating through labels from both ends, hiding those that overlap.
   * 4. Special handling for the middle label in case of an odd number of labels.
   *
   * @see checkOverlap - The helper function used to determine if two labels overlap.
   */
  const removeLabelOverlap = useCallback((): void => {
    logger.logTraceUseCallback('UI.SLIDER - removeLabelOverlap');

    // get slider container
    const container = document.getElementById(containerId);
    if (!container) return;

    // get slider labels
    const markers = container.getElementsByClassName('MuiSlider-markLabel');
    const markerArray = Array.from(markers) as HTMLElement[];

    // Get orientation from the container
    const orientationIn = container.classList.contains('MuiSlider-vertical') ? 'vertical' : 'horizontal';

    // Reset all labels
    markerArray.forEach((marker) => marker.classList.remove('MuiSlider-markLabel-overlap'));

    let left = 0;
    let right = markerArray.length - 1;
    let lastVisibleLeft = 0;
    let lastVisibleRight = markerArray.length - 1;

    while (left < right) {
      // Check from left
      if (left === 0 || !checkOverlap(markerArray[lastVisibleLeft], markerArray[left], orientationIn)) {
        lastVisibleLeft = left;
      } else {
        markerArray[left].classList.add('MuiSlider-markLabel-overlap');
      }

      // Check from right
      if (right === markerArray.length - 1 || !checkOverlap(markerArray[right], markerArray[lastVisibleRight], orientationIn)) {
        lastVisibleRight = right;
      } else {
        markerArray[right].classList.add('MuiSlider-markLabel-overlap');
      }

      left++;
      right--;
    }

    // Handle middle element if odd number of markers
    // TODO: there is still issue when previous to middle interfere with last in Ontario ring of fire (time slider config- small screen)
    if (left === right) {
      const middleElement = markerArray[left];
      const overlapWithLeft = checkOverlap(markerArray[lastVisibleLeft], middleElement, orientationIn);
      const overlapWithRight = checkOverlap(middleElement, markerArray[lastVisibleRight], orientationIn);

      if (!overlapWithLeft && !overlapWithRight) {
        lastVisibleLeft = left;
      } else {
        middleElement.classList.add('MuiSlider-markLabel-overlap');
      }
    }
  }, [checkOverlap, containerId]);
  useEventListener<Window>('resize', removeLabelOverlap, window);

  useEffect(() => {
    logger.logTraceUseEffect('UI.SLIDER - parent value', parentValue);

    // Update it internally when the parent has updated the value
    setValue(parentValue);
  }, [parentValue]);

  useEffect(() => {
    logger.logTraceUseEffect('UI.SLIDER - focus when mount');

    // Focus the slider when the component mounts
    focusSlider();
  }, [focusSlider]);

  // Add this new effect to handle slider value changes
  useLayoutEffect(() => {
    logger.logTraceUseEffect('UI.SLIDER - remove overlap on value change');

    removeLabelOverlap();
  }, [value, removeLabelOverlap]);

  return (
    <MaterialSlider
      {...properties}
      id={containerId}
      sx={sxClasses.slider}
      className={finalClassName}
      ref={sliderRef}
      orientation={orientation}
      value={value}
      min={min}
      max={max}
      marks={marks}
      disableSwap
      valueLabelDisplay={valueLabelDisplayOption}
      valueLabelFormat={onValueLabelFormat}
      getAriaLabel={(): string => 'To implement with translation'}
      getAriaValueText={onValueDisplayAriaLabel}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      onKeyDown={handleKeyDown}
    />
  );
}

export const Slider = SliderUI;

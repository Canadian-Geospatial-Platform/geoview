import type { CSSProperties, ReactNode } from 'react';
import { useLayoutEffect, useCallback, useRef, useMemo, useState } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Slider as MaterialSlider, type SliderProps as MuiSliderProps } from '@mui/material';
import type { Mark } from '@mui/base';
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
  value?: number[] | number;
  defaultValue?: number[] | number;

  // custom slider classes and styles
  className?: string;
  style?: CSSProperties;
  sx?: SxProps<Theme>;

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
  slotProps?: MuiSliderProps['slotProps'];
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
function SliderUI(props: SliderProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/slider/slider');

  // Get constant from props
  const {
    value,
    defaultValue,
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
    disabled,
    slotProps,
    ...properties
  } = props;

  // Determine if the component is controlled or not to determine if we need an internal state or not.
  // This is the best-practice according to react and is also how MUI does it internally.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const sliderValue = isControlled ? value : internalValue;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Ref
  const sliderRef = useRef<HTMLDivElement>(null);
  /** Tracks the currently active thumb index for focus management in multi-thumb sliders. */
  const activeThumbRef = useRef<number>(0);

  const containerId = generateId(18);

  const valueLabelDisplayOption = valueLabelDisplay === undefined ? 'on' : 'auto';

  // TODO: Refactor - when refactor time slider, re work logic for marks and label to have all of them inside slider (geochart-time slider)
  /**
   * Limits visible marks to maximum 30 with even distribution.
   */
  const memoProcessedMarks = useMemo((): Mark[] | undefined => {
    // Log
    logger.logTraceUseMemo('SLIDER - memoProcessedMarks', marks);

    if (!marks || marks.length === 0) return marks;

    const maxVisibleMarks = 30;

    // If we have fewer marks than the limit, show them all
    if (marks.length <= maxVisibleMarks) {
      return marks;
    }

    // Get min and max values
    const minValue = Math.min(...marks.map((m) => m.value));
    const maxValue = Math.max(...marks.map((m) => m.value));

    // Calculate minimum spacing to ensure even distribution
    const minSpacing = (maxValue - minValue) / (maxVisibleMarks - 1);

    // Select marks with minimum spacing
    const visibleIndices = new Set<number>();
    visibleIndices.add(0); // Always include first mark

    let lastValue = marks[0].value;
    for (let i = 1; i < marks.length - 1; i++) {
      // If this mark is far enough from the last selected mark
      if (marks[i].value - lastValue >= minSpacing) {
        visibleIndices.add(i);
        lastValue = marks[i].value;
      }
    }

    // Always include last mark
    visibleIndices.add(marks.length - 1);

    // Keep all marks but only show labels on visible ones
    return marks.map((mark, index) => ({
      value: mark.value,
      label: visibleIndices.has(index) ? mark.label : undefined,
    }));
  }, [marks]);

  /**
   * Computes the final className with label spread applied for multi-thumb horizontal sliders.
   */
  const memoFinalClassName = useMemo((): string | undefined => {
    // Log
    logger.logTraceUseMemo('SLIDER - memoFinalClassName', sliderValue, orientation);

    const shouldSpreadLabel = Array.isArray(sliderValue) && sliderValue.length >= 2 && (!orientation || orientation === 'horizontal');

    if (!shouldSpreadLabel) return className;

    return className ? `${className} MuiSlider-labelSpread` : 'MuiSlider-labelSpread';
  }, [sliderValue, orientation, className]);

  // #region Handlers

  /**
   * Handles when the user drags the slider thumb to change the value
   */
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], activeThumb: number): void => {
    // Track which thumb is active
    activeThumbRef.current = activeThumb;

    // Update the internal state if not controlled, meaning 'value' isn't provided by the parent component
    if (!isControlled) {
      setInternalValue(newValue);
    }

    event.preventDefault();

    // Callback
    onChange?.(newValue, activeThumb);
  };

  /**
   * Handles when the user completes a slider drag (mouseup)
   */
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]): void => {
    // Callback
    onChangeCommitted?.(newValue);
  };

  // #endregion

  /**
   * Focuses the active slider thumb input element.
   */
  const focusSlider = useCallback((): void => {
    if (sliderRef.current) {
      // Find the hidden input elements
      const inputs = sliderRef.current.querySelectorAll('input[type="range"]');
      // Focus the active thumb's input
      const inputToFocus = inputs[activeThumbRef.current];
      if (inputToFocus) {
        (inputToFocus as HTMLElement).focus();
      }
    }
  }, []);

  // GV There is a bug with MUI Slider focus management. When arrow keys are pressed, the value change
  // GV triggers a re-render which causes the slider to lose focus. The workaround is to manually
  // GV refocus the slider element after arrow key presses. For multi-thumb sliders, we track which
  // GV thumb (via activeThumbRef) is active to ensure focus returns to the correct thumb input,
  // GV enabling independent keyboard control of each thumb.
  // GV See: https://github.com/Canadian-Geospatial-Platform/geoview/issues/2560
  /**
   * Handles keyboard events on the slider to maintain focus during arrow key interactions
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        focusSlider();
      }
    },
    [focusSlider]
  );

  // #endregion

  /**
   * Checks if two HTML elements overlap, considering the slider's orientation and adding padding.
   *
   * @param el1 - The first element to check for overlap
   * @param el2 - The second element to check for overlap
   * @param orientationIn - The orientation of the slider ('horizontal' or 'vertical')
   * @returns True if the elements overlap, false otherwise
   */
  const checkOverlap = useCallback((el1: HTMLElement, el2: HTMLElement, orientationIn: string): boolean => {
    if (!el1 || !el2) return false;
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const padding = 10;

    return orientationIn === 'vertical'
      ? !(rect1.bottom + padding < rect2.top || rect1.top > rect2.bottom + padding)
      : !(rect1.right + padding < rect2.left || rect1.left > rect2.right + padding);
  }, []);

  /**
   * Hides marks that exceed the maximum visible limit.
   *
   * This function hides slider tick marks when there are more than 20 marks total.
   * It keeps all marks in the DOM for proper slider snapping behavior, but visually
   * hides marks (those beyond the 20 visible limit).
   * This maintains slider functionality while reducing visual clutter.
   */
  const hideExcessMarks = useCallback((): void => {
    // Get slider container
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get all marks and labels
    const marksOri = container.getElementsByClassName('MuiSlider-mark');
    const labels = container.getElementsByClassName('MuiSlider-markLabel');
    const marksArray = Array.from(marksOri) as HTMLElement[];
    const labelsArray = Array.from(labels) as HTMLElement[];

    // Get the positions of all labels
    const labelPositions = new Set(labelsArray.map((label) => parseFloat(label.style.left || '0')));

    // Hide marks that don't have a corresponding label
    marksArray.forEach((mark) => {
      const markPosition = parseFloat(mark.style.left || '0');
      if (labelPositions.has(markPosition)) {
        mark.classList.remove('MuiSlider-mark-hidden');
      } else {
        mark.classList.add('MuiSlider-mark-hidden');
      }
    });
  }, [containerId]);

  /**
   * Removes overlapping labels in a slider component.
   *
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

    // If only one marker early return
    if (markerArray.length <= 1) return;

    // Greedy left-to-right pass
    let lastVisible = 0;
    const n = markerArray.length;

    // Always show the first label
    markerArray[0].classList.remove('MuiSlider-markLabel-overlap');

    // Hide all in-between labels if they overlap with the last visible
    for (let i = 1; i < n - 1; i++) {
      if (checkOverlap(markerArray[lastVisible], markerArray[i], orientationIn)) {
        markerArray[i].classList.add('MuiSlider-markLabel-overlap');
      } else {
        lastVisible = i;
      }
    }

    // Always show the last label
    markerArray[n - 1].classList.remove('MuiSlider-markLabel-overlap');

    // Second pass: If last visible in-between label overlaps with last marker, hide it
    if (lastVisible !== 0 && lastVisible !== n - 1 && checkOverlap(markerArray[lastVisible], markerArray[n - 1], orientationIn)) {
      markerArray[lastVisible].classList.add('MuiSlider-markLabel-overlap');
    }

    // Hide marks that exceed the visible limit
    hideExcessMarks();
  }, [checkOverlap, containerId, hideExcessMarks]);
  useEventListener<Window>('resize', removeLabelOverlap, window);

  // Add this new effect to handle slider value changes
  useLayoutEffect(() => {
    logger.logTraceUseEffect('UI.SLIDER - remove overlap on value change', sliderValue);

    removeLabelOverlap();
  }, [sliderValue, removeLabelOverlap]);

  return (
    <MaterialSlider
      {...properties}
      id={containerId}
      sx={disabled ? null : sxClasses.slider}
      className={memoFinalClassName}
      ref={sliderRef}
      orientation={orientation}
      value={sliderValue}
      min={min}
      max={max}
      marks={memoProcessedMarks}
      disableSwap
      valueLabelDisplay={valueLabelDisplayOption}
      valueLabelFormat={onValueLabelFormat}
      getAriaValueText={onValueDisplayAriaLabel}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      slotProps={slotProps}
    />
  );
}

export const Slider = SliderUI;

import { Box } from 'geoview-core/ui';
import { useStoreLayerAreLayersLoading } from 'geoview-core/core/stores/states/layer-state';
import { useStoreTimeSliderLayer } from 'geoview-core/core/stores/states/time-slider-state';
import {
  useStoreLayerDateTemporalMode,
  useStoreLayerDisplayDateFormat,
  useStoreLayerDisplayDateFormatShort,
  useStoreLayerDisplayDateTimezone,
  useStoreLayerNameSet,
  useStoreLayerVisibleSet,
} from 'geoview-core/core/stores/states/layer-state';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/states/app-state';
import { logger } from 'geoview-core/core/utils/logger';
import type { DateTimeStepUnit } from 'geoview-core/core/utils/date-mgt';
import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { getSxClasses, SLIDER_WIDTH_STYLE } from './time-slider-style';
import { visuallyHidden } from 'geoview-core/ui/style/default';
import { Switch } from 'geoview-core/ui/switch/switch';
import { useTimeSliderController } from 'geoview-core/core/controllers/use-controllers';

import type { SxStyles } from 'geoview-core/ui/style/types';

/** Number of equal increments used when no configured or calendar step is available. */
const DEFAULT_CONTINUOUS_STEP_COUNT = 20;

/** One-millisecond native step used so calendar ranges can reach exact endpoints before snapping. */
const CALENDAR_SLIDER_NATIVE_STEP = 1;

/** Number of calendar steps applied for a single Page Up/Down key press, mirroring the native range input's larger jump. */
const CALENDAR_SLIDER_PAGE_STEP_MULTIPLIER = 10;

/** Applies calendar stepping to continuous slider values while preserving discrete service values. */
function getCalendarStepValues(
  values: number[],
  anchor: number,
  stepUnit: DateTimeStepUnit | undefined,
  discreteValues: boolean
): number[] {
  // Service-provided discrete ranges already define their valid slider positions.
  return stepUnit && !discreteValues ? DateMgt.snapValuesToCalendarStep(values, anchor, stepUnit) : values;
}

/** Properties for the TimeSlider component. */
interface TimeSliderProps {
  /** The layer path displayed by the time slider. */
  layerPath: string;

  /** Optional callback used to request panel closure. */
  onRequestClose?: () => void;

  /** Whether the panel is currently displayed in fullscreen mode. */
  isFullScreen?: boolean;
}

/**
 * Creates a panel with time sliders.
 *
 * @param props - Properties defined in TimeSliderProps interface
 * @returns The slider panel
 */
export function TimeSlider(props: TimeSliderProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-time-slider/time-slider', props);

  const { cgpv } = window;
  const { layerPath, onRequestClose, isFullScreen = false } = props;
  const { reactUtilities, ui } = cgpv;
  const { useTheme } = ui;
  const { useState, useRef, useEffect, useCallback, useId, useMemo } = reactUtilities.react;
  const {
    Slider,
    Typography,
    Tooltip,
    IconButton,
    LockIcon,
    LockOpenIcon,
    ArrowLeftIcon,
    PlayArrowIcon,
    PauseIcon,
    ArrowRightIcon,
    SwitchRightIcon,
    SwitchLeftIcon,
    RestartAltIcon,
    FormControl,
    InputLabel,
    NativeSelect,
  } = ui.elements;

  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('TIME-SLIDER - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  const playIntervalRef = useRef<number | undefined>(undefined);

  // References for play button
  const sliderValueRef = useRef<number | undefined>(undefined);
  const sliderDeltaRef = useRef<number | undefined>(undefined);
  const activeThumbRef = useRef<number>(0);
  const calendarStepAnchorRef = useRef<number | undefined>(undefined);

  /**
   * Set (via a capture-phase listener, before MUI's native keydown handling runs) whenever a
   * calendar-stepped Arrow/Page key is pressed, so handleSliderChange/handleSliderChangeCommitted
   * can ignore the native 1ms step MUI applies on the way to handleSliderKeyDown (see there).
   */
  const calendarKeyStepRef = useRef<boolean>(false);

  const pendingCloseRef = useRef<boolean>(false);

  /** Wraps the slider so focus can be checked before announcing value changes in the live region. */
  const sliderBoxRef = useRef<HTMLDivElement>(null);

  const displayLanguage = useStoreAppDisplayLanguage();
  const { t } = useTranslation<string>();

  const {
    title,
    additionalLayerpaths,
    description,
    discreteValues,
    step,
    rangeItems,
    minAndMax,
    filtering,
    singleHandle,
    values: storeValues,
    delay,
    locked,
    reversed,
    stepUnit,
    displayDateFormat: displayDateFormatFromStore,
    displayDateFormatShort: displayDateFormatShortFromStore,
    displayDateTimezone: displayDateTimezoneFromStore,
    serviceDateTemporalMode: serviceDateTemporalModeFromStore,
  } = useStoreTimeSliderLayer(layerPath)!;
  const { range } = rangeItems;

  const timeSliderController = useTimeSliderController();

  // The display date format as specified by the layer
  const layerDisplayDateFormat = useStoreLayerDisplayDateFormat(layerPath);
  const displayDateFormat = displayDateFormatFromStore ?? layerDisplayDateFormat;

  // The display date format as specified by the layer
  const layerDisplayDateFormatShort = useStoreLayerDisplayDateFormatShort(layerPath);
  const displayDateFormatShort = displayDateFormatShortFromStore ?? layerDisplayDateFormatShort ?? displayDateFormat;

  // The display date timezone as specified by the layer
  const layerDisplayDateTimezone = useStoreLayerDisplayDateTimezone(layerPath);
  const displayDateTimezone = displayDateTimezoneFromStore ?? layerDisplayDateTimezone;

  // The temporal mode as specified by the layer
  const layerTemporalMode = useStoreLayerDateTemporalMode(layerPath);
  const serviceDateTemporalMode = serviceDateTemporalModeFromStore ?? layerTemporalMode;

  // Get name from legend layers
  const names = useStoreLayerNameSet();
  const layerVisibilities = useStoreLayerVisibleSet();

  const layersAreLoading = useStoreLayerAreLayersLoading();

  /** The lock button tooltip for the current direction and lock state. */
  let lockTooltip: string;
  if (reversed) lockTooltip = locked ? t('timeSlider.slider.unlockRight') : t('timeSlider.slider.lockRight');
  else lockTooltip = locked ? t('timeSlider.slider.unlockLeft') : t('timeSlider.slider.lockLeft');

  /** The lock button label for the current direction. */
  const lockLabel = reversed ? t('timeSlider.slider.lockRight') : t('timeSlider.slider.lockLeft');

  /** Provides a unique ID to associate the time delay label with its select control for accessibility. */
  const timeDelayId = useId();
  /** Provides a unique ID to associate the step value label with its select control for accessibility. */
  const stepValueId = useId();

  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [values, setValues] = useState<number[]>(storeValues);

  /** Converts the configured range values into slider timestamps. */
  const memoTimeStampRange = useMemo((): number[] => {
    logger.logTraceUseMemo('TIME-SLIDER - memoTimeStampRange', range);
    return range.map((entry: string | number | Date) => (typeof entry !== 'number' ? DateMgt.convertToMilliseconds(entry) : entry));
  }, [range]);

  /** Builds sparse visual marks without expanding long calendar ranges. */
  const memoTimeMarks = useMemo((): number[] => {
    logger.logTraceUseMemo('TIME-SLIDER - memoTimeMarks', range, discreteValues, singleHandle, minAndMax, memoTimeStampRange);

    if (range.length < 4 && !discreteValues) {
      const interval = (memoTimeStampRange[memoTimeStampRange.length - 1] - memoTimeStampRange[0]) / 4;
      return [minAndMax[0], minAndMax[0] + interval, minAndMax[0] + interval * 2, minAndMax[0] + interval * 3, minAndMax[1]];
    }

    if (range.length < 6 || singleHandle || discreteValues) return memoTimeStampRange;

    return [
      minAndMax[0],
      memoTimeStampRange[Math.round(range.length / 4)],
      memoTimeStampRange[Math.round(range.length / 2)],
      memoTimeStampRange[Math.round((3 * range.length) / 4)],
      minAndMax[1],
    ];
  }, [discreteValues, minAndMax, memoTimeStampRange, range, singleHandle]);

  /** Formats the sparse marks shown on the slider track. */
  const memoSliderMarks = useMemo((): { value: number; label: string }[] => {
    logger.logTraceUseMemo(
      'TIME-SLIDER - memoSliderMarks',
      displayDateFormatShort,
      displayDateTimezone,
      displayLanguage,
      memoTimeMarks,
      serviceDateTemporalMode
    );
    return memoTimeMarks.map((timeMark) => ({
      value: timeMark,
      label: DateMgt.formatDate(
        timeMark,
        displayDateFormatShort[displayLanguage],
        displayLanguage,
        displayDateTimezone,
        serviceDateTemporalMode
      ),
    }));
  }, [displayDateFormatShort, displayDateTimezone, displayLanguage, memoTimeMarks, serviceDateTemporalMode]);

  /**
   * Moves the slider handles based on the specified direction.
   *
   * @param direction - The direction to move the slider ('back' or 'forward')
   */
  const moveSlider = useCallback(
    (direction: 'back' | 'forward'): void => {
      const isForward = direction === 'forward';
      const stepMove = isForward ? 1 : -1;

      // Handle single handle case with DISCRETE values
      if (singleHandle && discreteValues) {
        // Find current index in the discrete range array
        const currentIndex = memoTimeStampRange.findIndex((timestamp) => timestamp === values[0]);

        if (currentIndex === -1) {
          // Value not found - snap to nearest
          const nearest = DateMgt.findNearestTimestamp(memoTimeStampRange, values[0]);
          timeSliderController.updateTimeSliderValues(layerPath, [nearest]);
          return;
        }

        // Move to next/previous discrete value (with wrapping)
        let newIndex = currentIndex + stepMove;
        if (newIndex >= memoTimeStampRange.length) {
          newIndex = 0; // Wrap to start
        } else if (newIndex < 0) {
          newIndex = memoTimeStampRange.length - 1; // Wrap to end
        }

        timeSliderController.updateTimeSliderValues(layerPath, [memoTimeStampRange[newIndex]]);
        return;
      }

      // Handle single handle case with continuous values
      if (singleHandle && !discreteValues) {
        const interval = step || (minAndMax[1] - minAndMax[0]) / DEFAULT_CONTINUOUS_STEP_COUNT;
        let newPosition = values[0] + interval * stepMove;

        if (stepUnit) {
          newPosition = DateMgt.addCalendarStep(values[0], stepUnit, stepMove);
        }

        // Wrap around at boundaries
        if (newPosition > minAndMax[1]) {
          newPosition = minAndMax[0];
        } else if (newPosition < minAndMax[0]) {
          newPosition = minAndMax[1];
        }

        timeSliderController.updateTimeSliderValues(layerPath, [newPosition]);
        return;
      }

      // Handle multi-handle case
      let [leftHandle, rightHandle] = values;

      // If handles are at the extremes, reset the delta
      if (rightHandle - leftHandle === minAndMax[1] - minAndMax[0]) {
        sliderDeltaRef.current = (minAndMax[1] - minAndMax[0]) / 10;
        timeSliderController.updateTimeSliderValues(
          layerPath,
          isForward ? [leftHandle, leftHandle + sliderDeltaRef.current] : [rightHandle - sliderDeltaRef.current, rightHandle]
        );
        return;
      }

      // Calculate the delta if not already set
      if (!sliderDeltaRef.current) {
        sliderDeltaRef.current = rightHandle - leftHandle;
      }

      const delta = sliderDeltaRef.current * stepMove;

      // Handle locked and reversed case
      if (locked && reversed) {
        leftHandle += delta;
        if ((isForward && leftHandle >= rightHandle) || (!isForward && leftHandle < minAndMax[0])) {
          [leftHandle] = minAndMax;
        }
      }
      // Handle locked case
      else if (locked) {
        if (isForward && rightHandle === minAndMax[1]) rightHandle = leftHandle;
        rightHandle += delta;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
        else if (!isForward && rightHandle < leftHandle) rightHandle = leftHandle;
        if (!isForward && rightHandle === leftHandle) [, rightHandle] = minAndMax;
      }
      // Handle unlocked case
      else if (sliderValueRef.current === undefined || sliderDeltaRef.current === undefined) return;
      else if (isForward) {
        if (leftHandle < sliderValueRef.current && rightHandle === sliderValueRef.current) leftHandle = sliderValueRef.current;
        else leftHandle += delta;
        if (leftHandle >= minAndMax[1]) [leftHandle] = minAndMax;
        rightHandle = leftHandle + sliderDeltaRef.current;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
        if (rightHandle > sliderValueRef.current && leftHandle < sliderValueRef.current) rightHandle = sliderValueRef.current;
      } else {
        if (rightHandle > sliderValueRef.current && leftHandle === sliderValueRef.current) rightHandle = sliderValueRef.current;
        else rightHandle += delta;
        if (rightHandle <= minAndMax[0]) [, rightHandle] = minAndMax;
        leftHandle = rightHandle - sliderDeltaRef.current;
        if (leftHandle < minAndMax[0]) [leftHandle] = minAndMax;
        if (leftHandle < sliderValueRef.current && rightHandle > sliderValueRef.current) leftHandle = sliderValueRef.current;
      }

      timeSliderController.updateTimeSliderValues(layerPath, [leftHandle, rightHandle]);
    },
    [timeSliderController, discreteValues, layerPath, locked, minAndMax, reversed, values, singleHandle, step, stepUnit, memoTimeStampRange]
  );

  /**
   * Moves the slider backward by one step.
   */
  const moveBack = useCallback((): void => {
    moveSlider('back');
  }, [moveSlider]);

  /**
   * Moves the slider forward by one step.
   */
  const moveForward = useCallback((): void => {
    moveSlider('forward');
  }, [moveSlider]);

  // #region Handlers

  /**
   * Handles when the user clicks the back button.
   */
  const handleBack = useCallback((): void => {
    if (isPlaying || !filtering) return;
    sliderValueRef.current = reversed ? values[1] : values[0];
    moveBack();
  }, [moveBack, reversed, values, isPlaying, filtering]);

  /**
   * Handles when the user clicks the forward button.
   */
  const handleForward = useCallback((): void => {
    if (isPlaying || !filtering) return;
    [sliderValueRef.current] = values;
    moveForward();
  }, [moveForward, values, isPlaying, filtering]);

  /**
   * Handles when the user clicks the lock button.
   */
  const handleLock = useCallback((): void => {
    if (isPlaying) return;

    clearTimeout(playIntervalRef.current);
    timeSliderController.setLocked(layerPath, !locked);
  }, [timeSliderController, layerPath, locked, isPlaying]);

  /**
   * Handles when the user clicks the play/pause button.
   */
  const handlePlay = useCallback((): void => {
    if (!filtering) return;
    clearTimeout(playIntervalRef.current);
    sliderValueRef.current = reversed ? values[1] : values[0];
    setIsPlaying(!isPlaying);
  }, [isPlaying, reversed, values, filtering]);

  /**
   * Handles when the user clicks the reverse button.
   */
  const handleReverse = useCallback((): void => {
    if (isPlaying) return;

    clearTimeout(playIntervalRef.current);
    timeSliderController.setReversed(layerPath, !reversed);
  }, [isPlaying, timeSliderController, layerPath, reversed]);

  /**
   * Handles when the user resets the slider values.
   */
  const handleReset = useCallback((): void => {
    clearTimeout(playIntervalRef.current);
    setIsPlaying(false);
    sliderValueRef.current = undefined;
    sliderDeltaRef.current = undefined;
    timeSliderController.resetValues(layerPath);
  }, [layerPath, timeSliderController]);

  /**
   * Handles when the user changes the time delay.
   */
  const handleTimeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      timeSliderController.setDelay(layerPath, Number(event.target.value));
    },
    [timeSliderController, layerPath]
  );

  /**
   * Handles when the user changes the step value.
   */
  const handleStepChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const selectedStepUnit = event.target.value as DateTimeStepUnit;
      calendarStepAnchorRef.current = values[0];

      timeSliderController.setStepUnit(layerPath, selectedStepUnit);
    },
    [timeSliderController, layerPath, values]
  );

  /**
   * Handles when the user toggles the filtering checkbox.
   */
  const handleCheckbox = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, newValue: boolean): void => {
      timeSliderController.updateTimeSliderFiltering(layerPath, newValue);
      if (!newValue) {
        clearTimeout(playIntervalRef.current);
        setIsPlaying(false);
      }
    },
    [timeSliderController, layerPath]
  );

  /**
   * Handles keyboard events on the time slider panel.
   *
   * When a close callback is provided, blocks Esc key during animation or layer
   * loading to prevent focus trap corruption during UI re-renders. Automatically
   * closes the panel once conditions stabilize. Without a close callback, stops
   * animation if needed and lets Esc bubble to parent handlers.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Escape') {
        // When in fullscreen mode, stop animation and let ESC bubble to close the dialog
        if (isFullScreen) {
          // Stop animation if playing to ensure clean state when returning to normal mode
          if (isPlaying) {
            clearTimeout(playIntervalRef.current);
            setIsPlaying(false);
          }
          // Clear any pending close flag from normal mode
          pendingCloseRef.current = false;
          // Let ESC bubble up to FullScreenDialog
          return;
        }

        // If we have a close callback and need to defer closing
        if (onRequestClose && (isPlaying || layersAreLoading)) {
          event.stopPropagation();
          event.preventDefault();

          // Mark that user wants to close
          pendingCloseRef.current = true;

          // Stop animation if playing
          if (isPlaying) {
            clearTimeout(playIntervalRef.current);
            setIsPlaying(false);
          }

          return;
        }

        // If no close callback but animation is playing, stop it and let Escape bubble
        if (isPlaying) {
          clearTimeout(playIntervalRef.current);
          setIsPlaying(false);
        }

        // Clear pending flag when Esc proceeds normally
        pendingCloseRef.current = false;
      }
    },
    [isFullScreen, isPlaying, layersAreLoading, onRequestClose]
  );

  /**
   * Handles when the slider changes in the UI.
   *
   * Adjusts the local state so the Slider thumb updates.
   *
   * Ignores changes while a calendar-stepped key press is in flight (see calendarKeyStepRef):
   * MUI's hidden-input keydown handler fires its own native 1ms-step onChange before
   * handleSliderKeyDown gets a chance to apply the real calendar-stepped value, so this would
   * otherwise commit a throwaway value on every keystroke.
   */
  const handleSliderChange = useCallback(
    (newValues: number | number[], activeThumb: number): void => {
      if (calendarKeyStepRef.current) return;

      clearTimeout(playIntervalRef.current);
      setIsPlaying(false);
      sliderDeltaRef.current = undefined;
      activeThumbRef.current = activeThumb;

      const valuesAsArray = Array.isArray(newValues) ? newValues : [newValues];
      const calendarValues = getCalendarStepValues(valuesAsArray, calendarStepAnchorRef.current ?? minAndMax[0], stepUnit, discreteValues);
      setValues(timeSliderController.constrainValues(layerPath, calendarValues, activeThumb));
    },
    [layerPath, timeSliderController, stepUnit, discreteValues, minAndMax]
  );

  /**
   * Handles when the slider thumb has committed to a value in the slider.
   *
   * Adjusts the main time slider store with the values.
   *
   * Ignores commits while a calendar-stepped key press is in flight (see calendarKeyStepRef and
   * handleSliderChange) — MUI calls onChangeCommitted unconditionally for every keydown, which
   * would otherwise write a throwaway native-stepped value to the store before handleSliderKeyDown
   * applies (and commits) the real calendar-stepped value.
   */
  const handleSliderChangeCommitted = useCallback(
    (newValues: number | number[]): void => {
      if (calendarKeyStepRef.current) return;

      if (discreteValues && singleHandle) {
        const value = Array.isArray(newValues) ? newValues[0] : newValues;
        const nearest = DateMgt.findNearestTimestamp(memoTimeStampRange, value);
        timeSliderController.updateTimeSliderValues(layerPath, [nearest]);
      } else {
        const valuesAsArray = Array.isArray(newValues) ? newValues : [newValues];
        const calendarValues = getCalendarStepValues(
          valuesAsArray,
          calendarStepAnchorRef.current ?? minAndMax[0],
          stepUnit,
          discreteValues
        );
        const constrainedValues = timeSliderController.constrainValues(layerPath, calendarValues, activeThumbRef.current);
        timeSliderController.updateTimeSliderValues(layerPath, constrainedValues);
      }
    },
    [timeSliderController, discreteValues, layerPath, singleHandle, stepUnit, minAndMax, memoTimeStampRange]
  );

  /**
   * Handles keyboard navigation for calendar-stepped, non-discrete sliders.
   *
   * The native 1ms step (see memoSliderStep) snaps right back to the same calendar-aligned
   * value, leaving keyboard users unable to move the thumb (WCAG 2.1.1). This moves the focused
   * thumb by whole calendar units instead, under the same constraints as mouse interactions.
   *
   * MUI applies its native step and fires onChange/onChangeCommitted before this handler runs
   * (it's bound on the Slider root, which only sees the keydown after the hidden thumb input
   * does). handleSliderKeyDownCapture flags that native step so handleSliderChange /
   * handleSliderChangeCommitted ignore it, leaving this handler's value as the only one committed.
   * Discrete and fixed-step sliders keep MUI's default keyboard behaviour.
   */
  const handleSliderKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (!stepUnit || discreteValues) return;

      const isIncrementKey = event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'PageUp';
      const isDecrementKey = event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'PageDown';
      if (!isIncrementKey && !isDecrementKey) return;

      // Suppress the browser's native range-input stepping behaviour (not MUI's own JS-driven step, see JSDoc above).
      event.preventDefault();

      const isPage = event.key === 'PageUp' || event.key === 'PageDown';
      const direction = (isIncrementKey ? 1 : -1) * (isPage ? CALENDAR_SLIDER_PAGE_STEP_MULTIPLIER : 1);

      // Use event.target (the focused hidden thumb input that dispatched the key event), not
      // currentTarget: this handler is bound on the Slider's root element (not the thumb input
      // itself), so currentTarget would always be the root and never carry a 'data-index'.
      const thumbIndex = Number((event.target as HTMLElement | null)?.getAttribute('data-index') ?? 0);

      clearTimeout(playIntervalRef.current);
      setIsPlaying(false);
      sliderDeltaRef.current = undefined;
      activeThumbRef.current = thumbIndex;

      const newValues = [...values];
      const movedValue = DateMgt.addCalendarStep(newValues[thumbIndex] ?? values[0], stepUnit, direction);
      const snappedValue = DateMgt.snapToCalendarStep(movedValue, calendarStepAnchorRef.current ?? minAndMax[0], stepUnit);
      newValues[thumbIndex] = Math.min(minAndMax[1], Math.max(minAndMax[0], snappedValue));

      const constrainedValues = timeSliderController.constrainValues(layerPath, newValues, thumbIndex);
      setValues(constrainedValues);
      timeSliderController.updateTimeSliderValues(layerPath, constrainedValues);

      // Done applying the real value — let subsequent, unrelated changes through again.
      calendarKeyStepRef.current = false;
    },
    [stepUnit, discreteValues, values, minAndMax, timeSliderController, layerPath]
  );

  /**
   * Flags incoming calendar-stepped Arrow/Page keys in the capture phase.
   *
   * Runs before MUI's hidden-input keydown handler (see handleSliderKeyDown).
   */
  const handleSliderKeyDownCapture = useCallback(
    (event: React.KeyboardEvent): void => {
      if (!stepUnit || discreteValues) return;

      const isStepKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key);
      if (isStepKey) calendarKeyStepRef.current = true;
    },
    [stepUnit, discreteValues]
  );

  /**
   * Creates labels for values on slider.
   *
   * @param theValue - The value of the slider handle
   * @returns A formatted time string or ISO date string
   */
  const handleLabelFormat = useCallback(
    (theValue: number): string => {
      // Format the date using displayDateFormat.
      return DateMgt.formatDate(
        theValue,
        displayDateFormat[displayLanguage],
        displayLanguage,
        displayDateTimezone,
        serviceDateTemporalMode
      );
    },
    [displayLanguage, displayDateFormat, displayDateTimezone, serviceDateTemporalMode]
  );

  /**
   * Formats one or two slider timestamps into a single human-readable range string.
   *
   * @param rangeValues - The slider value(s) to format
   * @returns The formatted value, or the formatted start and end values joined by "to"
   */
  const formatRange = useCallback(
    (rangeValues: number[]): string => {
      if (rangeValues.length > 1) {
        return `${handleLabelFormat(rangeValues[0])} ${t('timeSlider.slider.to')} ${handleLabelFormat(rangeValues[rangeValues.length - 1])}`;
      }
      return handleLabelFormat(rangeValues[0]);
    },
    [handleLabelFormat, t]
  );

  /**
   * Provides a user-friendly accessible name for a slider thumb.
   *
   * Includes the layer/panel title in the label itself (instead of an `aria-labelledby` reference)
   * so each thumb keeps its own distinct accessible name while still conveying which layer it
   * belongs to — `aria-labelledby` would take precedence over this per-thumb label and make both
   * thumbs announce the same text.
   *
   * @param index - The index of the slider thumb (0 for the first thumb, 1 for the second)
   * @returns The translated thumb label
   */
  const handleGetAriaLabel = useCallback(
    (index: number): string => {
      const name = title || names[layerPath];
      if (singleHandle) return t('timeSlider.slider.date', { name });
      return index === 0 ? t('timeSlider.slider.startDate', { name }) : t('timeSlider.slider.endDate', { name });
    },
    [singleHandle, t, title, names, layerPath]
  );

  /** The live region message announced to screen readers for the current slider value (see the announcement effect below). */
  const [announcement, setAnnouncement] = useState<string>(() => formatRange(storeValues));

  // #endregion

  // #region USE EFFECT

  /**
   * Schedules the next playback increment when slider state changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - values filtering', values, filtering, reversed, locked);

    // If slider cycle is active, pause before advancing to next increment
    if (isPlaying) {
      if (reversed) playIntervalRef.current = window.setTimeout(moveBack, delay);
      else playIntervalRef.current = window.setTimeout(moveForward, delay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, filtering, reversed, locked]);

  /**
   * Advances to the first increment when playback starts.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - isPlaying', isPlaying);

    if (isPlaying) {
      if (reversed) moveBack();
      else moveForward();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  /**
   * Initializes the calendar sequence from the slider's starting value when a calendar step is already configured.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - calendarStepAnchor', stepUnit, discreteValues, storeValues);

    if (stepUnit && !discreteValues && calendarStepAnchorRef.current === undefined) {
      calendarStepAnchorRef.current = storeValues[0];
    }
  }, [stepUnit, discreteValues, storeValues]);

  /**
   * Keeps the local state values in sync with the store values.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - storeValues', storeValues);

    // Sync local state
    setValues(storeValues);
  }, [storeValues]);

  /**
   * Announces the current slider value to screen readers via the live region.
   *
   * Skipped while playback animation is running, since it would spam the live region on every
   * tick (the final range is announced once playback stops and this effect re-runs), and
   * skipped while focus is on the slider itself, since its native aria-valuetext already
   * announces the change there.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - announcement', storeValues, isPlaying, formatRange);

    if (isPlaying) return;
    if (sliderBoxRef.current?.contains(document.activeElement)) return;

    setAnnouncement(formatRange(storeValues));
  }, [storeValues, isPlaying, formatRange]);

  /**
   * Auto-closes the panel when conditions stabilize after blocked Esc press.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect(
      'TIME-SLIDER - auto-close on stabilization',
      isPlaying,
      layersAreLoading,
      pendingCloseRef.current,
      onRequestClose
    );

    // When both conditions clear and user had pressed Esc, close the panel
    if (!isPlaying && !layersAreLoading && pendingCloseRef.current) {
      pendingCloseRef.current = false;
      onRequestClose?.();
    }
  }, [isPlaying, layersAreLoading, onRequestClose]);

  /**
   * Stops animation when entering or exiting fullscreen mode to ensure clean state.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - fullscreen transition cleanup', isFullScreen, isPlaying);

    // Stop animation when transitioning into fullscreen or out of fullscreen
    if (isPlaying) {
      clearTimeout(playIntervalRef.current);
      setIsPlaying(false);
    }
    // Clear any pending close flag when transitioning between modes
    pendingCloseRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullScreen]);

  // #endregion

  /**
   * Renders a layer name with visibility-aware styling.
   *
   * @param nameLayerPath - The path of the layer whose name is rendered
   * @param prefix - Optional text displayed before the layer name
   * @returns The formatted layer name
   */
  const renderLayerName = (nameLayerPath: string, prefix = ''): JSX.Element => {
    return (
      <Box component="span" key={nameLayerPath} sx={layerVisibilities[nameLayerPath] ? undefined : memoSxClasses.hiddenLayerName}>
        {`${prefix}${names[nameLayerPath]}`}
      </Box>
    );
  };

  /**
   * Renders the configured title or primary layer name.
   *
   * @returns The time slider display title
   */
  const renderDisplayTitle = (): React.ReactNode => {
    return title || names[layerPath];
  };

  /**
   * Renders the primary and additional layer names.
   *
   * @returns The visibility-aware layer names
   */
  const renderLayerNames = (): React.ReactNode => {
    return [layerPath, ...(additionalLayerpaths ?? [])].map((nameLayerPath, index) =>
      renderLayerName(nameLayerPath, index > 0 ? ', ' : '')
    );
  };

  /** Resolves the slider's native drag increment without expanding calendar ranges. */
  const memoSliderStep = useMemo((): number | null => {
    logger.logTraceUseMemo('TIME-SLIDER - memoSliderStep', discreteValues, step, stepUnit, minAndMax);

    // Discrete ranges let the slider choose among the supplied timestamps directly.
    if (discreteValues) return null;

    // Calendar snapping happens in the change handlers; keep the native slider precise enough to reach leap days and exact endpoints.
    if (stepUnit) return CALENDAR_SLIDER_NATIVE_STEP;

    // Use the configured step or divide an unconfigured range into manageable increments.
    return step || (minAndMax[1] - minAndMax[0]) / DEFAULT_CONTINUOUS_STEP_COUNT;
  }, [discreteValues, minAndMax, step, stepUnit]);

  return (
    <Box onKeyDown={handleKeyDown} sx={memoSxClasses.containerPadding}>
      {/* Header with title and filter switch */}
      <Box sx={memoSxClasses.headerContainer}>
        <Typography component="h2" sx={memoSxClasses.panelTitle}>
          {renderDisplayTitle()}
        </Typography>
        <Tooltip title={filtering ? t('timeSlider.slider.disableFilter') : t('timeSlider.slider.enableFilter')}>
          <Box component="span">
            <Switch size="small" checked={filtering} onChange={handleCheckbox} label={t('timeSlider.slider.filter')} />
          </Box>
        </Tooltip>
      </Box>

      {/* Slider */}
      <Box ref={sliderBoxRef} onKeyDownCapture={handleSliderKeyDownCapture} sx={memoSxClasses.centeredContainer}>
        <Slider
          style={SLIDER_WIDTH_STYLE}
          min={minAndMax[0]}
          max={minAndMax[1]}
          value={values}
          marks={memoSliderMarks}
          step={memoSliderStep}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          onKeyDown={handleSliderKeyDown}
          onValueLabelFormat={handleLabelFormat}
          onValueDisplayAriaLabel={handleLabelFormat}
          getAriaLabel={handleGetAriaLabel}
        />
        {/* WCAG - Live region announcing the slider's value. Only updated when the change didn't originate from direct
            interaction with the slider (its native aria-valuetext already announces that) and no animation is playing
            (see the announcement effect). role="status" implies aria-live value of polite and aria-atomic value of true. */}
        <Typography role="status" sx={visuallyHidden}>
          {announcement}
        </Typography>
      </Box>

      {/* Animation controls */}
      <Box role="group" aria-label={t('timeSlider.slider.animationControls')} sx={memoSxClasses.centeredContainer}>
        <IconButton
          className="buttonOutline"
          aria-label={t('timeSlider.slider.reset')}
          tooltip={t('timeSlider.slider.reset')}
          tooltipPlacement="top"
          onClick={handleReset}
        >
          <RestartAltIcon />
        </IconButton>

        {!singleHandle && (
          <IconButton
            className="buttonOutline"
            aria-label={lockLabel}
            aria-pressed={locked}
            tooltip={lockTooltip}
            tooltipPlacement="top"
            aria-disabled={isPlaying}
            onClick={handleLock}
          >
            {locked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        )}

        <IconButton
          className="buttonOutline"
          aria-label={t('timeSlider.slider.back')}
          tooltip={t('timeSlider.slider.back')}
          tooltipPlacement="top"
          aria-disabled={isPlaying || !filtering}
          onClick={handleBack}
        >
          <ArrowLeftIcon />
        </IconButton>

        <IconButton
          className="buttonOutline"
          aria-label={t('timeSlider.slider.playAnimation')}
          aria-pressed={isPlaying}
          tooltip={isPlaying ? t('timeSlider.slider.pauseAnimation') : t('timeSlider.slider.playAnimation')}
          tooltipPlacement="top"
          aria-disabled={!filtering}
          onClick={handlePlay}
        >
          {!isPlaying ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>

        <IconButton
          className="buttonOutline"
          aria-label={t('timeSlider.slider.forward')}
          tooltip={t('timeSlider.slider.forward')}
          tooltipPlacement="top"
          aria-disabled={isPlaying || !filtering}
          onClick={handleForward}
        >
          <ArrowRightIcon />
        </IconButton>

        <IconButton
          className="buttonOutline"
          aria-label={t('timeSlider.slider.reverseAnimation')}
          aria-pressed={reversed}
          tooltip={t('timeSlider.slider.changeDirection')}
          tooltipPlacement="top"
          aria-disabled={isPlaying}
          onClick={handleReverse}
        >
          {reversed ? <SwitchRightIcon /> : <SwitchLeftIcon />}
        </IconButton>

        <Box component="span" sx={memoSxClasses.controlWrapper}>
          <FormControl sx={memoSxClasses.formControlWidth}>
            <InputLabel htmlFor={timeDelayId} variant="standard">
              {t('timeSlider.slider.timeDelay')}
            </InputLabel>
            <NativeSelect
              id={timeDelayId}
              key={delay}
              defaultValue={delay}
              onChange={handleTimeChange}
              inputProps={{
                name: 'timeDelay',
              }}
            >
              <option value={500}>0.5s</option>
              <option value={750}>0.75s</option>
              <option value={1000}>1.0s</option>
              <option value={1500}>1.5s</option>
              <option value={2000}>2.0s</option>
              <option value={3000}>3.0s</option>
              <option value={5000}>5.0s</option>
            </NativeSelect>
          </FormControl>
        </Box>

        {!discreteValues && (
          <Box component="span" sx={memoSxClasses.controlWrapper}>
            <FormControl sx={memoSxClasses.formControlWidth}>
              <InputLabel htmlFor={stepValueId} variant="standard">
                {t('timeSlider.slider.stepValue')}
              </InputLabel>
              <NativeSelect
                id={stepValueId}
                defaultValue={stepUnit}
                onChange={handleStepChange}
                inputProps={{
                  name: 'timeStep',
                }}
              >
                <option value="hour">{t('timeSlider.slider.hour')}</option>
                <option value="day">{t('timeSlider.slider.day')}</option>
                <option value="week">{t('timeSlider.slider.week')}</option>
                <option value="month">{t('timeSlider.slider.month')}</option>
                <option value="year">{t('timeSlider.slider.year')}</option>
              </NativeSelect>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Description */}
      {(description || additionalLayerpaths?.length) && (
        <Typography component="div" sx={memoSxClasses.descriptionText}>
          {description || renderLayerNames()}
        </Typography>
      )}
    </Box>
  );
}

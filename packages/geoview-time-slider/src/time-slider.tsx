import { Box } from 'geoview-core/ui';
import { useStoreGeoViewMapId } from 'geoview-core/core/stores/geoview-store';
import {
  setStoreTimeSliderDelay,
  setStoreTimeSliderLocked,
  setStoreTimeSliderReversed,
  setStoreTimeSliderStep,
  useStoreTimeSliderLayer,
} from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import {
  useStoreLayerDateTemporalMode,
  useStoreLayerDisplayDateFormat,
  useStoreLayerDisplayDateFormatShort,
  useStoreLayerDisplayDateTimezone,
  useStoreLayerNameSet,
} from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { logger } from 'geoview-core/core/utils/logger';

import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { getSxClasses } from './time-slider-style';
import { visuallyHidden } from 'geoview-core/ui/style/default';
import { Switch } from 'geoview-core/ui/switch/switch';
import { useTimeSliderController } from 'geoview-core/core/controllers/use-controllers';

/** Properties for the TimeSlider component. */
interface TimeSliderProps {
  layerPath: string;
}

/**
 * Creates a panel with time sliders.
 *
 * @param props - Time slider properties
 * @returns The slider panel
 */
export function TimeSlider(props: TimeSliderProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-time-slider/time-slider', props);

  const { cgpv } = window;
  const { layerPath } = props;
  const { reactUtilities, ui } = cgpv;
  const { useTheme } = ui;
  const { useState, useRef, useEffect, useCallback, useId } = reactUtilities.react;
  const {
    Grid,
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
    FormControl,
    InputLabel,
    NativeSelect,
  } = ui.elements;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const playIntervalRef = useRef<number>();

  // References for play button
  const sliderValueRef = useRef<number>();
  const sliderDeltaRef = useRef<number>();

  const mapId = useStoreGeoViewMapId();
  const displayLanguage = useStoreAppDisplayLanguage();

  const {
    title,
    additionalLayerpaths,
    description,
    discreteValues,
    step,
    range,
    minAndMax,
    filtering,
    singleHandle,
    values: storeValues,
    delay,
    locked,
    reversed,
    displayDateFormat: displayDateFormatFromStore,
    displayDateFormatShort: displayDateFormatShortFromStore,
    displayDateTimezone: displayDateTimezoneFromStore,
    serviceDateTemporalMode: serviceDateTemporalModeFromStore,
  } = useStoreTimeSliderLayer(layerPath)!;

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
  const name = names[layerPath];
  const additionalNames = additionalLayerpaths?.map((additionalLayerPath) => names[additionalLayerPath]);
  const combinedNames = additionalNames ? `${name}, ${additionalNames.join(', ')}` : name;
  const displayTitle = title ? title : combinedNames;

  const timeStampRange = range.map((entry: string | number | Date) =>
    typeof entry !== 'number' ? DateMgt.convertToMilliseconds(entry) : entry
  );

  // If continous and range is lower then 4, create interval with markers at each 25%
  let timeMarks: number[] = [];
  if (range.length < 4 && !discreteValues) {
    const interval = (DateMgt.convertToMilliseconds(range[range.length - 1]) - DateMgt.convertToMilliseconds(range[0])) / 4;
    timeMarks = [minAndMax[0], minAndMax[0] + interval, minAndMax[0] + interval * 2, minAndMax[0] + interval * 3, minAndMax[1]];
  } else if (range.length < 6 || singleHandle || discreteValues) timeMarks = timeStampRange;
  else {
    timeMarks = [
      minAndMax[0],
      DateMgt.convertToMilliseconds(range[Math.round(range.length / 4)]),
      DateMgt.convertToMilliseconds(range[Math.round(range.length / 2)]),
      DateMgt.convertToMilliseconds(range[Math.round((3 * range.length) / 4)]),
      minAndMax[1],
    ];
  }

  const sliderMarks = [];
  for (let i = 0; i < timeMarks.length; i++) {
    sliderMarks.push({
      value: timeMarks[i],
      // Format the date using displayDateFormatShort
      label: DateMgt.formatDate(
        timeMarks[i],
        displayDateFormatShort[displayLanguage],
        displayLanguage,
        displayDateTimezone,
        serviceDateTemporalMode
      ),
    });
  }

  /** Provides a unique ID to associate the time delay label with its select control for accessibility. */
  const timeDelayId = useId();
  /** Provides a unique ID to associate the step value label with its select control for accessibility. */
  const stepValueId = useId();
  /** Provides a unique ID to associate the slider title with the slider control for accessibility. */
  const sliderLabelId = useId();

  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [values, setValues] = useState<number[]>(storeValues);

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
        const currentIndex = timeStampRange.findIndex((timestamp) => timestamp === values[0]);

        if (currentIndex === -1) {
          // Value not found - snap to nearest
          const nearest = timeStampRange.reduce((prev, curr) => (Math.abs(curr - values[0]) < Math.abs(prev - values[0]) ? curr : prev));
          timeSliderController.updateTimeSliderValues(layerPath, [nearest]);
          return;
        }

        // Move to next/previous discrete value (with wrapping)
        let newIndex = currentIndex + stepMove;
        if (newIndex >= timeStampRange.length) {
          newIndex = 0; // Wrap to start
        } else if (newIndex < 0) {
          newIndex = timeStampRange.length - 1; // Wrap to end
        }

        timeSliderController.updateTimeSliderValues(layerPath, [timeStampRange[newIndex]]);
        return;
      }

      // Handle single handle case with continuous values
      if (singleHandle && !discreteValues) {
        const interval = step || (minAndMax[1] - minAndMax[0]) / 20;
        let newPosition = values[0] + interval * stepMove;

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
      else if (isForward) {
        if (leftHandle < sliderValueRef.current! && rightHandle === sliderValueRef.current) leftHandle = sliderValueRef.current;
        else leftHandle += delta;
        if (leftHandle >= minAndMax[1]) [leftHandle] = minAndMax;
        rightHandle = leftHandle + sliderDeltaRef.current;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
        if (rightHandle > sliderValueRef.current! && leftHandle < sliderValueRef.current!) rightHandle = sliderValueRef.current as number;
      } else {
        if (rightHandle > sliderValueRef.current! && leftHandle === sliderValueRef.current) rightHandle = sliderValueRef.current;
        else rightHandle += delta;
        if (rightHandle <= minAndMax[0]) [, rightHandle] = minAndMax;
        leftHandle = rightHandle - sliderDeltaRef.current;
        if (leftHandle < minAndMax[0]) [leftHandle] = minAndMax;
        if (leftHandle < sliderValueRef.current! && rightHandle > sliderValueRef.current!) leftHandle = sliderValueRef.current as number;
      }

      timeSliderController.updateTimeSliderValues(layerPath, [leftHandle, rightHandle]);
    },
    [timeSliderController, discreteValues, layerPath, locked, minAndMax, reversed, values, singleHandle, step, timeStampRange]
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
    clearTimeout(playIntervalRef.current);
    setStoreTimeSliderLocked(mapId, layerPath, !locked);
  }, [mapId, layerPath, locked]);

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
    clearTimeout(playIntervalRef.current);
    setStoreTimeSliderReversed(mapId, layerPath, !reversed);
    if (isPlaying) {
      if (reversed) moveBack();
      else moveForward();
    }
  }, [isPlaying, mapId, layerPath, moveBack, moveForward, reversed]);

  /**
   * Handles when the user changes the time delay.
   */
  const handleTimeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setStoreTimeSliderDelay(mapId, layerPath, Number(event.target.value));
    },
    [mapId, layerPath]
  );

  /**
   * Handles when the user changes the step value.
   */
  const handleStepChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setStoreTimeSliderStep(mapId, layerPath, Number(event.target.value));
    },
    [mapId, layerPath]
  );

  /**
   * Handles when the user toggles the filtering checkbox.
   */
  const handleCheckbox = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, newValue: boolean): void => {
      timeSliderController.updateTimeSliderFiltering(layerPath, newValue);
      if (!newValue) {
        clearInterval(playIntervalRef.current);
        setIsPlaying(false);
      }
    },
    [timeSliderController, layerPath]
  );

  /**
   * Handles when the slider changes in the UI.
   *
   * Adjusts the local state so the Slider thumb updates.
   */
  const handleSliderChange = useCallback((newValues: number | number[]) => {
    clearTimeout(playIntervalRef.current);
    setIsPlaying(false);
    sliderDeltaRef.current = undefined;

    // Update the local values
    if (Array.isArray(newValues)) setValues(newValues);
    else setValues([newValues]);
  }, []);

  /**
   * Handles when the slider thumb has committed to a value in the slider.
   *
   * Adjusts the main time slider store with the values.
   */
  const handleSliderChangeCommitted = useCallback(
    (newValues: number | number[]): void => {
      if (discreteValues && singleHandle) {
        const value = Array.isArray(newValues) ? newValues[0] : newValues;
        const nearest = timeStampRange.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
        timeSliderController.updateTimeSliderValues(layerPath, [nearest]);
      } else {
        timeSliderController.updateTimeSliderValues(layerPath, newValues as number[]);
      }
    },
    [timeSliderController, discreteValues, layerPath, singleHandle, timeStampRange]
  );

  /**
   * Returns the tooltip text for the lock button based on current state and direction.
   *
   * @returns The tooltip text for the lock button
   */
  const getLockTooltip = useCallback((): string => {
    if (reversed) {
      return locked
        ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.unlockRight')
        : getLocalizedMessage(displayLanguage, 'timeSlider.slider.lockRight');
    }
    return locked
      ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.unlockLeft')
      : getLocalizedMessage(displayLanguage, 'timeSlider.slider.lockLeft');
  }, [locked, reversed, displayLanguage]);

  /**
   * Returns the consistent label for the lock button based on direction.
   *
   * @returns The consistent label for the lock button
   */
  const getLockLabel = useCallback((): string => {
    if (reversed) {
      return getLocalizedMessage(displayLanguage, 'timeSlider.slider.lockRight');
    }
    return getLocalizedMessage(displayLanguage, 'timeSlider.slider.lockLeft');
  }, [reversed, displayLanguage]);

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

  // #endregion

  // #region USE EFFECT

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - values filtering', values, filtering);

    // If slider cycle is active, pause before advancing to next increment
    if (isPlaying) {
      if (reversed) playIntervalRef.current = window.setTimeout(moveBack, delay);
      else playIntervalRef.current = window.setTimeout(moveForward, delay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, filtering, reversed, locked]);

  // When slider cycle is activated, advance to first increment without delay
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
   * Keeps the local state values in sync with the store values.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - storeValues', storeValues);

    // Sync local state
    setValues(storeValues);
  }, [storeValues]);

  // #endregion

  return (
    <Grid>
      <Box sx={{ padding: '10px 10px' }}>
        <Grid
          container
          sx={{
            ...sxClasses.rightPanelBtnHolder,
            flexWrap: 'nowrap',
            alignItems: 'center',
          }}
        >
          <Grid size={{ sm: 6, md: 9 }}>
            <Typography id={sliderLabelId} component="h2" sx={{ ...sxClasses.panelHeaders, paddingLeft: '20px' }}>
              {displayTitle}
            </Typography>
          </Grid>
          <Grid size={{ sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
              <Tooltip
                title={
                  filtering
                    ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.disableFilter')
                    : getLocalizedMessage(displayLanguage, 'timeSlider.slider.enableFilter')
                }
              >
                <span>
                  <Switch
                    size="small"
                    checked={filtering}
                    onChange={handleCheckbox}
                    label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.filter')}
                  />
                </span>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ textAlign: 'center', paddingTop: '20px' }}>
            <Slider
              style={{ width: '80%' }}
              min={minAndMax[0]}
              max={minAndMax[1]}
              value={values}
              marks={sliderMarks}
              step={discreteValues ? null : step || (minAndMax[1] - minAndMax[0]) / 20}
              onChange={handleSliderChange}
              onChangeCommitted={handleSliderChangeCommitted}
              onValueLabelFormat={handleLabelFormat}
              aria-labelledby={sliderLabelId}
            />
            {/* WCAG - Live region to announce slider value changes */}
            <Typography role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
              {`${handleLabelFormat(values[0])}${
                values.length > 1
                  ? ` ${getLocalizedMessage(displayLanguage, 'timeSlider.slider.to')} ${handleLabelFormat(values[values.length - 1])}`
                  : ''
              }`}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box
            role="group"
            aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.animationControls')}
            sx={{ textAlign: 'center', paddingTop: '20px' }}
          >
            {!singleHandle && (
              <IconButton
                className="buttonOutline"
                aria-label={getLockLabel()}
                aria-pressed={locked}
                tooltip={getLockTooltip()}
                tooltipPlacement="top"
                onClick={handleLock}
              >
                {locked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            )}

            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.back')}
              tooltip={getLocalizedMessage(displayLanguage, 'timeSlider.slider.back')}
              tooltipPlacement="top"
              aria-disabled={isPlaying || !filtering}
              onClick={handleBack}
            >
              <ArrowLeftIcon />
            </IconButton>

            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.playAnimation')}
              aria-pressed={isPlaying}
              tooltip={
                isPlaying
                  ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.pauseAnimation')
                  : getLocalizedMessage(displayLanguage, 'timeSlider.slider.playAnimation')
              }
              tooltipPlacement="top"
              aria-disabled={!filtering}
              onClick={handlePlay}
            >
              {!isPlaying ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>

            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.forward')}
              tooltip={getLocalizedMessage(displayLanguage, 'timeSlider.slider.forward')}
              tooltipPlacement="top"
              aria-disabled={isPlaying || !filtering}
              onClick={handleForward}
            >
              <ArrowRightIcon />
            </IconButton>

            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.reverseAnimation')}
              aria-pressed={reversed}
              tooltip={getLocalizedMessage(displayLanguage, 'timeSlider.slider.changeDirection')}
              tooltipPlacement="top"
              onClick={handleReverse}
            >
              {reversed ? <SwitchRightIcon /> : <SwitchLeftIcon />}
            </IconButton>

            <Box component="span" sx={{ paddingLeft: '10px' }}>
              <FormControl sx={{ width: '100px' }}>
                <InputLabel htmlFor={timeDelayId} variant="standard">
                  {getLocalizedMessage(displayLanguage, 'timeSlider.slider.timeDelay')}
                </InputLabel>
                <NativeSelect
                  id={timeDelayId}
                  key={delay}
                  defaultValue={delay}
                  inputProps={{
                    name: 'timeDelay',
                    onChange: handleTimeChange,
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
              <Box component="span" sx={{ paddingLeft: '10px' }}>
                <FormControl sx={{ width: '100px' }}>
                  <InputLabel htmlFor={stepValueId} variant="standard">
                    {getLocalizedMessage(displayLanguage, 'timeSlider.slider.stepValue')}
                  </InputLabel>
                  <NativeSelect
                    id={stepValueId}
                    defaultValue={step}
                    inputProps={{
                      name: 'timeStep',
                      onChange: handleStepChange,
                    }}
                  >
                    <option value={3600000}>{getLocalizedMessage(displayLanguage, 'timeSlider.slider.hour')}</option>
                    <option value={86400000}>{getLocalizedMessage(displayLanguage, 'timeSlider.slider.day')}</option>
                    <option value={604800000}>{getLocalizedMessage(displayLanguage, 'timeSlider.slider.week')}</option>
                    <option value={2592000000}>{getLocalizedMessage(displayLanguage, 'timeSlider.slider.month')}</option>
                    <option value={31536000000}>{getLocalizedMessage(displayLanguage, 'timeSlider.slider.year')}</option>
                  </NativeSelect>
                </FormControl>
              </Box>
            )}
          </Box>
        </Grid>
        {(description || additionalNames?.length) && (
          <Grid size={{ xs: 12 }}>
            <Typography component="div" sx={{ px: '20px', py: '5px', paddingTop: '15px', fontSize: '0.875rem' }}>
              {description || combinedNames}
            </Typography>
          </Grid>
        )}
      </Box>
    </Grid>
  );
}

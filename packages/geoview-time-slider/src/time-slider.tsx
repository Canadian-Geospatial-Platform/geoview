import { Box } from 'geoview-core/ui';
import {
  useTimeSliderLayers,
  useTimeSliderStoreActions,
} from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import { useLayerLegendLayers } from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import { LegendEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/legend-event-processor';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { logger } from 'geoview-core/core/utils/logger';

import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { getSxClasses } from './time-slider-style';
import { ConfigProps } from './time-slider-types';

interface TimeSliderProps {
  config: ConfigProps;
  layerPath: string;
}

/**
 * Creates a panel with time sliders
 *
 * @param {TimeSliderProps} props - Time slider properties
 * @returns {JSX.Element} the slider panel
 */
export function TimeSlider(props: TimeSliderProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-time-slider/time-slider', props);

  const { cgpv } = window;
  const { config, layerPath } = props;
  const { reactUtilities, ui } = cgpv;
  const { useTheme } = ui;
  const { useState, useRef, useEffect, useCallback } = reactUtilities.react;
  const {
    Grid,
    Slider,
    Typography,
    Checkbox,
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

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<number>();

  // References for play button
  const sliderValueRef = useRef<number>();
  const sliderDeltaRef = useRef<number>();

  // Get actions and states from store
  // TODO: evaluate best option to set value by layer path.... trough a getter?
  const { setTitle, setDefaultValue, setDescription, setValues, setLocked, setReversed, setDelay, setStep, setFiltering } =
    useTimeSliderStoreActions();
  const displayLanguage = useAppDisplayLanguage();

  // TODO: check performance as we should technically have one selector by constant
  const {
    title,
    description,
    defaultValue,
    discreteValues,
    step,
    range,
    minAndMax,
    filtering,
    singleHandle,
    values,
    delay,
    locked,
    reversed,
    displayPattern,
  } = useTimeSliderLayers()[layerPath];

  // Get name from legend layers
  const legendLayers = useLayerLegendLayers();
  const name = LegendEventProcessor.findLayerByPath(legendLayers, layerPath)?.layerName;

  const timeStampRange = range.map((entry: string | number | Date) =>
    typeof entry !== 'number' ? DateMgt.convertToMilliseconds(entry) : entry
  );

  let timeMarks: number[] = [];
  if (range.length < 4 && discreteValues) {
    const interval = (DateMgt.convertToMilliseconds(range[range.length - 1]) - DateMgt.convertToMilliseconds(range[0])) / 4;
    timeMarks = [minAndMax[0], minAndMax[0] + interval, minAndMax[0] + interval * 2, minAndMax[0] + interval * 3, minAndMax[1]];
  } else if (range.length < 6 || singleHandle) timeMarks = timeStampRange;
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
      // If timeframe is a single day, use time. If it is a single year, drop year from dates.
      label:
        displayPattern[1] !== undefined
          ? DateMgt.formatDatePattern(timeMarks[i], undefined, displayPattern[1])
          : DateMgt.formatDatePattern(timeMarks[i], displayPattern[0], displayPattern[1]),
    });
  }

  /**
   * Moves the slider handles based on the specified direction.
   * @param direction - The direction to move the slider ('back' or 'forward').
   */
  const moveSlider = useCallback(
    (direction: 'back' | 'forward'): void => {
      const isForward = direction === 'forward';
      const stepMove = isForward ? 1 : -1;

      // Handle single handle case with no discrete values
      if (singleHandle && !discreteValues) {
        const currentIndex = timeStampRange.indexOf(values[0]);
        const newIndex =
          // eslint-disable-next-line no-nested-ternary
          currentIndex === (isForward ? timeStampRange.length - 1 : 0)
            ? isForward
              ? 0
              : timeStampRange.length - 1
            : currentIndex + stepMove;
        setValues(layerPath, [timeStampRange[newIndex]]);
        return;
      }

      // Handle single handle case with discrete values
      if (singleHandle) {
        const interval = step || (minAndMax[1] - minAndMax[0]) / 20;
        const newPosition = values[0] + interval * stepMove;
        // eslint-disable-next-line no-nested-ternary
        setValues(layerPath, [newPosition > minAndMax[1] ? minAndMax[0] : newPosition < minAndMax[0] ? minAndMax[1] : newPosition]);
        return;
      }

      // Handle multi-handle case
      let [leftHandle, rightHandle] = values;

      // If handles are at the extremes, reset the delta
      if (rightHandle - leftHandle === minAndMax[1] - minAndMax[0]) {
        sliderDeltaRef.current = (minAndMax[1] - minAndMax[0]) / 10;
        setValues(
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

      setValues(layerPath, [leftHandle, rightHandle]);
    },
    [discreteValues, layerPath, locked, minAndMax, reversed, setValues, singleHandle, step, timeStampRange, values]
  );

  const moveBack = useCallback((): void => {
    moveSlider('back');
  }, [moveSlider]);

  const moveForward = useCallback((): void => {
    moveSlider('forward');
  }, [moveSlider]);

  // #region USE EFFECT
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - mount');

    // TODO: add mechanism to initialize these values during store onInitialize
    const sliderConfig = config?.sliders?.find((o: { layerPaths: string[] }) => o.layerPaths.includes(layerPath));
    if (title === undefined) setTitle(layerPath, sliderConfig?.title || '');
    if (description === undefined) setDescription(layerPath, sliderConfig?.description || '');
    if (locked === undefined) setLocked(layerPath, sliderConfig?.locked !== undefined ? sliderConfig?.locked : false);
    if (reversed === undefined) setReversed(layerPath, sliderConfig?.reversed !== undefined ? sliderConfig?.reversed : false);
    if (defaultValue === undefined) setDefaultValue(layerPath, sliderConfig?.defaultValue || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - config layerPath', config, layerPath);

    const sliderConfig = config?.sliders?.find((o: { layerPaths: string[] }) => o.layerPaths.includes(layerPath));
    if (sliderConfig?.defaultValue) {
      // update values based on slider's default value
      const defaultValueIsArray = Array.isArray(sliderConfig?.defaultValue);
      if (defaultValueIsArray) {
        setValues(layerPath, [
          DateMgt.convertToMilliseconds(sliderConfig?.defaultValue[0]),
          DateMgt.convertToMilliseconds(sliderConfig?.defaultValue[1]),
        ]);
      } else if (range.includes(sliderConfig?.defaultValue)) {
        setValues(layerPath, [DateMgt.convertToMilliseconds(sliderConfig?.defaultValue)]);
      } else {
        setValues(layerPath, [DateMgt.convertToMilliseconds(range[0])]);
      }
    }
  }, [config, layerPath, range, setFiltering, setValues]);

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
  // #endregion

  // #region HANDLE FUNCTIONS
  const handleBack = useCallback((): void => {
    sliderValueRef.current = reversed ? values[1] : values[0];
    moveBack();
  }, [moveBack, reversed, values]);

  const handleForward = useCallback((): void => {
    [sliderValueRef.current] = values;
    moveForward();
  }, [moveForward, values]);

  const handleLock = useCallback((): void => {
    clearTimeout(playIntervalRef.current);
    setLocked(layerPath, !locked);
  }, [layerPath, locked, setLocked]);

  const handlePlay = useCallback((): void => {
    clearTimeout(playIntervalRef.current);
    sliderValueRef.current = reversed ? values[1] : values[0];
    setIsPlaying(!isPlaying);
  }, [isPlaying, reversed, values]);

  const handleReverse = useCallback((): void => {
    clearTimeout(playIntervalRef.current);
    setReversed(layerPath, !reversed);
    if (isPlaying) {
      if (reversed) moveBack();
      else moveForward();
    }
  }, [isPlaying, layerPath, moveBack, moveForward, reversed, setReversed]);

  const handleTimeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setDelay(layerPath, event.target.value as unknown as number);
    },
    [layerPath, setDelay]
  );

  const handleStepChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setStep(layerPath, Number(event.target.value));
    },
    [layerPath, setStep]
  );

  const handleCheckbox = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, newValue: boolean): void => {
      setFiltering(layerPath, newValue);
      if (!newValue) {
        clearInterval(playIntervalRef.current);
        setIsPlaying(false);
      }
    },
    [layerPath, setFiltering]
  );

  const handleSliderChange = useCallback(
    (newValues: number | number[]): void => {
      // Log
      logger.logTraceUseCallback('TIME-SLIDER - handleSliderChange', layerPath);

      clearTimeout(playIntervalRef.current);
      setIsPlaying(false);
      sliderDeltaRef.current = undefined;
      setValues(layerPath, newValues as number[]);
    },
    [layerPath, setValues]
  );

  /**
   * Create labels for values on slider
   *
   * @param {number} theValue - The value of the slider handle
   * @returns {string} A formatted time string or ISO date string
   */
  const handleLabelFormat = useCallback(
    (theValue: number): string => {
      // Log
      logger.logTraceUseCallback('TIME-SLIDER - handleLabelFormat', displayPattern);

      // If timeframe is a single day, use time. If it is a single year, drop year from dates.
      DateMgt.formatDatePattern(values[0], displayPattern[0], displayPattern[1]);

      return DateMgt.formatDatePattern(theValue, displayPattern[0], displayPattern[1]);
    },
    [displayPattern, values]
  );
  // #endregion

  function returnLockTooltip(): string {
    if (reversed) {
      const text = locked
        ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.unlockRight')
        : getLocalizedMessage(displayLanguage, 'timeSlider.slider.lockRight');
      return text;
    }
    const text = locked
      ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.unlockLeft')
      : getLocalizedMessage(displayLanguage, 'timeSlider.slider.lockLeft');
    return text;
  }

  return (
    <Grid>
      <Box sx={{ padding: '10px 10px' }}>
        <Grid container sx={{ ...sxClasses.rightPanelBtnHolder, flexWrap: 'nowrap' }}>
          <Grid size={{ xs: 9 }}>
            <Typography component="div" sx={{ ...sxClasses.panelHeaders, paddingLeft: '20px', paddingTop: '10px' }}>
              {`${title || name}`}
              {displayPattern[0] === undefined && ` (${DateMgt.formatDate(defaultValue, 'YYYY-MM-DD')})`}
            </Typography>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Box sx={{ textAlign: 'right', marginRight: '25px' }}>
              <Tooltip
                title={
                  filtering
                    ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.disableFilter')
                    : getLocalizedMessage(displayLanguage, 'timeSlider.slider.enableFilter')
                }
                placement="top"
                enterDelay={1000}
              >
                <Checkbox checked={filtering} onChange={handleCheckbox} />
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ textAlign: 'center', paddingTop: '20px' }}>
            <Slider
              key={values[1] ? values[1] + values[0] : values[0]}
              style={{ width: '80%', color: 'primary' }}
              min={minAndMax[0]}
              max={minAndMax[1]}
              value={values}
              marks={sliderMarks}
              step={discreteValues ? step || 0.1 : null}
              onChangeCommitted={handleSliderChange}
              onValueLabelFormat={handleLabelFormat}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ textAlign: 'center', paddingTop: '20px' }}>
            {!singleHandle && (
              <IconButton
                className="buttonOutline"
                aria-label={returnLockTooltip()}
                tooltip={returnLockTooltip()}
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
              disabled={isPlaying || !filtering}
              onClick={handleBack}
            >
              <ArrowLeftIcon />
            </IconButton>

            <IconButton
              className="buttonOutline"
              aria-label={
                isPlaying
                  ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.pauseAnimation')
                  : getLocalizedMessage(displayLanguage, 'timeSlider.slider.playAnimation')
              }
              tooltip={
                isPlaying
                  ? getLocalizedMessage(displayLanguage, 'timeSlider.slider.pauseAnimation')
                  : getLocalizedMessage(displayLanguage, 'timeSlider.slider.playAnimation')
              }
              tooltipPlacement="top"
              disabled={!filtering}
              onClick={handlePlay}
            >
              {!isPlaying ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>

            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.forward')}
              tooltip={getLocalizedMessage(displayLanguage, 'timeSlider.slider.forward')}
              tooltipPlacement="top"
              disabled={isPlaying || !filtering}
              onClick={handleForward}
            >
              <ArrowRightIcon />
            </IconButton>

            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage(displayLanguage, 'timeSlider.slider.changeDirection')}
              tooltip={getLocalizedMessage(displayLanguage, 'timeSlider.slider.changeDirection')}
              tooltipPlacement="top"
              onClick={handleReverse}
            >
              {reversed ? <SwitchRightIcon /> : <SwitchLeftIcon />}
            </IconButton>

            <Box component="span" sx={{ paddingLeft: '10px' }}>
              <FormControl sx={{ width: '100px' }}>
                <InputLabel variant="standard">{getLocalizedMessage(displayLanguage, 'timeSlider.slider.timeDelay')}</InputLabel>
                <NativeSelect
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

            {singleHandle && discreteValues && (
              <Box component="span" sx={{ paddingLeft: '10px' }}>
                <FormControl sx={{ width: '100px' }}>
                  <InputLabel variant="standard">{getLocalizedMessage(displayLanguage, 'timeSlider.slider.stepValue')}</InputLabel>
                  <NativeSelect
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
        {description && (
          <Grid size={{ xs: 12 }}>
            <Typography component="div" sx={{ px: '20px', py: '5px' }}>
              {description}
            </Typography>
          </Grid>
        )}
      </Box>
    </Grid>
  );
}

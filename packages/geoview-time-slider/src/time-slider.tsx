import { useTheme } from '@mui/material/styles';
import { FormControl, InputLabel, NativeSelect } from '@mui/material';
import {
  useTimeSliderLayers,
  useTimeSliderStoreActions,
} from 'geoview-core/src/core/stores/store-interface-and-intial-values/time-slider-state';
import { useLayerLegendLayers } from 'geoview-core/src/core/stores/store-interface-and-intial-values/layer-state';
import { LegendEventProcessor } from 'geoview-core/src/api/event-processors/event-processor-children/legend-event-processor';
import { getLocalizedValue, getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { logger } from 'geoview-core/src/core/utils/logger';

import { getSxClasses } from './time-slider-style';
import { ConfigProps } from './time-slider-types';

interface TimeSliderProps {
  config: ConfigProps;
  mapId: string;
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
  const { config, layerPath, mapId } = props;
  const { react, ui } = cgpv;
  const { useState, useRef, useEffect, useCallback } = react;
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
  const { setTitle, setDefaultValue, setDescription, setValues, setLocked, setReversed, setDelay, setFiltering } =
    useTimeSliderStoreActions();
  const displayLanguage = useAppDisplayLanguage();

  // TODO: check performance as we should technically have one selector by constant
  const {
    title,
    description,
    defaultValue,
    discreteValues,
    range,
    minAndMax,
    field,
    fieldAlias,
    filtering,
    singleHandle,
    values,
    delay,
    locked,
    reversed,
  } = useTimeSliderLayers()[layerPath];

  // Get name from legend layers
  const legendLayers = useLayerLegendLayers();
  const name = LegendEventProcessor.findLayerByPath(legendLayers, layerPath).layerName;

  // slider config
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - mount');

    // TODO: add mechanism to initialize these values during store onInitialize
    const sliderConfig = config?.sliders?.find((o: { layerPaths: string[] }) => o.layerPaths.includes(layerPath));
    if (title === undefined) setTitle(layerPath, getLocalizedValue(sliderConfig?.title, displayLanguage) || '');
    if (description === undefined) setDescription(layerPath, getLocalizedValue(sliderConfig?.description, displayLanguage) || '');
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
        setValues(layerPath, [new Date(sliderConfig?.defaultValue[0]).getTime(), new Date(sliderConfig?.defaultValue[1]).getTime()]);
      } else if (range.includes(sliderConfig?.defaultValue)) {
        setValues(layerPath, [new Date(sliderConfig?.defaultValue).getTime()]);
      } else {
        setValues(layerPath, [new Date(range[0]).getTime()]);
      }
    }
  }, [config, layerPath, range, setFiltering, setValues]);

  const timeStampRange = range.map((entry: string | number | Date) => new Date(entry).getTime());

  // Check if range occurs in a single day or year
  const timeDelta = minAndMax[1] - minAndMax[0];
  const dayDelta = new Date(minAndMax[1]).getDate() - new Date(minAndMax[0]).getDate();
  const yearDelta = new Date(minAndMax[1]).getFullYear() - new Date(minAndMax[0]).getFullYear();
  let timeframe: string | undefined;
  if (dayDelta === 0 && timeDelta < 86400000) timeframe = 'day';
  else if (yearDelta === 0) timeframe = 'year';

  let timeMarks: number[] = [];
  if (range.length < 4 && discreteValues) {
    const interval = (new Date(range[range.length - 1]).getTime() - new Date(range[0]).getTime()) / 4;
    timeMarks = [minAndMax[0], minAndMax[0] + interval, minAndMax[0] + interval * 2, minAndMax[0] + interval * 3, minAndMax[1]];
  } else if (range.length < 6 || singleHandle) timeMarks = timeStampRange;
  else {
    timeMarks = [
      minAndMax[0],
      new Date(range[Math.round(range.length / 4)]).getTime(),
      new Date(range[Math.round(range.length / 2)]).getTime(),
      new Date(range[Math.round((3 * range.length) / 4)]).getTime(),
      minAndMax[1],
    ];
  }

  const sliderMarks = [];
  for (let i = 0; i < timeMarks.length; i++) {
    sliderMarks.push({
      value: timeMarks[i],
      // If timeframe is a single day, use time. If it is a single year, drop year from dates.
      label: timeframe
        ? `${timeframe === 'day' ? new Date(timeMarks[i]).toTimeString().split(' ')[0] : new Date(timeMarks[i]).toISOString().slice(5, 10)}`
        : new Date(timeMarks[i]).toISOString().slice(0, 10),
    });
  }

  /**
   * Moves the slider handle(s) back one increment
   */
  function moveBack(): void {
    if (singleHandle && !discreteValues) {
      const currentIndex = timeStampRange.indexOf(values[0]);
      let newIndex: number;
      if (timeStampRange[currentIndex] === minAndMax[0]) newIndex = timeStampRange.length - 1;
      else newIndex = currentIndex - 1;
      setValues(layerPath, [timeStampRange[newIndex]]);
    } else if (singleHandle) {
      const interval = (minAndMax[1] - minAndMax[0]) / 20;
      const newPosition = values[0] - interval < minAndMax[0] ? minAndMax[1] : values[0] - interval;
      setValues(layerPath, [newPosition]);
    } else {
      let [leftHandle, rightHandle] = values;
      if (!sliderDeltaRef.current) {
        sliderDeltaRef.current = rightHandle - leftHandle;
      }

      // Check for edge cases and then set new slider values
      if (locked && reversed) {
        if (leftHandle === minAndMax[0]) leftHandle = rightHandle;
        leftHandle -= sliderDeltaRef.current;
        if (leftHandle < minAndMax[0]) [leftHandle] = minAndMax;
      } else if (locked) {
        rightHandle -= sliderDeltaRef.current!;
        if (rightHandle < leftHandle) rightHandle = leftHandle;
        if (rightHandle === leftHandle) [, rightHandle] = minAndMax;
      } else {
        if (rightHandle > sliderValueRef.current! && leftHandle === sliderValueRef.current) rightHandle = sliderValueRef.current;
        else rightHandle -= sliderDeltaRef.current!;
        if (rightHandle <= minAndMax[0]) [, rightHandle] = minAndMax;
        leftHandle = rightHandle - sliderDeltaRef.current!;
        if (leftHandle < minAndMax[0]) [leftHandle] = minAndMax;
        if (leftHandle < sliderValueRef.current! && rightHandle > sliderValueRef.current!) leftHandle = sliderValueRef.current as number;
      }
      setValues(layerPath, [leftHandle, rightHandle]);
    }
  }

  /**
   * Moves the slider handle(s) forward one increment
   */
  function moveForward(): void {
    if (singleHandle && !discreteValues) {
      const currentIndex = timeStampRange.indexOf(values[0]);
      let newIndex: number;
      if (timeStampRange[currentIndex] === minAndMax[1]) newIndex = 0;
      else newIndex = currentIndex + 1;
      setValues(layerPath, [timeStampRange[newIndex]]);
    } else if (singleHandle) {
      const interval = (minAndMax[1] - minAndMax[0]) / 20;
      const newPosition = values[0] + interval > minAndMax[1] ? minAndMax[0] : values[0] + interval;
      setValues(layerPath, [newPosition]);
    } else {
      let [leftHandle, rightHandle] = values;
      if (!sliderDeltaRef.current) {
        sliderDeltaRef.current = rightHandle - leftHandle;
      }

      // Check for edge cases and then set new slider values
      if (locked && reversed) {
        leftHandle += sliderDeltaRef.current!;
        if (leftHandle >= rightHandle) [leftHandle] = minAndMax;
      } else if (locked) {
        if (rightHandle === minAndMax[1]) rightHandle = leftHandle;
        rightHandle += sliderDeltaRef.current!;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
      } else {
        if (leftHandle < sliderValueRef.current! && rightHandle === sliderValueRef.current) leftHandle = sliderValueRef.current;
        else leftHandle += sliderDeltaRef.current!;
        if (leftHandle >= minAndMax[1]) [leftHandle] = minAndMax;
        rightHandle = leftHandle + sliderDeltaRef.current!;
        if (rightHandle > minAndMax[1]) [, rightHandle] = minAndMax;
        if (rightHandle > sliderValueRef.current! && leftHandle < sliderValueRef.current!) rightHandle = sliderValueRef.current as number;
      }
      setValues(layerPath, [leftHandle, rightHandle]);
    }
  }

  // #region USE EFFECT
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER - values filtering', values, filtering);

    // If slider cycle is active, pause before advancing to next increment
    if (isPlaying) {
      if (reversed) playIntervalRef.current = window.setTimeout(() => moveBack(), delay);
      else playIntervalRef.current = window.setTimeout(() => moveForward(), delay);
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
  function handleBack(): void {
    sliderValueRef.current = reversed ? values[1] : values[0];
    moveBack();
  }

  function handleForward(): void {
    [sliderValueRef.current] = values;
    moveForward();
  }

  function handleLock(): void {
    clearTimeout(playIntervalRef.current);
    setLocked(layerPath, !locked);
  }

  function handlePlay(): void {
    clearTimeout(playIntervalRef.current);
    sliderValueRef.current = reversed ? values[1] : values[0];
    setIsPlaying(!isPlaying);
  }

  function handleReverse(): void {
    clearTimeout(playIntervalRef.current);
    setReversed(layerPath, !reversed);
    if (isPlaying) {
      if (reversed) moveBack();
      else moveForward();
    }
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    setDelay(layerPath, event.target.value as unknown as number);
  }

  function handleCheckbox(newValue: boolean): void {
    setFiltering(layerPath, newValue);
    if (!newValue) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
    }
  }
  // #endregion

  function returnLockTooltip(): string {
    if (reversed) {
      const text = locked
        ? getLocalizedMessage('timeSlider.slider.unlockRight', displayLanguage)
        : getLocalizedMessage('timeSlider.slider.lockRight', displayLanguage);
      return text;
    }
    const text = locked
      ? getLocalizedMessage('timeSlider.slider.unlockLeft', displayLanguage)
      : getLocalizedMessage('timeSlider.slider.lockLeft', displayLanguage);
    return text;
  }

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
      logger.logTraceUseCallback('TIME-SLIDER - handleLabelFormat', timeframe);

      // If timeframe is a single day, use time. If it is a single year, drop year from dates.
      if (timeframe === 'day') return new Date(theValue).toTimeString().split(' ')[0].replace(/^0/, '');
      if (timeframe === 'year') return new Date(theValue).toISOString().slice(5, 10);
      return new Date(theValue).toISOString().slice(0, 10);
    },
    [timeframe]
  );

  return (
    <Grid>
      <div>
        <Grid container sx={sxClasses.rightPanelBtnHolder}>
          <Grid item xs={9}>
            <Typography component="div" sx={{ ...sxClasses.panelHeaders, paddingLeft: '20px', paddingTop: '10px' }}>
              {`${title || name}`}
              {timeframe !== undefined &&
                ` (${timeframe === 'day' ? new Date(defaultValue).toLocaleDateString() : new Date(defaultValue).getFullYear()})`}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <div style={{ textAlign: 'right', marginRight: '25px' }}>
              <Tooltip
                title={
                  filtering
                    ? getLocalizedMessage('timeSlider.slider.disableFilter', displayLanguage)
                    : getLocalizedMessage('timeSlider.slider.enableFilter', displayLanguage)
                }
                placement="top"
                enterDelay={1000}
              >
                <Checkbox checked={filtering} onChange={(event: never, child: boolean): void => handleCheckbox(child)} />
              </Tooltip>
            </div>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            <Slider
              key={values[1] ? values[1] + values[0] : values[0]}
              sliderId={layerPath}
              mapId={mapId}
              style={{ width: '80%', color: 'primary' }}
              min={minAndMax[0]}
              max={minAndMax[1]}
              value={values}
              marks={sliderMarks}
              step={!discreteValues ? null : 0.1}
              onChangeCommitted={handleSliderChange}
              onValueDisplay={handleLabelFormat}
            />
          </div>
        </Grid>
        <Grid item xs={12}>
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            {!singleHandle && (
              <IconButton
                className="buttonOutline"
                aria-label={returnLockTooltip()}
                tooltip={returnLockTooltip()}
                tooltipPlacement="top"
                onClick={() => handleLock()}
              >
                {locked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            )}
            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage('timeSlider.slider.back', displayLanguage) as string}
              tooltip="timeSlider.slider.back"
              tooltipPlacement="top"
              disabled={isPlaying || !filtering}
              onClick={() => handleBack()}
            >
              <ArrowLeftIcon />
            </IconButton>
            <IconButton
              className="buttonOutline"
              aria-label={
                isPlaying
                  ? (getLocalizedMessage('timeSlider.slider.pauseAnimation', displayLanguage) as string)
                  : (getLocalizedMessage('timeSlider.slider.playAnimation', displayLanguage) as string)
              }
              tooltip={isPlaying ? 'timeSlider.slider.pauseAnimation' : 'timeSlider.slider.playAnimation'}
              tooltipPlacement="top"
              disabled={!filtering}
              onClick={() => handlePlay()}
            >
              {!isPlaying ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage('timeSlider.slider.forward', displayLanguage) as string}
              tooltip="timeSlider.slider.forward"
              tooltipPlacement="top"
              disabled={isPlaying || !filtering}
              onClick={() => handleForward()}
            >
              <ArrowRightIcon />
            </IconButton>
            <IconButton
              className="buttonOutline"
              aria-label={getLocalizedMessage('timeSlider.slider.changeDirection', displayLanguage) as string}
              tooltip="timeSlider.slider.changeDirection"
              tooltipPlacement="top"
              onClick={() => handleReverse()}
            >
              {reversed ? <SwitchRightIcon /> : <SwitchLeftIcon />}
            </IconButton>
            <FormControl sx={{ width: '150px' }}>
              <InputLabel variant="standard">{getLocalizedMessage('timeSlider.slider.timeDelay', displayLanguage)}</InputLabel>
              <NativeSelect
                defaultValue={delay}
                inputProps={{
                  name: 'timeDelay',
                  onChange: (event) => handleTimeChange(event),
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
          </div>
        </Grid>
        {description && (
          <Grid item xs={12}>
            <Typography component="div" sx={{ px: '20px', py: '5px' }}>
              {description}
            </Typography>
          </Grid>
        )}
        {fieldAlias && (
          <Grid item xs={12}>
            <Typography component="div" sx={{ px: '20px', py: '5px' }}>
              {`${fieldAlias} (${field})`}
            </Typography>
          </Grid>
        )}
      </div>
    </Grid>
  );
}

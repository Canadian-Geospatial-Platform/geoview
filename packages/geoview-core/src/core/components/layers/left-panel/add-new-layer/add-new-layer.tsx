import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material';

import type { ButtonPropsLayerPanel } from '@/ui';
import {
  Box,
  Button,
  IconButton,
  ButtonGroup,
  CircularProgressBase,
  FileUploadIcon,
  FormHelperText,
  Paper,
  Select,
  Stepper,
  TextField,
} from '@/ui';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreAppDisabledLayerTypes, useStoreAppDisplayLanguage, useStoreAppShellContainer } from '@/core/stores/states/app-state';
import { ConfigApi } from '@/api/config/config-api';
import { logger } from '@/core/utils/logger';
import { generateId, isValidUUID, validateAndPingUrl } from '@/core/utils/utilities';
import { VALID_FILE_EXTENSIONS_ACCEPT } from '@/core/utils/constant';
import { Config } from '@/api/config/config';
import type { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type {
  GeoPackageLayerConfig,
  MapConfigLayerEntry,
  ShapefileLayerConfig,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  TypeInitialGeoviewLayerType,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';

import { UtilAddLayer } from '@/core/components/layers/left-panel/add-new-layer/add-layer-utils';
import { AddLayerTree } from '@/core/components/layers/left-panel/add-new-layer/add-layer-tree';
import { ShapefileReader } from '@/api/config/reader/shapefile-reader';
import { GeoPackageReader } from '@/api/config/reader/geopackage-reader';
import type { GeoViewGeoChartConfig, GeoViewTimeSliderConfig } from '@/api/config/reader/uuid-config-reader';
import type { GeoViewLayerAddedResult } from '@/core/controllers/layer-creator-controller';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import {
  useGeoChartControllerIfExists,
  useLayerController,
  useLayerCreatorController,
  useUIController,
} from '@/core/controllers/use-controllers';

/** Style classes for button groups. */
const sxClasses = {
  buttonGroup: {
    paddingTop: 12,
    gap: 6,
  },
};

/** Layer entry type constants from the schema. */
const { GEOCORE, GEOPACKAGE, SHAPEFILE } = CONST_LAYER_ENTRY_TYPES;

interface FileUploadSectionProps {
  /** Callback invoked when a file is selected. */
  onFileSelected: (file: File, fileURL: string, fileName: string) => void;
  /** Callback invoked when the URL input changes. */
  onUrlChanged: (url: string) => void;
  /** Callback invoked on keydown events. */
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** The URL to display in the input field. */
  displayURL: string;
  /** List of layer types that are disabled. */
  disabledLayerTypes: TypeInitialGeoviewLayerType[];
  /** Optional ref to the upload button element. */
  uploadButtonRef?: React.RefObject<HTMLButtonElement | null>;
  /** Whether the URL field has a validation error. */
  urlError?: boolean;
  /** The error message to display when URL validation fails. */
  urlErrorMessage?: string;
}

/**
 * Creates the file upload section component.
 *
 * @param props - Properties defined in FileUploadSectionProps interface
 * @returns The file upload section component
 */
function FileUploadSection({
  onFileSelected,
  onUrlChanged,
  onKeyDown,
  displayURL,
  disabledLayerTypes,
  uploadButtonRef,
  urlError,
  urlErrorMessage,
}: FileUploadSectionProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-new-layer/file-upload-section');

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const uiController = useUIController();

  // State
  const [localDisplayURL, setLocalDisplayURL] = useState<string>(displayURL);
  const dragPopover = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<boolean>(false);

  // Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Process a file for upload and notify the parent component
   *
   * @param file - The file to process (JSON, GeoJSON, ZIP, SHP or CSV)
   * @throws {Error} When file type is not supported
   */
  const processFile = (file: File): void => {
    const upFilename = file.name.toUpperCase();
    if (
      upFilename.endsWith('.JSON') ||
      upFilename.endsWith('.GEOJSON') ||
      upFilename.endsWith('.TIF') ||
      upFilename.endsWith('.GPKG') ||
      upFilename.endsWith('.KML') ||
      upFilename.endsWith('.CSV') ||
      upFilename.endsWith('.ZIP') ||
      upFilename.endsWith('.SHP')
    ) {
      const fileURL = URL.createObjectURL(file);
      const fileName = file.name.split('.')[0];

      // Update local state
      setLocalDisplayURL(file.name);

      // Notify parent component
      onFileSelected(file, fileURL, fileName);
    } else {
      // Handle error
      uiController.addMessage('error', 'layers.errorFile', {});
    }
  };

  /**
   * Handle file selection from the file input element.
   */
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files.length > 0) {
      processFile(event.target.files[0]);
    }
  };

  /**
   * Handle URL input changes in the text field.
   */
  const handleInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const url = event.target.value.trim();
    setLocalDisplayURL(url);
    onUrlChanged(url);
  };

  /**
   * Handle file drop events in the dropzone.
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setDrag(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  /**
   * Handles drag-over behavior for the file dropzone.
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handles drag-enter behavior for the file dropzone.
   */
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== dragPopover.current) setDrag(true);
  };

  /**
   * Handles drag-leave behavior for the file dropzone.
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === dragPopover.current) setDrag(false);
  };

  /**
   * Opens the hidden file input.
   */
  const handleOpenFileInput = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box
      className="dropzone"
      style={{ position: 'relative' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {drag && (
        <Box
          ref={dragPopover}
          style={{
            backgroundColor: 'rgba(128,128,128,.95)',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            textAlign: 'center',
            color: 'black',
            fontSize: 24,
          }}
        >
          <h3>{t('layers.dropzone')}</h3>
        </Box>
      )}
      <Box>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleChange}
          accept={VALID_FILE_EXTENSIONS_ACCEPT}
          aria-label={t('layers.fileTypes')} // WCAG - Provides an accessible label for the hidden file input control
        />
      </Box>
      <Button
        fullWidth
        variant="outlined"
        size="small"
        sx={{ width: '100%' }}
        type="text"
        onClick={handleOpenFileInput}
        className="buttonOutlineFilled"
        aria-label={t('layers.fileTypes')}
        tooltip={t('layers.fileTypes')}
        ref={uploadButtonRef}
      >
        <FileUploadIcon />
        <Box component="span">{t('layers.upload')}</Box>
      </Button>
      <p style={{ textAlign: 'center' }}>
        <small>{t('layers.drop')}</small>
      </p>
      <TextField
        sx={{ width: '100%' }}
        label={disabledLayerTypes.includes(GEOCORE as TypeInitialGeoviewLayerType) ? t('layers.urlNoGeocore') : t('layers.url')}
        variant="standard"
        value={localDisplayURL}
        onChange={handleInput}
        onKeyDown={onKeyDown}
        multiline
        error={urlError}
        helperText={urlError ? urlErrorMessage : undefined}
        slotProps={{
          inputLabel: {
            sx: {
              color: theme.palette.geoViewColor?.textColor.light[200], // WCAG - Matches global placeholder text color
              '&.Mui-focused': {
                color: theme.palette.geoViewColor?.primary.main, // Primary color when focused
              },
            },
          },
          input: {
            sx: {
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
                outlineOffset: '2px',
              },
              '& textarea.keyboard-focused': {
                // hide keyboard-focused default black outline (style.css)
                // MUI adds a 2px border to the bottom of the input parent on focus.
                // It has sufficient contrast to meet WCAG 2.1 requirements (see Success Criterion 1.4.11 and 2.4.7)
                border: 'none !important',
              },
            },
          },
        }}
      />
    </Box>
  );
}

/**
 * Creates the add-new-layer component.
 *
 * @returns The add-new-layer component
 */
export function AddNewLayer(): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-new-layer/add-new-layer');

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();

  const { CSV, ESRI_DYNAMIC, ESRI_FEATURE, ESRI_IMAGE, GEOJSON, GEOTIFF, KML, WMS, WMTS, WFS, OGC_FEATURE, XYZ_TILES, VECTOR_TILES } =
    CONST_LAYER_TYPES;

  // States
  const [activeStep, setActiveStep] = useState<number>(0);
  const [layerURL, setLayerURL] = useState<string>('');
  const [displayURL, setDisplayURL] = useState<string>('');
  const [layerType, setLayerType] = useState<TypeInitialGeoviewLayerType | ''>('');
  const [layerTree, setLayerTree] = useState<TypeGeoviewLayerConfig | undefined>();
  const [layerName, setLayerName] = useState<string>('');
  const [layerIdsToAdd, setLayerIdsToAdd] = useState<string[]>([]);
  const [isMultiple, setIsMultiple] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stepButtonEnabled, setStepButtonEnabled] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController>(new AbortController());
  const [isGeoCore, setIsGeoCore] = useState<boolean>(false);
  const [geochartsToAdd, setGeochartsToAdd] = useState<Record<string, GeoViewGeoChartConfig> | undefined>();
  const [timeSliderToAdd, setTimeSliderToAdd] = useState<GeoViewTimeSliderConfig[] | undefined>();
  const [urlError, setUrlError] = useState<boolean>(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
  const [serviceTypeError, setServiceTypeError] = useState<boolean>(false);
  const [serviceTypeErrorMessage, setServiceTypeErrorMessage] = useState<string>('');
  const isSingle = !isMultiple;

  // Ref
  const serviceTypeRef = useRef<HTMLDivElement>(null);
  const layerSelectionTreeContainerRef = useRef<HTMLDivElement>(null);
  const configureLayerNameInputRef = useRef<HTMLInputElement>(null);
  const finalLayerNameInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);

  // Store
  const mapId = useStoreGeoViewMapId();
  const disabledLayerTypes = useStoreAppDisabledLayerTypes();
  const language = useStoreAppDisplayLanguage();
  const shellContainer = useStoreAppShellContainer();
  const uiController = useUIController();
  const geoChartController = useGeoChartControllerIfExists();
  const layerController = useLayerController();
  const layerCreatorController = useLayerCreatorController();

  // List of layer types and labels (Step 2)
  const layerOptions = UtilAddLayer.getLocalizeLayerType(language, false);

  // #region ERRORS

  /**
   * Shows an error when a required field is empty.
   *
   * @param textField - The label of the required field
   */
  const showRequiredFieldError = (textField: string): void => {
    setIsLoading(false);
    uiController.addMessage('error', 'layers.errorEmpty', { textFieldName: textField });
  };

  /**
   * Shows an error when no URL or input has been provided.
   */
  const showNoInputError = (): void => {
    setIsLoading(false);
    uiController.addMessage('error', 'layers.errorNone', {});
  };

  /**
   * Shows an error when the selected layer type is disabled.
   *
   * @param disabledType - The disabled layer type identifier
   */
  const showDisabledLayerTypeError = (disabledType: string): void => {
    setIsLoading(false);
    uiController.addMessage('error', 'layers.errorDisabled', { layerType: disabledType });
  };

  /**
   * Shows an error when the URL does not support the selected service type.
   *
   * @param serviceName - The service type that failed
   */
  const showUnsupportedServiceError = (serviceName: string): void => {
    setIsLoading(false);
    uiController.addMessage('error', 'layers.errorServer', { serviceTypeName: serviceName });
  };

  // #endregion ERRORS

  // Set layer type for "Select format" step if detected (Step 1)
  const setLayerTypeIfAllowed = (layerTypeValue: TypeInitialGeoviewLayerType): boolean => {
    if (disabledLayerTypes.includes(layerTypeValue)) {
      showDisabledLayerTypeError(layerTypeValue);
      setLayerType('');
      setStepButtonEnabled(false);
      return false;
    }
    setLayerType(layerTypeValue);
    return true;
  };

  /**
   * Completes the layer addition process.
   */
  const doneAdding = (): void => {
    // Done adding
    setIsLoading(false);
    layerController.setLayerDisplayState('view');
    layerController.setLayerZIndices();
  };

  /**
   * Shows a notification message based on the layer's loading status.
   */
  const doneAddedShowMessage = (layerBeingAdded: AbstractGeoViewLayer): void => {
    if (layerBeingAdded.allLayerStatusAreGreaterThanOrEqualTo('error'))
      uiController.addMessage('error', 'layers.layerAddedWithError', { layerName });
    else if (layerBeingAdded?.allLayerStatusAreGreaterThanOrEqualTo('loaded'))
      uiController.addMessage('info', 'layers.layerAdded', { layerName });
    else uiController.addMessage('info', 'layers.layerAddedAndLoading', { layerName });
  };

  /**
   * Handles cancel behavior for the add-layer workflow.
   */
  const handleCancelAddLayer = (): void => {
    layerController.setLayerDisplayState('view');
  };

  // #region HANDLERS FOR THE STEPS

  /**
   * Handle the first step of the layer addition process
   * Validates the layer URL and attempts to guess the layer type.
   * If valid, advances to the next step.
   */
  const handleStep1 = (): void => {
    // If we return here after step 2, URL/UUID and type will be out of sync
    if (layerType === GEOCORE) setLayerURL(displayURL);

    // Set new AbortController to handle returning to this step
    setAbortController(new AbortController());

    let valid = true;
    if (layerURL.trim() === '') {
      valid = false;
      showNoInputError();
    }

    const guessedLayerType = ConfigApi.guessLayerType(displayURL) || '';
    const layerTypeIsAllowed = setLayerTypeIfAllowed(guessedLayerType as TypeGeoviewLayerType);
    if (valid && layerTypeIsAllowed) {
      // Clear Step 2 errors when advancing from Step 1
      setServiceTypeError(false);
      setServiceTypeErrorMessage('');
      setActiveStep(1);
    }
  };

  /**
   * Handle the second step of the layer addition process
   *
   * @description Loads metadata for the selected layer type and URL,
   * populates the layer list, and prepares for layer selection.
   */
  const handleStep2 = (): void => {
    setIsLoading(true);

    const populateLayerList = async (curlayerType: TypeInitialGeoviewLayerType): Promise<boolean> => {
      try {
        // Initialize a temporary GeoviewLayer config depending on the layer type.
        const configFromType = await ConfigApi.createInitConfigFromType(
          curlayerType,
          generateId(18),
          layerName,
          layerURL,
          true, // isTimeAware true by default
          language,
          mapId,
          abortController.signal
        );

        // Get the config info from the created config
        const geoviewLayerConfig = configFromType.configInfo;

        // Keep in state the geocharts to load if the user goes through all steps
        setGeochartsToAdd(configFromType.geocoreInfo?.geocharts);

        // Keep in state the time-slider configs to load if the user goes through all steps
        setTimeSliderToAdd(configFromType.geocoreInfo?.timeSliderConfigs);

        // Capture if this is a GeoCore layer before changing the type
        if (curlayerType === 'geoCore') {
          setIsGeoCore(true);
        }

        // Set the layer type as it may have changed in the case of GeoCore for example
        setLayerType(geoviewLayerConfig.geoviewLayerType);

        // Update UI
        setLayerURL(layerURL.startsWith('blob') ? layerURL : geoviewLayerConfig.metadataAccessPath || layerURL);

        // Get the name and ID of the first entry before deleting the listOfLayerEntryConfig
        const idOfFirstLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0]?.layerId;
        const nameOfFirstLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0]?.getLayerName();
        setLayerName(nameOfFirstLayerEntryConfig?.split('.')[0] || geoviewLayerConfig.geoviewLayerName || idOfFirstLayerEntryConfig);

        // XYZ Tile layer generic name will be {x} here, so we replace it
        if (layerName === '{x}' || layerName === '{X}') setLayerName(t('layers.serviceRasterTile'));

        setLayerTree(geoviewLayerConfig);

        // If there's more than 1 layer entry or 1 entry which is a group
        setIsMultiple(
          geoviewLayerConfig.listOfLayerEntryConfig.length > 1 ||
            (geoviewLayerConfig.listOfLayerEntryConfig.length === 1 &&
              geoviewLayerConfig.listOfLayerEntryConfig[0] instanceof GroupLayerEntryConfig)
        );

        // If there's any listOfLayerEntryConfig entry
        if (geoviewLayerConfig.listOfLayerEntryConfig.length > 0) {
          // Immediately assume the user wants the first entry until they chose otherwise
          setLayerIdsToAdd([geoviewLayerConfig.listOfLayerEntryConfig[0]?.layerId ?? idOfFirstLayerEntryConfig]);
        }

        // All good
        return true;
      } catch (err) {
        // If the error carries a localized message key (GeoViewError), show it directly
        const gvError = err as GeoViewError;
        if (gvError?.messageKey && gvError.messageKey.startsWith('validation.')) {
          setIsLoading(false);
          setServiceTypeError(true);
          setServiceTypeErrorMessage(t(gvError.messageKey, gvError.messageParams));
          setStepButtonEnabled(false);
          uiController.addMessage('error', gvError.messageKey, gvError.messageParams);
        } else {
          setServiceTypeError(true);
          setServiceTypeErrorMessage(t('layers.errorServer', { serviceTypeName: curlayerType }));
          setStepButtonEnabled(false);
          showUnsupportedServiceError(curlayerType);
        }
        logger.logError(err);
      }

      // Failed
      return false;
    };

    let promise;
    if (layerType === SHAPEFILE || layerType === GEOPACKAGE) {
      promise = Promise.resolve(true);
    } else if (
      layerType === WMS ||
      layerType === WMTS ||
      layerType === WFS ||
      layerType === OGC_FEATURE ||
      layerType === XYZ_TILES ||
      layerType === ESRI_DYNAMIC ||
      layerType === ESRI_FEATURE ||
      layerType === ESRI_IMAGE ||
      layerType === GEOJSON ||
      layerType === GEOTIFF ||
      layerType === KML ||
      layerType === CSV ||
      layerType === VECTOR_TILES ||
      layerType === 'geoCore'
    ) {
      promise = populateLayerList(layerType);
    } else {
      setIsLoading(false);
      setServiceTypeError(true);
      setServiceTypeErrorMessage(t('layers.errorEmpty', { textFieldName: t('layers.service') }));
      setStepButtonEnabled(false);
      showRequiredFieldError(t('layers.service'));
    }

    // If we have a promise of a layer validation
    if (promise && !abortController.signal.aborted) {
      promise
        .then((isValid) => {
          if (isValid) {
            setIsLoading(false);
            if (!abortController.signal.aborted) setActiveStep(2);
            else setAbortController(new AbortController());
          }
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('promise of layer validation in handleStep2 in AddNewLayer', error);
        });
    } else if (abortController.signal.aborted) setAbortController(new AbortController());
  };

  /**
   * Handle the third step of the layer addition process
   *
   * @description Validates layer selection and name,
   * and either advances to the final step or completes the process
   * depending on whether multiple layers are selected.
   */
  const handleStep3 = (): void => {
    let valid = true;

    if (layerIdsToAdd.length === 0) {
      if (!layerName) {
        valid = false;
        showRequiredFieldError(t('layers.layer'));
      }
    }

    if (valid) {
      // If a single layer is added, use its name instead of service name
      const firstLayerName = UtilAddLayer.findLayerNameById(layerTree, layerIdsToAdd[0]);
      const isSingleGroupLayer = layerIdsToAdd.every((layerId) => layerId.split('/')[0] === layerIdsToAdd[0]);
      if ((layerIdsToAdd.length === 1 || isSingleGroupLayer) && firstLayerName) setLayerName(firstLayerName);
      setActiveStep(3);
    }
  };

  /**
   * Creates a full geoview config from the basic one supplied, modifies it and adds it to map.
   * @param newGeoViewLayer - The config of the layer to add
   * @returns A Promise that resolves when the layer is added
   */
  const addGeoviewLayer = async (newGeoViewLayer: MapConfigLayerEntry): Promise<void> => {
    // Create new abort controller to handle canceling of this step.
    setAbortController(new AbortController());

    // Shapefile config must be converted to GeoJSON before we proceed
    if (newGeoViewLayer.geoviewLayerType === SHAPEFILE)
      // eslint-disable-next-line no-param-reassign
      newGeoViewLayer = await ShapefileReader.convertShapefileConfigToGeoJson(
        newGeoViewLayer as ShapefileLayerConfig,
        abortController.signal
      );

    // GeoPackage config must be converted to WKB before we proceed
    if (newGeoViewLayer.geoviewLayerType === GEOPACKAGE)
      // eslint-disable-next-line no-param-reassign
      newGeoViewLayer = await GeoPackageReader.createLayerConfigFromGeoPackage(
        newGeoViewLayer as GeoPackageLayerConfig,
        abortController.signal
      );

    // Use the config to convert simplified layer config into proper layer config
    const configObj = Config.initializeMapConfig(mapId, [newGeoViewLayer], (gvError: GeoViewError) => {
      // Get the message for the logger
      const message = gvError.translateMessage(language);

      // Log it
      logger.logWarning(`- Map ${mapId}: ${message}`);

      // Show the error using its key (which will get translated)
      uiController.addMessage('error', gvError.messageKey, gvError.messageParams);
    });

    if (configObj?.length) {
      // XYZ tile uses dataAccessPath which has been set, so remove metdataAccessPath
      if (configObj[0].geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES) delete configObj[0].metadataAccessPath;

      logger.logDebug('newGeoViewLayer to add', configObj[0]);

      // If GeoChart plugin is active, add pending GeoCharts before adding the layer.
      if (geoChartController && geochartsToAdd) {
        Object.entries(geochartsToAdd).forEach(([layerPath, geochartConfig]): void => {
          geoChartController.addChart(layerPath, geochartConfig);
          uiController.showTabButton('geochart');
        });
      }

      // If time-slider configs are pending, merge them into corePackagesConfig before adding the layer.
      // The configs are stored for the time-slider plugin to pick up if it's configured in the footer bar.
      if (timeSliderToAdd && timeSliderToAdd.length > 0) {
        layerCreatorController.mergeTimeSliderConfigsIntoCorePackages(timeSliderToAdd);
      }

      // Add the layer through the controller
      const addedLayer: GeoViewLayerAddedResult = layerCreatorController.addGeoviewLayer(
        configObj[0] as TypeGeoviewLayerConfig,
        abortController.signal
      );

      if (!abortController.signal.aborted) {
        // Wait on the promise
        addedLayer.promiseLayer
          .then(() => {
            doneAdding();
            doneAddedShowMessage(addedLayer.layer);
          })
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('addedLayer.promiseLayer in handleStepLast in AddNewLayer', error);
            setIsLoading(false);
          });
      } else if (abortController.signal.aborted) setAbortController(new AbortController());
    }
  };

  /**
   * Handle the final step of the layer addition process
   *
   * @description Creates and adds the configured layer to the map,
   * shows appropriate notifications, and returns to the layer panel.
   */
  const handleStepLast = (): void => {
    setIsLoading(true);
    const newGeoViewLayer = UtilAddLayer.buildGeoLayerToAdd({
      layerIdsToAdd,
      layerName,
      layerType: layerType as TypeInitialGeoviewLayerType,
      layerURL,
      layerTree: layerTree!,
      isGeoCore,
    });

    if (newGeoViewLayer)
      addGeoviewLayer(newGeoViewLayer).catch((error) => {
        logger.logError(error, 'Unable to load layer');
      });
    else {
      // Remove spinning circle if failed.
      doneAdding();
      uiController.addMessage('error', 'layers.errorNotLoaded', { layerName });
      logger.logError('Unable to load layer');
    }
  };

  // #endregion HANDLERS FOR THE STEPS

  // #region HANDLERS

  /**
   * Handle the behavior of the 'Back' button in the Stepper UI
   */
  const handleBack = (): void => {
    // On step 1 or 3, abort the fetch that may be underway
    if (activeStep === 1 || activeStep === 3) {
      abortController.abort();
      setIsLoading(false);
    }

    // Clear errors when going back
    if (activeStep === 1) {
      setUrlError(false);
      setUrlErrorMessage('');
    }
    if (activeStep === 2) {
      setServiceTypeError(false);
      setServiceTypeErrorMessage('');
    }

    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);
    // We assume previous step ok, so enable continue button
    setStepButtonEnabled(true);
  };

  /**
   * Set layerType from form input (Step 2).
   */
  const handleSelectType = (event: SelectChangeEvent<unknown>): void => {
    // Clear previous errors when user makes a selection
    setServiceTypeError(false);
    setServiceTypeErrorMessage('');

    setLayerType(event.target.value as TypeInitialGeoviewLayerType);
    setLayerTree(undefined);
    setLayerIdsToAdd([]);
    setIsGeoCore(false);
    setGeochartsToAdd(undefined);
    setTimeSliderToAdd(undefined);
    setStepButtonEnabled(true);
  };

  /**
   * Set the layer name from form input (Step 3).
   */
  const handleNameLayer = (event: ChangeEvent<HTMLInputElement>): void => {
    setStepButtonEnabled(true);
    setLayerName(event.target.value);
  };

  /**
   * Handle keydowns on back button.
   */
  const handleBackKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter') {
      handleBack();
      event.preventDefault();
    }
  };

  /**
   * Handle keydowns on continue/finish button.
   */
  const handleNextKeyDown = (event: KeyboardEvent<HTMLButtonElement> | KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' && stepButtonEnabled) {
      switch (activeStep) {
        case 0:
          handleStep1();
          break;
        case 1:
          handleStep2();
          break;
        case 2:
          isMultiple ? handleStep3() : handleStepLast();
          break;
        case 3:
          handleStepLast();
          break;
        default:
          break;
      }
      event.preventDefault();
    }
  };

  /**
   * Handles file selection from the FileUploadSection component.
   */
  const handleFileSelected = (file: File, fileURL: string, fileName: string): void => {
    setDisplayURL(file.name);
    setLayerURL(fileURL);
    setLayerType('');
    setLayerTree(undefined);
    setLayerName(fileName.split('/').pop()?.split('.')[0] || fileName.split('.')[0]);
    setLayerIdsToAdd([]);
    setIsGeoCore(false);
    setGeochartsToAdd(undefined);
    setTimeSliderToAdd(undefined);
    setStepButtonEnabled(true);
  };

  /**
   * Handles URL input changes from the FileUploadSection component.
   */
  const handleUrlChanged = (url: string): void => {
    setDisplayURL(url);
    setLayerURL(url);
    setLayerType('');
    setLayerTree(undefined);
    setLayerName(url.split('/').pop()?.split('.')[0] || url.split('.')[0]);
    setLayerIdsToAdd([]);
    setIsGeoCore(false);
    setGeochartsToAdd(undefined);
    setTimeSliderToAdd(undefined);
  };

  // #endregion HANDLERS

  // #region USE EFFECTS

  /**
   * Validates the URL and manages step button enabled state based on active step.
   */
  useEffect(() => {
    logger.logTraceUseEffect('ADD-NEW-LAYER - URL validation and step button state', activeStep, layerURL);
    if (activeStep === 0) {
      // Validate URL for step 1
      const validateUrl = async (): Promise<void> => {
        // Clear previous errors when input changes
        setUrlError(false);
        setUrlErrorMessage('');
        // Allow blob URLs (local files) and GeoCore UUIDs without validation
        if (layerURL.startsWith('blob') || isValidUUID(layerURL.trim())) {
          // Check if this UUID is already loaded on the map
          if (isValidUUID(layerURL.trim()) && layerController.getGeoviewLayerIds().includes(layerURL.trim())) {
            setStepButtonEnabled(false);
            setUrlError(true);
            setUrlErrorMessage(t('layers.errorUrlDuplicateUUID'));
            uiController.addMessage('error', 'layers.errorUrlDuplicateUUID', {});
            return;
          }
          setStepButtonEnabled(true);
          return;
        }

        // Validate and ping HTTPS URLs
        if (layerURL.startsWith('https://')) {
          setIsLoading(true);
          try {
            const check = await validateAndPingUrl(layerURL);
            logger.logDebug('URL validation check', check);
            const isOk = check.isValid && check.isReachable;
            setStepButtonEnabled(isOk);
            if (!isOk) {
              setUrlError(true);
              if (check.error) {
                setUrlErrorMessage(t('layers.errorUrlUnreachable'));
                uiController.addMessage('error', 'layers.errorUrlUnreachable', {});
              } else if (!check.isValid) {
                setUrlErrorMessage(t('layers.errorUrlInvalid'));
                uiController.addMessage('error', 'layers.errorUrlInvalid', {});
              } else {
                setUrlErrorMessage(t('layers.errorUrlUnreachable'));
                uiController.addMessage('error', 'layers.errorUrlUnreachable', {});
              }
            }
          } catch (error: unknown) {
            // Handle exceptions from validateAndPingUrl (network errors, timeouts, etc.)
            logger.logError('URL validation failed', error);
            setStepButtonEnabled(false);
            setUrlError(true);
            setUrlErrorMessage(t('layers.errorUrlUnreachable'));
            uiController.addMessage('error', 'layers.errorUrlUnreachable', {});
          } finally {
            setIsLoading(false);
          }
        } else {
          // This else block MUST remain outside the try-catch
          // It handles invalid UUID format and non-HTTPS URLs
          setStepButtonEnabled(false);
          if (layerURL.trim() !== '') {
            const trimmedUrl = layerURL.trim();
            setUrlError(true);
            if (!isValidUUID(trimmedUrl) && !trimmedUrl.includes('.') && !trimmedUrl.includes('/')) {
              setUrlErrorMessage(t('layers.errorUrlInvalidUUID'));
              uiController.addMessage('error', 'layers.errorUrlInvalidUUID', {});
            } else {
              setUrlErrorMessage(t('layers.errorUrlHttps'));
              uiController.addMessage('error', 'layers.errorUrlHttps', {});
            }
          }
        }
      };

      validateUrl().catch((error: unknown) => {
        logger.logError('URL validation failed', error);
        setStepButtonEnabled(false);
        uiController.addMessage('error', 'layers.errorUrlUnreachable', {});
      });
    }
    if (activeStep === 1) {
      // Disable button if no layer type selected
      setStepButtonEnabled(layerType !== '');
    }
    if (activeStep === 2 && layerIdsToAdd.length > 0) setStepButtonEnabled(true);
    if (activeStep === 2 && !layerIdsToAdd.length) setStepButtonEnabled(false);
  }, [layerURL, activeStep, layerIdsToAdd, layerType, uiController, layerController, t]);

  /**
   * Manages focus when Step 2 validation errors occur.
   */
  useEffect(() => {
    logger.logTraceUseEffect('ADD-NEW-LAYER - Step 2 error focus management', serviceTypeError);

    if (activeStep === 1 && serviceTypeError) {
      const element = serviceTypeRef.current?.querySelector<HTMLElement>('[role="combobox"]');
      element?.focus();
    }
  }, [serviceTypeError, activeStep]);

  /**
   * Manages input focus when the active step changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('ADD-NEW-LAYER - step focus management', activeStep);

    if (activeStep === 0) {
      // Focus the upload button using the ref
      const timeoutId = setTimeout(() => {
        uploadButtonRef.current?.focus();
      }, 0);

      // Cleanup: cancel focus attempt if step changes or unmounts
      return () => clearTimeout(timeoutId);
    }

    if (activeStep === 1) {
      const element = serviceTypeRef.current?.querySelector<HTMLElement>('[role="combobox"]');
      element?.focus();
    }

    if (activeStep === 2) {
      if (isMultiple) {
        // Focus the first tree item in the multi-layer selection tree
        const treeItemToFocus = layerSelectionTreeContainerRef.current?.querySelector<HTMLElement>('[role="treeitem"]');
        treeItemToFocus?.focus();
      } else {
        // Focus the layer name input of single layer configuration
        configureLayerNameInputRef.current?.focus();
      }
    }

    if (activeStep === 3) {
      finalLayerNameInputRef.current?.focus();
    }

    // No cleanup needed for other steps (synchronous focus calls)
    return undefined;
  }, [activeStep, isMultiple]);

  // #endregion USE EFFECTS

  /**
   * Creates a set of Continue / Back buttons
   *
   * @param param0 specify if button is first or last in the list
   * @returns React component
   */
  // TODO: refactor - remove the unstable nested component
  // eslint-disable-next-line react/no-unstable-nested-components
  function NavButtons({ isFirst = false, isLast = false, handleNext }: ButtonPropsLayerPanel): JSX.Element {
    return (
      <ButtonGroup sx={sxClasses.buttonGroup}>
        {isLoading ? (
          <IconButton sx={{ width: '80px' }} size="small" className="buttonOutlineFilled" disabled aria-label={t('layers.stepOneLoading')}>
            <CircularProgressBase size="20px" />
          </IconButton>
        ) : (
          <Button
            variant="contained"
            className="buttonOutlineFilled"
            size="small"
            type="text"
            disabled={isLast ? layerName === undefined || layerName === '' : !stepButtonEnabled}
            onClick={handleNext}
            onKeyDown={handleNextKeyDown}
          >
            {isLast ? t('layers.finish') : t('layers.continue')}
          </Button>
        )}
        {!isFirst && (
          <Button
            variant="contained"
            className="buttonOutlineFilled"
            size="small"
            type="text"
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
          >
            {t('layers.back')}
          </Button>
        )}
        {isFirst && (
          <Button variant="contained" className="buttonOutlineFilled" size="small" type="text" onClick={handleCancelAddLayer}>
            {t('general.cancel')}
          </Button>
        )}
      </ButtonGroup>
    );
  }

  return (
    <Paper sx={{ padding: '20px', gap: '8' }}>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{
          '& .MuiStepLabel-label:not(.Mui-active):not(.Mui-completed)': {
            color: theme.palette.geoViewColor?.textColor.light[200], // WCAG - Matches global placeholder text color
          },
        }}
        steps={[
          {
            stepLabel: {
              children: t('layers.stepOne'),
            },
            stepContent: {
              children: (
                <Box>
                  <FileUploadSection
                    onFileSelected={handleFileSelected}
                    onUrlChanged={handleUrlChanged}
                    onKeyDown={handleNextKeyDown}
                    displayURL={displayURL}
                    disabledLayerTypes={disabledLayerTypes}
                    uploadButtonRef={uploadButtonRef}
                    urlError={urlError}
                    urlErrorMessage={urlErrorMessage}
                  />
                  <NavButtons isFirst handleNext={handleStep1} />{' '}
                </Box>
              ),
            },
          },
          {
            stepLabel: {
              children: t('layers.stepTwo'),
            },
            stepContent: {
              children: (
                <>
                  <Box>
                    <Select
                      fullWidth
                      labelId="service-type-label"
                      value={layerType}
                      onChange={handleSelectType}
                      label={t('layers.service')}
                      variant="standard"
                      MenuProps={{ container: shellContainer }}
                      inputLabel={{
                        id: 'service-type-label',
                      }}
                      formControlProps={{ error: serviceTypeError }}
                      ref={serviceTypeRef}
                      aria-describedby={serviceTypeError ? 'service-type-error' : undefined}
                      menuItems={layerOptions
                        .filter(([value]) => {
                          return !disabledLayerTypes.includes(value as TypeInitialGeoviewLayerType);
                        })
                        .map(([value, label]) => ({
                          key: value,
                          item: {
                            value,
                            children: label,
                          },
                        }))}
                    />
                    {serviceTypeError && (
                      <FormHelperText id="service-type-error" error role="status" aria-live="polite" aria-atomic="true">
                        {serviceTypeErrorMessage}
                      </FormHelperText>
                    )}
                  </Box>
                  <NavButtons handleNext={handleStep2} />
                </>
              ),
            },
          },
          {
            stepLabel: {
              children: t('layers.stepThree'),
            },
            stepContent: {
              children: (
                <>
                  {/* Show TextField if only one or no layer entries */}
                  {isSingle ? (
                    <TextField
                      label={t('layers.name')}
                      variant="standard"
                      value={layerName}
                      onChange={handleNameLayer}
                      inputRef={configureLayerNameInputRef}
                      onKeyDown={handleNextKeyDown}
                    />
                  ) : (
                    layerTree && (
                      <Box
                        ref={layerSelectionTreeContainerRef}
                        sx={{
                          // Targets the inner content wrapper when the main item or root receives native JS focus
                          '& .MuiTreeItem-root:focus > .MuiTreeItem-content, & .MuiTreeItem-root:focus-within > .MuiTreeItem-content': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <AddLayerTree layerTree={layerTree} onSelectedItemsChange={setLayerIdsToAdd} />
                      </Box>
                    )
                  )}
                  <br />
                  <NavButtons isLast={!isMultiple} handleNext={isMultiple ? handleStep3 : handleStepLast} />
                </>
              ),
            },
          },
          isMultiple
            ? {
                stepLabel: {
                  children: t('layers.stepFour'),
                },
                stepContent: {
                  children: (
                    <>
                      <TextField
                        sx={{ width: '100%' }}
                        label={t('layers.name')}
                        variant="standard"
                        value={layerName}
                        onChange={handleNameLayer}
                        onKeyDown={handleNextKeyDown}
                        inputRef={finalLayerNameInputRef}
                      />
                      <br />
                      <NavButtons isLast handleNext={handleStepLast} />
                    </>
                  ),
                },
              }
            : null,
        ]}
      />
    </Paper>
  );
}

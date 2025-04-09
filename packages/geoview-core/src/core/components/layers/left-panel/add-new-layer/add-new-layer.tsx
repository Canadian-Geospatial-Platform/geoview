import React, { ChangeEvent, useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Button,
  ButtonGroup,
  ButtonPropsLayerPanel,
  CircularProgressBase,
  // FileUploadIcon,
  Paper,
  Select,
  Stepper,
  TextField,
} from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useAppDisabledLayerTypes, useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';
import { Config } from '@/core/utils/config/config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import {
  CONST_LAYER_TYPES,
  TypeGeoviewLayerTypeWithGeoCore,
  AbstractGeoViewLayer,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  CONST_LAYER_ENTRY_TYPES,
  EntryConfigBaseClass,
  GroupLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
} from '@/api/config/types/map-schema-types';

import { ConfigApi } from '@/api/config/config-api';
import { buildGeoLayerToAdd, getLayerNameById } from './add-layer-utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';
import { AddLayerTree } from './add-layer-tree';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

export function AddNewLayer(): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-new-layer/add-new-layer');

  const { t } = useTranslation<string>();

  // TODO: refactor - add the Geopacakges when refactor is done GEOPACKAGE
  const { CSV, ESRI_DYNAMIC, ESRI_FEATURE, ESRI_IMAGE, GEOJSON, WMS, WFS, OGC_FEATURE, XYZ_TILES, VECTOR_TILES } = CONST_LAYER_TYPES;
  const { GEOCORE } = CONST_LAYER_ENTRY_TYPES;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [displayURL, setDisplayURL] = useState('');
  const [layerType, setLayerType] = useState<TypeGeoviewLayerTypeWithGeoCore | ''>('');
  const [layerList, setLayerList] = useState<GroupLayerEntryConfig[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerIdsToAdd, setLayerIdsToAdd] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [drag, setDrag] = useState<boolean>(false);
  const [stepButtonEnabled, setStepButtonEnabled] = useState<boolean>(false);

  // const dragPopover = useRef(null);
  // const uploadBtnRef = useRef<HTMLButtonElement>(null);
  const serviceTypeRef = useRef<HTMLDivElement>(null);
  const isMultipleRef = useRef<HTMLDivElement>(null);
  const isMultipleTextFieldRef = useRef<HTMLDivElement>(null);

  // get values from store
  const mapId = useGeoViewMapId();
  const disabledLayerTypes = useAppDisabledLayerTypes();
  const { setDisplayState } = useLayerStoreActions();
  const language = useAppDisplayLanguage();

  const isMultiple = (): boolean => layerList.length > 1 || (layerList[0] && layerList[0].listOfLayerEntryConfig?.length > 1);

  /**
   * List of layer types and labels
   */
  const layerOptions = [
    [CSV, 'CSV'],
    [ESRI_DYNAMIC, 'ESRI Dynamic Service'],
    [ESRI_FEATURE, 'ESRI Feature Service'],
    [ESRI_IMAGE, 'ESRI Image Service'],
    [GEOJSON, 'GeoJSON'],
    [WMS, 'OGC Web Map Service (WMS)'],
    [WFS, 'OGC Web Feature Service (WFS)'],
    [OGC_FEATURE, 'OGC API Features'],
    [XYZ_TILES, 'XYZ Raster Tiles'],
    [VECTOR_TILES, 'Vector Tile Service'],
    [GEOCORE, 'GeoCore'],
  ];

  const sxClasses = {
    buttonGroup: {
      paddingTop: 12,
      gap: 6,
    },
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorEmpty = (textField: string): void => {
    setIsLoading(false);
    api.getMapViewer(mapId).notifications.showError(`${textField} ${t('layers.errorEmpty')}`, [], false);
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorNone = (): void => {
    setIsLoading(false);
    api.getMapViewer(mapId).notifications.showError('layers.errorNone', [], false);
  };

  /**
   * Emits an error dialogue when a layer type is disabled
   *
   * @param disabledType label for the TextField input that cannot be empty
   */
  const emitErrorDisabled = (disabledType: string): void => {
    setIsLoading(false);
    api.getMapViewer(mapId).notifications.showError('layers.errorDisabled', [disabledType], false);
  };

  // /**
  //  * Emits an error dialogue when unsupported files are uploaded
  //  *
  //  * @param textField label for the TextField input that cannot be empty
  //  */
  // const emitErrorFile = (): void => {
  //   api.getMapViewer(mapId).notifications.showError('layers.errorFile', [], false);
  // };

  /**
   * Emits an error when the URL does not support the selected service type
   *
   * @param serviceName type of service provided by the URL
   */
  const emitErrorServer = (serviceName: string): void => {
    setIsLoading(false);
    api.getMapViewer(mapId).notifications.showError(`${serviceName} ${t('layers.errorServer')}`, [], false);
  };

  const setLayerTypeIfAllowed = (layerTypeValue: TypeGeoviewLayerTypeWithGeoCore): boolean => {
    if (disabledLayerTypes.includes(layerTypeValue)) {
      emitErrorDisabled(layerTypeValue);
      setLayerType('');
      setStepButtonEnabled(false);
      return false;
    }
    setLayerType(layerTypeValue);
    return true;
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep1 = (): void => {
    let valid = true;
    if (layerURL.trim() === '') {
      valid = false;
      emitErrorNone();
    }

    const guessedLayerType = api.config.guessLayerType(displayURL);
    const layerTypeIsAllowed = setLayerTypeIfAllowed(guessedLayerType as TypeGeoviewLayerType);
    if (valid && layerTypeIsAllowed) {
      setActiveStep(1);
    }
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep2 = (): void => {
    setIsLoading(true);

    const populateLayerList = async (curlayerType: TypeGeoviewLayerType | 'geoCore'): Promise<boolean> => {
      try {
        // Create an instance of the GeoView layer. The list of layer entry config is empty, but if the URL specify a sublayer
        // the instance created will adjust the metadata access path and the list of sublayers accordingly.
        const geoviewLayerConfig = await api.config.createLayerConfig(layerURL, curlayerType, [], language);
        if (geoviewLayerConfig && !geoviewLayerConfig.getErrorDetectedFlag()) {
          setLayerType(geoviewLayerConfig.geoviewLayerType);
          setLayerURL(geoviewLayerConfig.metadataAccessPath);
          // GV: Here, the list of layer entry config may be empty or it may contain one layer Id specified in the URL.
          // GV: This list of layer entry config will be used as a filter for the layer tree. Also, when we want to build the layer tree,
          // GV: we set the metadata layer tree with the layer tree filter and use an empty list of layer entry config. This is how the
          // GV: GeoView instance differentiate the creation of a layer tree and the creation of a GeoView layer with its list of sublayers.
          // Set the layer tree filter.
          geoviewLayerConfig.setMetadataLayerTree(
            (geoviewLayerConfig.listOfLayerEntryConfig.length
              ? [{ layerId: geoviewLayerConfig.listOfLayerEntryConfig[0].layerId }]
              : []) as EntryConfigBaseClass[]
          );

          // Get the name and ID of the first entry before deleting the listOfLayerEntryConfig
          const idOfFirstLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0]?.layerId;
          const nameOfFirstLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0]?.layerName;

          // GV: The listOfLayerEntryConfig must be empty when we want to build the layer tree.
          geoviewLayerConfig.listOfLayerEntryConfig = [];

          // Then, we fetch the service metadata. This will populate the layer tree.
          await geoviewLayerConfig.fetchServiceMetadata();
          const metadata = geoviewLayerConfig.getServiceMetadata();

          // Attempt to get a name from metadata
          if (
            geoviewLayerConfig.geoviewLayerName === 'unknown' ||
            (geoviewLayerConfig.geoviewLayerName === 'inconnue' && (metadata.mapName || metadata.Service?.Title || metadata.Service?.Name))
          )
            geoviewLayerConfig.geoviewLayerName =
              (metadata.mapName as string) || (metadata.Service?.Title as string) || (metadata.Service?.Name as string);

          // Generate layer tree
          const layersTree = geoviewLayerConfig.getMetadataLayerTree()!;
          logger.logDebug('layersTree', layersTree);
          setLayerList(layersTree as GroupLayerEntryConfig[]);

          // If there is more than one entry in tree, use the geoview layer name, otherwise use the sublayer name
          if (layersTree.length > 1 && geoviewLayerConfig.geoviewLayerName) setLayerName(geoviewLayerConfig.geoviewLayerName);
          else if (layersTree.length === 1) setLayerName(layersTree[0]?.layerName ?? geoviewLayerConfig.geoviewLayerName);

          // If there is either no entries or a single entry that is not a layer, we will bypass tree selection, so set ID and name
          if (layersTree.length === 0 || (layersTree.length === 1 && !layersTree[0].isLayerGroup)) {
            setLayerIdsToAdd([layersTree[0]?.layerId ?? idOfFirstLayerEntryConfig]);
            setLayerName(layersTree[0]?.layerName ?? nameOfFirstLayerEntryConfig ?? geoviewLayerConfig.geoviewLayerName);
          }

          return true;
        }

        throw new GeoviewLayerConfigError(`Unable to create ${curlayerType} GeoView layer using "${layerURL} URL.`);
      } catch (err) {
        emitErrorServer(curlayerType);
        logger.logError(err);
        return false;
      }
    };

    let promise;
    if (layerType === undefined) {
      setIsLoading(false);
      emitErrorEmpty(t('layers.service'));
    } else if (
      layerType === WMS ||
      layerType === WFS ||
      layerType === OGC_FEATURE ||
      layerType === XYZ_TILES ||
      layerType === ESRI_DYNAMIC ||
      layerType === ESRI_FEATURE ||
      layerType === ESRI_IMAGE ||
      layerType === GEOJSON ||
      layerType === CSV ||
      layerType === VECTOR_TILES ||
      layerType === 'geoCore'
    ) {
      promise = populateLayerList(layerType);
    }

    // If we have a promise of a layer validation
    if (promise) {
      promise
        .then((isValid) => {
          if (isValid) {
            setIsLoading(false);
            setActiveStep(2);
            // disable continue button until a layer entry is selected
            setStepButtonEnabled(false);
          }
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('promise of layer validation in handleStep2 in AddNewLayer', error);
        });
    }
  };

  /**
   * Handle the behavior of the 'Step3' button in the Stepper UI
   */
  const handleStep3 = (): void => {
    let valid = true;
    if (layerIdsToAdd.length === 0) {
      if (!layerName) {
        valid = false;
        emitErrorEmpty(t('layers.layer'));
      }
    }

    if (valid) {
      // If a single layer is added, use its name instead of service name
      const firstLayerName = getLayerNameById(layerList, layerIdsToAdd[0]);
      if (layerIdsToAdd.length === 1 && firstLayerName) setLayerName(firstLayerName);
      setActiveStep(3);
    }
  };

  const doneAdding = (): void => {
    // Done adding
    setIsLoading(false);
    setDisplayState('view');
    MapEventProcessor.setLayerZIndices(mapId);
  };

  const doneAddedShowMessage = (layerBeingAdded: AbstractGeoViewLayer): void => {
    if (layerBeingAdded.allLayerStatusAreGreaterThanOrEqualTo('error'))
      api.getMapViewer(mapId).notifications.showError('layers.layerAddedWithError', [layerName]);
    else if (layerBeingAdded?.allLayerStatusAreGreaterThanOrEqualTo('loaded'))
      api.getMapViewer(mapId).notifications.showMessage('layers.layerAdded', [layerName]);
    else api.getMapViewer(mapId).notifications.showMessage('layers.layerAddedAndLoading', [layerName]);
  };

  /**
   * Handle the behavior of the 'Finish' button in the Stepper UI
   */
  const handleStepLast = (): void => {
    setIsLoading(true);
    const newGeoViewLayer = buildGeoLayerToAdd({
      layerIdsToAdd,
      layerName,
      layerType,
      layerURL,
      layerList,
    });

    if (newGeoViewLayer) {
      newGeoViewLayer.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
        // eslint-disable-next-line no-param-reassign
        if (layerEntryConfig.source) layerEntryConfig.source = { dataAccessPath: layerEntryConfig.source.dataAccessPath };
      });

      // Use the config to convert simplified layer config into proper layer config
      const config = new Config(language);
      const configObj = config.initializeMapConfig(mapId, [newGeoViewLayer], (errorKey: string, params: string[]) => {
        // Create the error
        const error = new GeoViewError(mapId, errorKey, params);

        // Log it
        logger.logWarning(`- Map ${mapId}: ${error.message}`);

        // Show the error
        api.getMapViewer(mapId).notifications.showError(error.message);
      });

      if (configObj?.length) {
        // XYZ tile uses dataAccessPath which has been set, so remove metdataAccessPath
        if (configObj[0].geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES) delete configObj[0].metadataAccessPath;

        logger.logDebug('newGeoViewLayer to add', configObj[0]);
        // Add the layer using the proper function
        const addedLayer = api.getMapViewer(mapId).layer.addGeoviewLayer(configObj[0] as TypeGeoviewLayerConfig);
        if (addedLayer) {
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
        }
      }
    } else {
      // Remove spinning circle if failed.
      doneAdding();
      api.getMapViewer(mapId).notifications.showError('layers.errorNotLoaded', [layerName]);
      logger.logError('Unable to load layer');
    }
  };

  /**
   * Handle the behavior of the 'Back' button in the Stepper UI
   */
  const handleBack = (): void => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);

    // We assume previous step ok, so enable continue button
    setStepButtonEnabled(true);
  };

  // /**
  //  * Set layer URL from file input
  //  *
  //  * @param {File} file - Uploaded file
  //  */
  // const handleFile = (file: File): void => {
  //   const fileURL = URL.createObjectURL(file);
  //   setDisplayURL(file.name);
  //   setLayerURL(fileURL);
  //   const fileName = file.name.split('.')[0];
  //   setLayerType('');
  //   setLayerList([]);
  //   setLayerName(fileName);
  //   setLayerIdsToAdd([]);
  //   setStepButtonEnabled(true);
  // };

  // const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
  //   if (event.target.files) handleFile(event.target.files[0]);
  // };

  /**
   * Set layer URL from form input
   * @param {ChangeEvent<HTMLInputElement>} event - TextField event
   */
  const handleInput = (event: ChangeEvent<HTMLInputElement>): void => {
    setDisplayURL(event.target.value.trim());
    setLayerURL(event.target.value.trim());
    setLayerType('');
    setLayerList([]);
    setLayerName('');
    setLayerIdsToAdd([]);
  };

  /**
   * Set layerType from form input
   *
   * @param {SelectChangeEvent<unknown>} event - TextField event
   */
  const handleSelectType = (event: SelectChangeEvent<unknown>): void => {
    setLayerType(event.target.value as TypeGeoviewLayerTypeWithGeoCore);
    setLayerList([]);
    setLayerIdsToAdd([]);

    setStepButtonEnabled(true);
  };

  /**
   * Set the layer name from form input
   *
   * @param {ChangeEvent<HTMLInputElement>} event - TextField event
   */
  const handleNameLayer = (event: ChangeEvent<HTMLInputElement>): void => {
    setStepButtonEnabled(true);
    setLayerName(event.target.value);
  };

  useEffect(() => {
    if (activeStep === 0) {
      // TODO: create a utilities function to test valid URL before we enable the continue button
      // TO.DOCONT: This function should try to ping the server for an answer...
      // Check if url or geocore is provided
      setStepButtonEnabled(layerURL.startsWith('https://') || ConfigApi.isValidUUID(layerURL.trim()) || layerURL.startsWith('blob'));
    }
    if (activeStep === 2 && layerIdsToAdd.length > 0) setStepButtonEnabled(true);
    if (activeStep === 2 && !layerIdsToAdd.length) setStepButtonEnabled(false);
  }, [layerURL, activeStep, layerIdsToAdd]);

  useEffect(() => {
    if (activeStep === 1) {
      (serviceTypeRef.current?.getElementsByTagName('input')[0].previousSibling as HTMLDivElement).focus();
    }

    if (activeStep === 2) {
      if (isMultipleRef.current) {
        // handle is Multiple fields focus
        const id = isMultipleRef.current?.dataset?.id;
        const elem = isMultipleRef.current?.querySelector('#service-layer-label') as HTMLInputElement;
        if (id === 'autocomplete' && elem) {
          elem.focus();
        } else {
          isMultipleTextFieldRef.current?.getElementsByTagName('input')[0]?.focus();
        }
      }
    }

    if (activeStep === 3) {
      isMultipleTextFieldRef.current?.getElementsByTagName('input')[0]?.focus();
    }
  }, [activeStep]);

  // /**
  //  * Handle file dragged into dropzone
  //  *
  //  * @param {DragEvent<HTMLDivElement>} event - Drag event
  //  */
  // const handleDragEnter = (event: React.DragEvent<HTMLDivElement>): void => {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   if (event.target !== dragPopover.current) {
  //     setDrag(true);
  //   }
  // };

  // /**
  //  * Handle file dragged out of dropzone
  //  *
  //  * @param {DragEvent<HTMLDivElement>} event - Drag event
  //  */
  // const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   if (event.target === dragPopover.current) setDrag(false);
  // };

  // /**
  //  * Prevent default behaviour when file dragged over dropzone
  //  *
  //  * @param {DragEvent<HTMLDivElement>} event - Drag event
  //  */
  // const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
  //   event.preventDefault();
  //   event.stopPropagation();
  // };

  // /**
  //  * Handle file drop
  //  *
  //  * @param {DragEvent<HTMLDivElement>} event - Drag event
  //  */
  // const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   setDrag(false);
  //   if (event.dataTransfer?.files) {
  //     const file = event.dataTransfer.files[0];
  //     const upFilename = file.name.toUpperCase();
  //     if (upFilename.endsWith('.JSON') || upFilename.endsWith('.GEOJSON') || upFilename.endsWith('.CSV')) {
  //       handleFile(file);
  //     } else {
  //       emitErrorFile();
  //     }
  //   }
  // };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter') {
      handleBack();
      event.preventDefault();
    }
  };

  /**
   * Creates a set of Continue / Back buttons
   *
   * @param param0 specify if button is first or last in the list
   * @returns {JSX.Element} React component
   */
  // TODO: refactor - remove the unstable nested component
  // eslint-disable-next-line react/no-unstable-nested-components
  function NavButtons({ isFirst = false, isLast = false, handleNext }: ButtonPropsLayerPanel): JSX.Element {
    return isLoading ? (
      <Box sx={{ padding: 10 }}>
        <CircularProgressBase />
      </Box>
    ) : (
      <ButtonGroup sx={sxClasses.buttonGroup}>
        <Button
          variant="contained"
          className="buttonOutlineFilled"
          size="small"
          type="text"
          disabled={!stepButtonEnabled}
          onClick={handleNext}
        >
          {isLast ? t('layers.finish') : t('layers.continue')}
        </Button>
        {!isFirst && (
          <Button
            variant="contained"
            className="buttonOutlineFilled"
            size="small"
            type="text"
            onClick={handleBack}
            onKeyDown={(e) => handleKeyDown(e)}
          >
            {t('layers.back')}
          </Button>
        )}
      </ButtonGroup>
    );
  }

  /**
   * Code for file addition and drag and drop:
      onDrop={(e) => handleDrop(e)}
      onDragOver={(e) => handleDragOver(e)}
      onDragEnter={(e) => handleDragEnter(e)}
      onDragLeave={(e) => handleDragLeave(e)}
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
          <h3>
            <br />
            <br />
            {t('layers.dropzone')}
          </h3>
        </Box>
      )}
      <Box>
        <input type="file" id="fileUpload" style={{ display: 'none' }} onChange={handleChange} accept=".json, .geojson, .csv" />
      </Box>
      <Button
        fullWidth
        variant="outlined"
        size="small"
        sx={{ width: '100%' }}
        type="text"
        onClick={() => document.getElementById('fileUpload')?.click()}
        className="buttonOutlineFilled"
        ref={uploadBtnRef}
      >
        <FileUploadIcon />
        <Box component="span">{t('layers.upload')}</Box>
      </Button>
      <p style={{ textAlign: 'center' }}>
        <small>{t('layers.drop')}</small>
      </p>
   */

  return (
    <Paper sx={{ padding: '20px', gap: '8' }}>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        steps={[
          {
            stepLabel: {
              children: disabledLayerTypes.includes(GEOCORE) ? t('layers.stepOneNoGeocore') : t('layers.stepOne'),
            },
            stepContent: {
              children: (
                <Box className="dropzone" style={{ position: 'relative' }}>
                  <TextField
                    sx={{ width: '100%' }}
                    label={disabledLayerTypes.includes(GEOCORE) ? t('layers.urlNoGeocore') : t('layers.url')}
                    variant="standard"
                    value={displayURL}
                    onChange={handleInput}
                    multiline
                  />
                  <br />
                  <NavButtons isFirst handleNext={handleStep1} />
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
                  <Select
                    fullWidth
                    labelId="service-type-label"
                    value={layerType}
                    onChange={handleSelectType}
                    label={t('layers.service')}
                    variant="standard"
                    inputLabel={{
                      id: 'service-type-label',
                    }}
                    ref={serviceTypeRef}
                    menuItems={layerOptions
                      .filter(([value]) => {
                        return !disabledLayerTypes.includes(value as TypeGeoviewLayerTypeWithGeoCore);
                      })
                      .map(([value, label]) => ({
                        key: value,
                        item: {
                          value,
                          children: label,
                        },
                      }))}
                  />
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
                  {(layerList.length === 0 || (layerList.length === 1 && !layerList[0].isLayerGroup)) && (
                    <TextField
                      label={t('layers.name')}
                      variant="standard"
                      value={layerName}
                      onChange={handleNameLayer}
                      ref={isMultipleTextFieldRef}
                    />
                  )}
                  {(layerList.length > 1 || (layerList[0]?.entryType && layerList[0].entryType === 'group')) && (
                    <AddLayerTree layersData={layerList} onSelectedItemsChange={setLayerIdsToAdd} />
                  )}
                  <br />
                  <NavButtons isLast={!isMultiple()} handleNext={isMultiple() ? handleStep3 : handleStepLast} />
                </>
              ),
            },
          },
          isMultiple()
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

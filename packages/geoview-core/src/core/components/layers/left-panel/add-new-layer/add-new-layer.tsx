import React, { ChangeEvent, useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectChangeEvent, useTheme } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  ButtonPropsLayerPanel,
  CheckBoxIcon,
  CheckBoxOutlineBlankIcon,
  Checkbox,
  CircularProgressBase,
  FileUploadIcon,
  Paper,
  Select,
  Stepper,
  TextField,
} from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { createLocalizedString } from '@/core/utils/utilities';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import {
  CONST_LAYER_TYPES,
  TypeGeoviewLayerTypeWithGeoCore,
  AbstractGeoViewLayer,
  TypeGeoviewLayerType,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { EntryConfigBaseClass, GroupLayerEntryConfig } from '@/api/config/types/map-schema-types';
import { render } from 'react-dom';

export function AddNewLayer(): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/add-new-layer/add-new-layer');

  const { t } = useTranslation<string>();
  const theme = useTheme();

  const { CSV, ESRI_DYNAMIC, ESRI_FEATURE, ESRI_IMAGE, GEOJSON, GEOPACKAGE, WMS, WFS, OGC_FEATURE, XYZ_TILES } = CONST_LAYER_TYPES;
  const { GEOCORE } = CONST_LAYER_ENTRY_TYPES;

  const [activeStep, setActiveStep] = useState(0);
  const [layerURL, setLayerURL] = useState('');
  const [displayURL, setDisplayURL] = useState('');
  const [layerType, setLayerType] = useState<TypeGeoviewLayerTypeWithGeoCore | ''>('');
  const [layerList, setLayerList] = useState<GroupLayerEntryConfig[]>([]);

  const [layerName, setLayerName] = useState('');
  const [layerEntries, setLayerEntries] = useState<TypeLayerEntryConfig[] | TypeGeoviewLayerConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);
  const [hasMetadata, setHasMetadata] = useState<boolean>(false);
  const [stepButtonDisable, setStepButtonDisable] = useState<boolean>(true);

  const dragPopover = useRef(null);
  const uploadBtnRef = useRef<HTMLButtonElement>(null);
  const serviceTypeRef = useRef<HTMLDivElement>(null);
  const isMultipleRef = useRef<HTMLDivElement>(null);
  const isMultipleTextFieldRef = useRef<HTMLDivElement>(null);

  // get values from store
  const mapId = useGeoViewMapId();
  const { setDisplayState } = useLayerStoreActions();

  const isMultiple = (): boolean =>
    hasMetadata && (layerType === ESRI_DYNAMIC || layerType === WFS || layerType === WMS || layerType === GEOJSON);

  /**
   * List of layer types and labels
   */
  const layerOptions = [
    [CSV, 'CSV'],
    [ESRI_DYNAMIC, 'ESRI Dynamic Service'],
    [ESRI_FEATURE, 'ESRI Feature Service'],
    [ESRI_IMAGE, 'ESRI Image Service'],
    [GEOJSON, 'GeoJSON'],
    [GEOPACKAGE, 'GeoPackage'],
    [WMS, 'OGC Web Map Service (WMS)'],
    [WFS, 'OGC Web Feature Service (WFS)'],
    [OGC_FEATURE, 'OGC API Features'],
    [XYZ_TILES, 'XYZ Raster Tiles'],
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
    api.maps[mapId].notifications.showError(`${textField} ${t('layers.errorEmpty')}`, [], false);
  };

  /**
   * Emits an error dialogue when a text field is empty
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorNone = (): void => {
    setIsLoading(false);
    api.maps[mapId].notifications.showError('layers.errorNone', [], false);
  };

  /**
   * Emits an error dialogue when unsupported files are uploaded
   *
   * @param textField label for the TextField input that cannot be empty
   */
  const emitErrorFile = (): void => {
    api.maps[mapId].notifications.showError('layers.errorFile', [], false);
  };

  /**
   * Emits an error when the URL does not support the selected service type
   *
   * @param serviceName type of service provided by the URL
   */
  const emitErrorServer = (serviceName: string): void => {
    setIsLoading(false);
    api.maps[mapId].notifications.showError(`${serviceName} ${t('layers.errorServer')}`, [], false);
  };

  /**
   * Attempt to determine the layer type based on the URL format
   */
  const bestGuessLayerType = (): void => {
    const layerTokens = displayURL.toUpperCase().split('/');
    const layerId = parseInt(layerTokens[layerTokens.length - 1], 10);
    if (displayURL.toUpperCase().endsWith('MAPSERVER') || displayURL.toUpperCase().endsWith('MAPSERVER/')) {
      setLayerType(ESRI_DYNAMIC);
    } else if (
      displayURL.toUpperCase().indexOf('FEATURESERVER') !== -1 ||
      (displayURL.toUpperCase().indexOf('MAPSERVER') !== -1 && !Number.isNaN(layerId))
    ) {
      setLayerType(ESRI_FEATURE);
    } else if (displayURL.toUpperCase().indexOf('IMAGESERVER') !== -1) {
      setLayerType(ESRI_IMAGE);
    } else if (layerTokens.indexOf('WFS') !== -1) {
      setLayerType(WFS);
    } else if (displayURL.toUpperCase().endsWith('.JSON') || displayURL.toUpperCase().endsWith('.GEOJSON')) {
      setLayerType(GEOJSON);
    } else if (displayURL.toUpperCase().endsWith('.GPKG')) {
      setLayerType(GEOPACKAGE);
    } else if (displayURL.toUpperCase().indexOf('{Z}/{X}/{Y}') !== -1 || displayURL.toUpperCase().indexOf('{Z}/{Y}/{X}') !== -1) {
      setLayerType(XYZ_TILES);
    } else if (displayURL.indexOf('/') === -1 && displayURL.replaceAll('-', '').length === 32) {
      setLayerType(GEOCORE);
    } else if (displayURL.toUpperCase().indexOf('WMS') !== -1) {
      setLayerType(WMS);
    } else if (displayURL.toUpperCase().endsWith('.CSV')) {
      setLayerType(CSV);
    } else {
      setLayerType('');
      setStepButtonDisable(true);
    }
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
    if (valid) {
      bestGuessLayerType();
      setActiveStep(1);
    }
  };

  /**
   * Handle the behavior of the 'Continue' button in the Stepper UI
   */
  const handleStep2 = (): void => {
    setIsLoading(true);

    const populateLayerList = async (curlayerType: TypeGeoviewLayerType) => {
      try {
        const layersTree = await api.configApi.createMetadataLayerTree(layerURL, curlayerType, [], 'en');
        setLayerList(layersTree as GroupLayerEntryConfig[]);
        setHasMetadata(true);
        console.log('layersTree 1111 ********* ', layersTree);
        return true;
      } catch (err) {
        emitErrorServer(curlayerType);
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
      layerType === GEOPACKAGE ||
      layerType === CSV
    ) {
      promise = populateLayerList(layerType);
      // wmsValidation();
      // wfsValidation();
    }
    // else if (layerType === WFS) promise = wfsValidation();
    // else if (layerType === OGC_FEATURE) promise = ogcFeatureValidation();
    // else if (layerType === XYZ_TILES) promise = xyzValidation();
    // else if (layerType === ESRI_DYNAMIC) promise = esriValidation(ESRI_DYNAMIC);
    // else if (layerType === ESRI_FEATURE) promise = esriValidation(ESRI_FEATURE);
    // else if (layerType === ESRI_IMAGE) promise = esriImageValidation();
    // else if (layerType === GEOJSON) promise = geoJSONValidation();
    // else if (layerType === GEOPACKAGE) promise = Promise.resolve(geoPackageValidation());
    else if (layerType === GEOCORE) {
      // promise = geocoreValidation();
      // else if (layerType === CSV) promise = csvValidation();
    }
    // If we have a promise of a layer validation
    if (promise) {
      promise
        .then((isValid) => {
          if (isValid) {
            setIsLoading(false);
            setActiveStep(2);

            // disable continue button until a layer entry is selected
            setStepButtonDisable(true);
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
    if (layerEntries.length === 0) {
      valid = false;
      emitErrorEmpty(t('layers.layer'));
    }
    if (valid) setActiveStep(3);
  };

  const doneAdding = (): void => {
    // Done adding
    setIsLoading(false);
    setDisplayState('view');
    MapEventProcessor.setLayerZIndices(mapId);
  };

  const doneAddedShowMessage = (layerBeingAdded: AbstractGeoViewLayer): void => {
    if (layerBeingAdded.allLayerStatusAreGreaterThanOrEqualTo('error'))
      api.maps[mapId].notifications.showError('layers.layerAddedWithError', [layerName]);
    else if (layerBeingAdded?.allLayerStatusAreGreaterThanOrEqualTo('loaded'))
      api.maps[mapId].notifications.showMessage('layers.layerAdded', [layerName]);
    else api.maps[mapId].notifications.showMessage('layers.layerAddedAndLoading', [layerName]);
  };

  /**
   * Handle the behavior of the 'Finish' button in the Stepper UI
   */
  const handleStepLast = (): void => {
    setIsLoading(true);
    // if (true) {
    // Get config
    const { geoviewLayerConfig } = layerEntries[0] as TypeLayerEntryConfig;

    // Have to massage this so the `setListOfLayerEntryConfig` inside the layer constructor works
    // TODO: Refactor - Try to find a way to simplify/clarify what's going on in the layer constructor's call to `setListOfLayerEntryConfig`.
    // TO.DOCONT: The recursion is necessary, but can the root be a derived type of the branches/leaves or something?
    // TO.DOCONT: Maybe just me, but seems a bit hard to understand what needs to be set in the `geoviewLayerConfig.listOfLayerEntryConfig`.
    // TO.DOCONT: Anyways, this works as-it-was before the refactor for now.
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries as TypeLayerEntryConfig[];

    // TODO: Bug - Fix this layer naming not working, wasn't working before the refactor either, leaving it as-is
    geoviewLayerConfig.geoviewLayerName = createLocalizedString(layerName);
    if (layerType === XYZ_TILES) (layerEntries[0] as TypeLayerEntryConfig).layerName = createLocalizedString(layerName);
    if (geoviewLayerConfig.listOfLayerEntryConfig.length === 1)
      geoviewLayerConfig.listOfLayerEntryConfig[0].layerName = geoviewLayerConfig.geoviewLayerName;

    // Add the layer using the proper function
    const addedLayer = api.maps[mapId].layer.addGeoviewLayer(geoviewLayerConfig);
    if (addedLayer) {
      // Wait on the promise
      addedLayer.promiseLayer
        .then(() => {
          // Done adding
          doneAdding();
          doneAddedShowMessage(addedLayer.layer);
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('addedLayer.promiseLayer in handleStepLast in AddNewLayer', error);
        });
    } else {
      // Failed to add, remove spinning, but stay on the add ui
      setIsLoading(false);
    }
    // }
  };

  /**
   * Handle the behavior of the 'Back' button in the Stepper UI
   */
  const handleBack = (): void => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);

    // We assume previous step ok, so enable continue button
    setStepButtonDisable(false);
  };

  /**
   * Set layer URL from file input
   *
   * @param {File} file - Uploaded file
   */
  const handleFile = (file: File): void => {
    const fileURL = URL.createObjectURL(file);
    setDisplayURL(file.name);
    setLayerURL(fileURL);
    const fileName = file.name.split('.')[0];
    setLayerType('');
    setLayerList([]);
    setLayerName(fileName);
    setLayerEntries([]);
  };

  /**
   * Set layer URL from form input
   *
   * @param {ChangeEvent<HTMLInputElement>} event - TextField event
   */
  const handleInput = (event: ChangeEvent<HTMLInputElement>): void => {
    setDisplayURL(event.target.value.trim());
    setLayerURL(event.target.value.trim());
    setLayerType('');
    setLayerList([]);
    setLayerName('');
    setLayerEntries([]);

    // TODO: create a utilities function to test valid URL before we enable the continue button
    // TODO.CONT: This function should try to ping the server for an answer...
    // Check if url or geocore is provided
    setStepButtonDisable(!(event.target.value.trim().startsWith('https://') || event.target.value.trim().length !== 35));
  };

  /**
   * Set layerType from form input
   *
   * @param {SelectChangeEvent<unknown>} event - TextField event
   */
  const handleSelectType = (event: SelectChangeEvent<unknown>): void => {
    setLayerType(event.target.value as TypeGeoviewLayerTypeWithGeoCore);
    setLayerList([]);
    setLayerEntries([]);

    setStepButtonDisable(false);
  };

  /**
   * Set the currently selected layer from a list
   *
   * @param {Event} event - Select event
   * @param {TypeLayerEntryConfig[] | TypeLayerEntryConfig} newValue - The new layer entry config value
   *
   * @param newValue value/label pairs of select options
   */
  const handleSelectLayer = (event: Event, newValue: TypeLayerEntryConfig[] | TypeLayerEntryConfig): void => {
    setStepButtonDisable(true);

    if (isMultiple()) {
      if (!((newValue as TypeLayerEntryConfig[]).length === 0)) {
        setLayerEntries(newValue as TypeLayerEntryConfig[]);
        setLayerName((newValue as TypeLayerEntryConfig[]).map((layerConfig) => layerConfig.layerName!.en).join(', '));

        setStepButtonDisable(false);
      }
    } else {
      setLayerEntries([newValue as TypeLayerEntryConfig]);
      setLayerName((newValue as TypeLayerEntryConfig).layerName!.en!);

      setStepButtonDisable(false);
    }
  };

  /**
   * Set the layer name from form input
   *
   * @param {ChangeEvent<HTMLInputElement>} event - TextField event
   */
  const handleNameLayer = (event: ChangeEvent<HTMLInputElement>): void => {
    setStepButtonDisable(false);
    setLayerName(event.target.value);
  };

  // To set the button enable when validation set the layerName
  useEffect(() => {
    if (activeStep === 2 && layerEntries.length > 0) setStepButtonDisable(false);
  }, [layerName, activeStep, layerEntries]);

  useEffect(() => {
    if (activeStep === 0) {
      uploadBtnRef.current?.focus();
    }
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
  /**
   * Handle file dragged into dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== dragPopover.current) {
      setDrag(true);
    }
  };

  /**
   * Handle file dragged out of dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === dragPopover.current) setDrag(false);
  };

  /**
   * Prevent default behaviour when file dragged over dropzone
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle file drop
   *
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setDrag(false);
    if (event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      const upFilename = file.name.toUpperCase();
      if (upFilename.endsWith('.JSON') || upFilename.endsWith('.GEOJSON') || upFilename.endsWith('.GPKG') || upFilename.endsWith('.CSV')) {
        handleFile(file);
      } else {
        emitErrorFile();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === 'Enter') {
      handleBack();
      e.preventDefault();
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
          disabled={stepButtonDisable}
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

  const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize={theme.palette.geoViewFontSize.sm} />;
  const checkedIcon = <CheckBoxIcon fontSize={theme.palette.geoViewFontSize.sm} />;

  function renderListItem(layer: GroupLayerEntryConfig, selected?: boolean): JSX.Element {
    return (
      <TreeItem itemId={layer.layerId} label={layer.layerName}>
        {layer?.listOfLayerEntryConfig?.length > 0 && (
            layer.listOfLayerEntryConfig.map((subLayer: EntryConfigBaseClass) => renderListItem(subLayer as GroupLayerEntryConfig))
        )}
      </TreeItem>
    );
  }

  return (
    <Paper sx={{ padding: '20px', gap: '8' }}>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        steps={[
          {
            stepLabel: {
              children: t('layers.stepOne'),
            },
            stepContent: {
              children: (
                <Box
                  className="dropzone"
                  style={{ position: 'relative' }}
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
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) handleFile(e.target.files[0]);
                      }}
                      accept=".gpkg, .json, .geojson, .csv"
                    />
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
                  <p style={{ textAlign: 'center' }}>{t('layers.or')}</p>
                  <TextField
                    sx={{ width: '100%' }}
                    label={t('layers.url')}
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
                    menuItems={layerOptions.map(([value, label]) => ({
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
                  {layerList.length === 0 && (
                    <TextField
                      label={t('layers.name')}
                      variant="standard"
                      value={layerName}
                      onChange={handleNameLayer}
                      ref={isMultipleTextFieldRef}
                    />
                  )}
                  {layerList.length > 0 && (
                    <SimpleTreeView sx={{fontSize: '0.8rem', '& .MuiTreeItem-label': { fontSize: '0.8rem !important'}}} multiSelect checkboxSelection>
                      {layerList[0].listOfLayerEntryConfig.map((layer) => renderListItem(layer as GroupLayerEntryConfig))}
                    </SimpleTreeView>
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
                        ref={isMultipleTextFieldRef}
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

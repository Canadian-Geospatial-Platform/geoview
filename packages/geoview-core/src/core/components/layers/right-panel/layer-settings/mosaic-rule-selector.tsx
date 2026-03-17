import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Checkbox, Collapse, FormControl, Select, Typography } from '@/ui';
import { CollectionsIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import { useLayerStoreActions, useLayerSelectorMosaicRule } from '@/core/stores/store-interface-and-intial-values/layer-state';

import type { TypeLegendLayer } from '../../types';
import type { TypeMosaicMethod, TypeMosaicOperation } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

interface MosaicRulePanelProps {
  layerDetails: TypeLegendLayer;
}

/**
 * Inline panel section for configuring mosaic rules on ArcGIS ImageServer layers.
 *
 * Displays method, operation, and ascending controls directly within
 * the settings panel instead of a floating menu.
 *
 * An ArcGIS ImageServer mosaicRule defines how multiple raster datasets within a mosaic dataset
 * are ordered, mosaicked, and displayed on-the-fly when viewed or queried.
 * It specifies which rasters are included (e.g., by ID or attribute), their sorting order,
 * and how overlapping pixels are resolved (e.g., via blending, maximum, or minimum values).
 *
 * @see {@link https://developers.arcgis.com/javascript/latest/references/core/layers/support/MosaicRule}
 * @param layerDetails - The legend layer to configure mosaic rules for.
 * @returns A JSX element representing the MosaicRulePanel component.
 */
export function MosaicRulePanel({ layerDetails }: MosaicRulePanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/mosaic-rule-selector > MosaicRulePanel');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation();

  // Store actions
  const { getLayerAllowedMosaicMethods, setLayerMosaicRuleAscending, setLayerMosaicRuleMethod, setLayerMosaicRuleOperation } =
    useLayerStoreActions();

  // Store hooks
  const mosaicRule = useLayerSelectorMosaicRule(layerDetails.layerPath);

  // State
  const [expanded, setExpanded] = useState(false);

  // Current values
  const currentMethod = mosaicRule?.mosaicMethod ?? 'esriMosaicNone';
  const currentOperation = mosaicRule?.mosaicOperation ?? 'MT_FIRST';
  const currentAscending = mosaicRule?.ascending ?? true;

  // Maps for translating method/operation keys to display labels
  const METHOD_LABEL_KEYS: Record<string, string> = useMemo(
    () => ({
      esriMosaicNone: 'layers.settings.mosaicMethodNone',
      esriMosaicCenter: 'layers.settings.mosaicMethodCenter',
      esriMosaicNadir: 'layers.settings.mosaicMethodNadir',
      esriMosaicViewpoint: 'layers.settings.mosaicMethodViewpoint',
      esriMosaicAttribute: 'layers.settings.mosaicMethodAttribute',
      esriMosaicLockRaster: 'layers.settings.mosaicMethodLockRaster',
      esriMosaicNorthwest: 'layers.settings.mosaicMethodNorthwest',
      esriMosaicSeamline: 'layers.settings.mosaicMethodSeamline',
    }),
    []
  );

  const OPERATION_LABEL_KEYS: Record<string, string> = useMemo(
    () => ({
      MT_FIRST: 'layers.settings.mosaicOperationFirst',
      MT_LAST: 'layers.settings.mosaicOperationLast',
      MT_MIN: 'layers.settings.mosaicOperationMin',
      MT_MAX: 'layers.settings.mosaicOperationMax',
      MT_MEAN: 'layers.settings.mosaicOperationMean',
      MT_BLEND: 'layers.settings.mosaicOperationBlend',
      MT_SUM: 'layers.settings.mosaicOperationSum',
    }),
    []
  );

  // Build a summary showing the current selections
  const selectionSummary = useMemo(() => {
    const methodLabel = t(METHOD_LABEL_KEYS[currentMethod] ?? currentMethod);
    const operationLabel = t(OPERATION_LABEL_KEYS[currentOperation] ?? currentOperation);
    return `${methodLabel} · ${operationLabel}`;
  }, [currentMethod, currentOperation, t, METHOD_LABEL_KEYS, OPERATION_LABEL_KEYS]);

  // Handlers with stable references
  const handleChangeMethod = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
      setLayerMosaicRuleMethod(layerDetails.layerPath, event.target.value as TypeMosaicMethod);
    },
    [layerDetails.layerPath, setLayerMosaicRuleMethod]
  );

  const handleChangeOperation = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
      setLayerMosaicRuleOperation(layerDetails.layerPath, event.target.value as TypeMosaicOperation);
    },
    [layerDetails.layerPath, setLayerMosaicRuleOperation]
  );

  const handleChangeAscending = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setLayerMosaicRuleAscending(layerDetails.layerPath, event.target.checked);
    },
    [layerDetails.layerPath, setLayerMosaicRuleAscending]
  );

  // Menu items with translations
  const methodMenuItems = useMemo(
    () =>
      [
        { key: 'esriMosaicNone', item: { value: 'esriMosaicNone', name: 'None', children: t('layers.settings.mosaicMethodNone') } },
        { key: 'esriMosaicCenter', item: { value: 'esriMosaicCenter', name: 'Center', children: t('layers.settings.mosaicMethodCenter') } },
        { key: 'esriMosaicNadir', item: { value: 'esriMosaicNadir', name: 'Nadir', children: t('layers.settings.mosaicMethodNadir') } },
        {
          key: 'esriMosaicViewpoint',
          item: { value: 'esriMosaicViewpoint', name: 'Viewpoint', children: t('layers.settings.mosaicMethodViewpoint') },
        },
        {
          key: 'esriMosaicAttribute',
          item: { value: 'esriMosaicAttribute', name: 'ByAttribute', children: t('layers.settings.mosaicMethodAttribute') },
        },
        {
          key: 'esriMosaicLockRaster',
          item: { value: 'esriMosaicLockRaster', name: 'LockRaster', children: t('layers.settings.mosaicMethodLockRaster') },
        },
        {
          key: 'esriMosaicNorthwest',
          item: { value: 'esriMosaicNorthwest', name: 'NorthWest', children: t('layers.settings.mosaicMethodNorthwest') },
        },
        {
          key: 'esriMosaicSeamline',
          item: { value: 'esriMosaicSeamline', name: 'Seamline', children: t('layers.settings.mosaicMethodSeamline') },
        },
      ].filter((option) => {
        const allowedMethods = getLayerAllowedMosaicMethods(layerDetails.layerPath);
        return !allowedMethods || allowedMethods.includes(option.item.name as TypeMosaicMethod);
      }),
    [t, layerDetails.layerPath, getLayerAllowedMosaicMethods]
  );

  const operationMenuItems = useMemo(
    () => [
      { key: 'MT_FIRST', item: { value: 'MT_FIRST', children: t('layers.settings.mosaicOperationFirst') } },
      { key: 'MT_LAST', item: { value: 'MT_LAST', children: t('layers.settings.mosaicOperationLast') } },
      { key: 'MT_MIN', item: { value: 'MT_MIN', children: t('layers.settings.mosaicOperationMin') } },
      { key: 'MT_MAX', item: { value: 'MT_MAX', children: t('layers.settings.mosaicOperationMax') } },
      { key: 'MT_MEAN', item: { value: 'MT_MEAN', children: t('layers.settings.mosaicOperationMean') } },
      { key: 'MT_BLEND', item: { value: 'MT_BLEND', children: t('layers.settings.mosaicOperationBlend') } },
      { key: 'MT_SUM', item: { value: 'MT_SUM', children: t('layers.settings.mosaicOperationSum') } },
    ],
    [t]
  );

  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  const handleToggleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <Box sx={sxClasses.settingsSection}>
      <Box sx={sxClasses.settingsSectionHeader} onClick={handleToggle} onKeyDown={handleToggleKeyDown} role="button" tabIndex={0}>
        <CollectionsIcon fontSize="small" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={sxClasses.settingsSectionTitle}>{t('layers.settings.updateMosaicRule')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: theme.palette.geoViewFontSize.sm }} noWrap>
            {selectionSummary}
          </Typography>
        </Box>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={expanded} sx={{ marginTop: expanded ? '12px' : 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormControl fullWidth>
            <Select
              value={currentMethod}
              onChange={handleChangeMethod}
              label={t('layers.settings.mosaicMethod')}
              menuItems={methodMenuItems}
              inputLabel={{ id: 'mosaic-method-label' }}
            />
          </FormControl>
          <FormControl fullWidth>
            <Select
              value={currentOperation}
              onChange={handleChangeOperation}
              label={t('layers.settings.mosaicOperation')}
              menuItems={operationMenuItems}
              inputLabel={{ id: 'mosaic-operation-label' }}
            />
          </FormControl>
          <Box display="flex" alignItems="center">
            <Checkbox checked={currentAscending} onChange={handleChangeAscending} />
            <Box component="span" ml={1}>
              {t('layers.settings.ascending')}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

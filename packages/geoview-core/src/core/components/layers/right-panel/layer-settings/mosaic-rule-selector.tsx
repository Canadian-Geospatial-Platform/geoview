import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Checkbox, Collapse, FormControl, Select, Typography } from '@/ui';
import { CollectionsIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import { useStoreLayerMosaicRule, useStoreLayerAllowedMosaicMethods } from '@/core/stores/store-interface-and-intial-values/layer-state';

import type { TypeMosaicMethod, TypeMosaicOperation } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/layer-controller';

// Maps mosaic method keys to their filter name and translation key
const METHOD_ENTRIES: Record<string, { name: string; labelKey: string }> = {
  esriMosaicNone: { name: 'None', labelKey: 'layers.settings.mosaicMethodNone' },
  esriMosaicCenter: { name: 'Center', labelKey: 'layers.settings.mosaicMethodCenter' },
  esriMosaicNadir: { name: 'Nadir', labelKey: 'layers.settings.mosaicMethodNadir' },
  esriMosaicViewpoint: { name: 'Viewpoint', labelKey: 'layers.settings.mosaicMethodViewpoint' },
  esriMosaicAttribute: { name: 'ByAttribute', labelKey: 'layers.settings.mosaicMethodAttribute' },
  esriMosaicLockRaster: { name: 'LockRaster', labelKey: 'layers.settings.mosaicMethodLockRaster' },
  esriMosaicNorthwest: { name: 'NorthWest', labelKey: 'layers.settings.mosaicMethodNorthwest' },
  esriMosaicSeamline: { name: 'Seamline', labelKey: 'layers.settings.mosaicMethodSeamline' },
};

// Maps mosaic operation keys to their translation key
const OPERATION_ENTRIES: Record<string, string> = {
  MT_FIRST: 'layers.settings.mosaicOperationFirst',
  MT_LAST: 'layers.settings.mosaicOperationLast',
  MT_MIN: 'layers.settings.mosaicOperationMin',
  MT_MAX: 'layers.settings.mosaicOperationMax',
  MT_MEAN: 'layers.settings.mosaicOperationMean',
  MT_BLEND: 'layers.settings.mosaicOperationBlend',
  MT_SUM: 'layers.settings.mosaicOperationSum',
};

interface MosaicRulePanelProps {
  /** The layer path to configure mosaic rules for. */
  layerPath: string;
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
 * @param layerPath - The layer path to configure mosaic rules for.
 * @returns A JSX element representing the MosaicRulePanel component.
 */
export function MosaicRulePanel({ layerPath }: MosaicRulePanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/mosaic-rule-selector > MosaicRulePanel');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation();

  // Store hooks
  const mosaicRule = useStoreLayerMosaicRule(layerPath);
  const allowedMosaicMethods = useStoreLayerAllowedMosaicMethods(layerPath);
  const layerController = useLayerController();

  // State
  const [expanded, setExpanded] = useState(false);

  // Current values
  const currentMethod = mosaicRule?.mosaicMethod ?? 'esriMosaicNone';
  const currentOperation = mosaicRule?.mosaicOperation ?? 'MT_FIRST';
  const currentAscending = mosaicRule?.ascending ?? true;

  // Build a summary showing the current selections
  const memoSelectionSummary = useMemo(() => {
    const methodLabel = t(METHOD_ENTRIES[currentMethod]?.labelKey ?? currentMethod);
    const operationLabel = t(OPERATION_ENTRIES[currentOperation] ?? currentOperation);
    return `${methodLabel} · ${operationLabel}`;
  }, [currentMethod, currentOperation, t]);

  // Handlers with stable references
  const handleChangeMethod = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
      layerController.setLayerMosaicRuleMethod(layerPath, event.target.value as TypeMosaicMethod);
    },
    [layerPath, layerController]
  );

  const handleChangeOperation = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
      layerController.setLayerMosaicRuleOperation(layerPath, event.target.value as TypeMosaicOperation);
    },
    [layerPath, layerController]
  );

  const handleChangeAscending = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      layerController.setLayerMosaicRuleAscending(layerPath, event.target.checked);
    },
    [layerPath, layerController]
  );

  // Menu items derived from the module-level entry maps
  const memoMethodMenuItems = useMemo(
    () =>
      Object.entries(METHOD_ENTRIES)
        .map(([key, { name, labelKey }]) => ({ key, item: { value: key, name, children: t(labelKey) } }))
        .filter((option) => {
          return !allowedMosaicMethods || allowedMosaicMethods.includes(option.item.name as TypeMosaicMethod);
        }),
    [t, allowedMosaicMethods]
  );

  const memoOperationMenuItems = useMemo(
    () => Object.entries(OPERATION_ENTRIES).map(([key, labelKey]) => ({ key, item: { value: key, children: t(labelKey) } })),
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
            {memoSelectionSummary}
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
              menuItems={memoMethodMenuItems}
              inputLabel={{ id: 'mosaic-method-label' }}
            />
          </FormControl>
          <FormControl fullWidth>
            <Select
              value={currentOperation}
              onChange={handleChangeOperation}
              label={t('layers.settings.mosaicOperation')}
              menuItems={memoOperationMenuItems}
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

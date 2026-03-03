import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Checkbox, Menu, MenuItem, FormControl, Select } from '@/ui';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './layer-settings-style';
import { useLayerStoreActions, useLayerSelectorMosaicRule } from '@/core/stores/store-interface-and-intial-values/layer-state';

import type { TypeLegendLayer } from '../../types';
import type { TypeMosaicMethod, TypeMosaicOperation } from '@/api/types/layer-schema-types';

interface MosaicRuleSelectorProps {
  layerDetails: TypeLegendLayer;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onClickOutside: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
}

/**
 * An ArcGIS ImageServer mosaicRule defines how multiple raster datasets within a mosaic dataset
 * are ordered, mosaicked, and displayed on-the-fly when viewed or queried.
 * It specifies which rasters are included (e.g., by ID or attribute), their sorting order,
 * and how overlapping pixels are resolved (e.g., via blending, maximum, or minimum values)
 * @link https://developers.arcgis.com/javascript/latest/references/core/layers/support/MosaicRule
 * @param props - The properties for the MosaicRuleSelector component.
 * @returns A JSX element representing the MosaicRuleSelector component.
 */
export function MosaicRuleSelector(props: MosaicRuleSelectorProps): JSX.Element {
  const { layerDetails, anchorEl, onClose, onClickOutside } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation();

  // Store actions
  const { getLayerAllowedMosaicMethods, setLayerMosaicRuleAscending, setLayerMosaicRuleMethod, setLayerMosaicRuleOperation } =
    useLayerStoreActions();

  // Store hooks
  const mosaicRule = useLayerSelectorMosaicRule(layerDetails.layerPath);

  // Current values
  const currentMethod = mosaicRule?.mosaicMethod ?? 'esriMosaicNone';
  const currentOperation = mosaicRule?.mosaicOperation ?? 'MT_FIRST';
  const currentAscending = mosaicRule?.ascending ?? true;

  // Handlers - use useCallback for stable references
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

  const handleClose = useCallback(
    (event: {}, reason: 'backdropClick' | 'escapeKeyDown'): void => {
      if (reason === 'backdropClick' && onClickOutside) {
        onClickOutside(event, reason);
      } else if (reason === 'escapeKeyDown') {
        onClose();
      }
    },
    [onClose, onClickOutside]
  );

  // Menu items with translations - memoized to prevent recreation on every render
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

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      disableScrollLock
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={sxClasses.rasterFunctionMenu}
      slotProps={{
        list: {
          autoFocus: true,
          autoFocusItem: true,
        },
      }}
    >
      <MenuItem>
        <FormControl fullWidth>
          <Select
            value={currentMethod}
            onChange={handleChangeMethod}
            label={t('layers.settings.mosaicMethod')}
            menuItems={methodMenuItems}
            inputLabel={{ id: 'mosaic-method-label' }}
          />
        </FormControl>
      </MenuItem>
      <MenuItem>
        <FormControl fullWidth>
          <Select
            value={currentOperation}
            onChange={handleChangeOperation}
            label={t('layers.settings.mosaicOperation')}
            menuItems={operationMenuItems}
            inputLabel={{
              id: 'mosaic-operation-label',
            }}
          />
        </FormControl>
      </MenuItem>
      <MenuItem>
        <Box display="flex" alignItems="center" width="100%">
          <Checkbox checked={currentAscending} onChange={handleChangeAscending} />
          <Box component="span" ml={1}>
            {t('layers.settings.ascending')}
          </Box>
        </Box>
      </MenuItem>
    </Menu>
  );
}

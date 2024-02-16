/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCenter } from 'ol/extent';

import { useTheme, Theme } from '@mui/material/styles';
import { List, ZoomInSearchIcon, Tooltip, IconButton, Checkbox, Paper, Box, Typography } from '@/ui';
import { TypeFieldEntry, TypeArrayOfFeatureInfoEntries, TypeGeometry } from '@/api/events/payloads';
import { useDetailsStoreCheckedFeatures, useDetailsStoreActions } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { delay } from '@/core/utils/utilities';

import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';

export interface TypeFeatureInfoProps {
  features: TypeArrayOfFeatureInfoEntries;
  currentFeatureIndex: number;
}

/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info properties
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo({ features, currentFeatureIndex }: TypeFeatureInfoProps): JSX.Element {
  // Log
  logger.logTraceRender('components/details/feature-info-new');

  const { t } = useTranslation<string>();

  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [checked, setChecked] = useState<boolean>(false);
  const feature = features![currentFeatureIndex];
  const featureUid = feature?.geometry ? (feature.geometry as TypeGeometry).ol_uid : null;
  const featureIconSrc = feature?.featureIcon.toDataURL();
  const nameFieldValue = feature?.nameField ? (feature?.fieldInfo?.[feature.nameField]?.value as string) || '' : 'No name';

  // states from store
  const checkedFeatures = useDetailsStoreCheckedFeatures();
  const { addCheckedFeature, removeCheckedFeature } = useDetailsStoreActions();
  const { zoomToExtent, transformPoints, showClickMarker } = useMapStoreActions();

  const featureInfoList: TypeFieldEntry[] = Object.keys(feature?.fieldInfo ?? {}).map((fieldName) => {
    return {
      fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
      value: feature.fieldInfo[fieldName]!.value,
      dataType: feature.fieldInfo[fieldName]!.dataType,
      alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      domain: null,
    };
  });

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (!checked) {
      addCheckedFeature(feature);
    } else {
      removeCheckedFeature(feature);
    }
  };

  const handleZoomIn = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();

    // Project
    const center = getCenter(feature.extent);
    const newCenter = transformPoints([center], 4326)[0];

    // Zoom to extent and wait for it to finish
    await zoomToExtent(feature.extent);

    // Typically, the click marker is removed after a zoom, so wait a bit here and re-add it...
    // TODO: Refactor - Zoom ClickMarker - Improve the logic in general of when/if a click marker should be removed after a zoom
    await delay(150);

    // Add (back?) a click marker
    showClickMarker({ lnglat: newCenter });
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FEATURE-INFO-NEW - checkedFeatures', checkedFeatures, feature);

    setChecked(
      checkedFeatures.some((checkedFeature) => {
        return (checkedFeature.geometry as TypeGeometry)?.ol_uid === featureUid;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedFeatures, feature]); // ! Check if feature is necessary in this dependency array? If so explain it in comment? Should be featurUid?

  return (
    <Paper sx={{ boxShadow: 'none' }}>
      <Box
        sx={{
          p: '0 20px 10px 20px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {/* Left box - feature icon and feature name */}
        <Box sx={sxClasses.flexBoxAlignCenter}>
          <Box component="img" src={featureIconSrc} alt={nameFieldValue} className="layer-icon" />
          <Typography sx={{ display: 'inline-block' }} component="div">
            {nameFieldValue}
          </Typography>
        </Box>
        {/* Right box - checkbox and zoom icon */}
        <Box sx={{ ...sxClasses.flexBoxAlignCenter, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
          <Tooltip title={t('details.keepFeatureSelected')} placement="top" enterDelay={1000}>
            <Checkbox
              disabled={!feature?.geometry}
              onChange={(e) => handleSelect(e)}
              checked={checked}
              sx={sxClasses.selectFeatureCheckbox}
            />
          </Tooltip>
          <IconButton color="primary" onClick={(e) => handleZoomIn(e)}>
            <Tooltip title={t('details.zoomTo')} placement="top" enterDelay={1000}>
              <ZoomInSearchIcon />
            </Tooltip>
          </IconButton>
        </Box>
      </Box>

      <List sx={sxClasses.featureInfoListContainer}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme, Theme } from '@mui/material/styles';

import { List, ZoomInSearchIcon, Tooltip, IconButton, Checkbox, Paper, Box, Typography } from '@/ui';
import { TypeFieldEntry, TypeArrayOfFeatureInfoEntries, TypeGeometry } from '@/api/events/payloads';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';
import { useDetailsStoreCheckedFeatures, useDetailsStoreActions } from '@/core/stores/store-interface-and-intial-values/details-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

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
  const nameFieldValue = feature?.nameField ? (feature.fieldInfo[feature.nameField!]!.value as string) : 'No name';

  // states from store
  const checkedFeatures = useDetailsStoreCheckedFeatures();
  const { addCheckedFeature, removeCheckedFeature } = useDetailsStoreActions();
  const { zoomToExtent } = useMapStoreActions();

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

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    zoomToExtent(feature.extent);
  };

  useEffect(() => {
    setChecked(
      checkedFeatures.some((checkedFeature) => {
        return (checkedFeature.geometry as TypeGeometry)?.ol_uid === featureUid;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedFeatures, feature]);

  return (
    <Paper sx={{ boxShadow: 'none' }}>
      <Box
        sx={{
          [theme.breakpoints.down('md')]: { flexDirection: 'column' },
          p: '0 20px 10px 20px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {/* Left box - feature icon and feature name */}
        <Box sx={sxClasses.flexBoxAlignCenter}>
          <img
            src={featureIconSrc}
            alt={nameFieldValue}
            style={{ ...theme.iconImage, marginRight: '5px', width: '35px', height: '35px' }}
          />
          <Typography sx={{ display: 'inline-block' }} component="div">
            {nameFieldValue}
          </Typography>
        </Box>
        {/* Right box - checkbox and zoom icon */}
        <Box sx={{ ...sxClasses.flexBoxAlignCenter, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
          <Typography sx={{ display: 'inline-block', textWrap: 'nowrap' }} component="div">
            {t('details.keepFeatureSelected')}
          </Typography>
          <Checkbox onChange={(e) => handleSelect(e)} checked={checked} sx={sxClasses.selectFeatureCheckbox} />
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

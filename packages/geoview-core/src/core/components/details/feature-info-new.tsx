/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme, Theme } from '@mui/material/styles';

import { List, ListItem, ListItemText, ZoomInSearchIcon, Tooltip, IconButton, Checkbox, Paper } from '@/ui';
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
  const featureUid = feature.geometry ? (feature.geometry as TypeGeometry).ol_uid : null;
  const featureIconSrc = feature.featureIcon.toDataURL();
  const nameFieldValue = feature.nameField ? (feature.fieldInfo[feature.nameField!]!.value as string) : 'No name';

  // states from store
  const checkedFeatures = useDetailsStoreCheckedFeatures();
  const { addCheckedFeature, removeCheckedFeature } = useDetailsStoreActions();
  const { zoomToExtent } = useMapStoreActions();

  const featureInfoList: TypeFieldEntry[] = Object.keys(feature.fieldInfo).map((fieldName) => {
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
      <List>
        <ListItem
          sx={{ marginBottom: '16px' }}
          secondaryAction={
            <>
              <Tooltip title={t('details.select')} placement="top" enterDelay={1000}>
                <>
                  {t('details.keepFeatureSelected')}
                  <Checkbox onChange={(e) => handleSelect(e)} checked={checked} sx={sxClasses.selectFeatureCheckbox} />
                </>
              </Tooltip>
              <IconButton color="primary" onClick={(e) => handleZoomIn(e)}>
                <Tooltip title={t('details.zoomTo')} placement="top" enterDelay={1000}>
                  <ZoomInSearchIcon />
                </Tooltip>
              </IconButton>
            </>
          }
        >
          <img
            src={featureIconSrc}
            alt={nameFieldValue}
            style={{ ...theme.iconImage, marginRight: '10px', width: '35px', height: '35px' }}
          />
          <ListItemText sx={sxClasses.itemText} primary={nameFieldValue} />
        </ListItem>
      </List>

      <List sx={sxClasses.featureInfoListContainer}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

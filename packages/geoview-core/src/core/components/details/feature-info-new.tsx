/* eslint-disable react/require-default-props */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { getUid } from 'ol/util';
import { List, ListItem, ListItemText, ZoomInSearchIcon, Tooltip, IconButton, Checkbox, Paper } from '@/ui';
import { api } from '@/app';
import {
  featureHighlightPayload,
  clearHighlightsPayload,
  TypeFieldEntry,
  TypeArrayOfFeatureInfoEntries,
  TypeFeatureInfoEntry,
  TypeGeometry,
} from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { FeatureInfoTable } from './feature-info-table';
import { getSxClasses } from './details-style';

export interface TypeFeatureInfoProps {
  mapId: string;
  features: TypeArrayOfFeatureInfoEntries;
  currentFeatureIndex: number;
  onClearCheckboxes: () => void;
  onFeatureNavigateChange: (
    checkedFeatures: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>,
    currentFeature: TypeFeatureInfoEntry
  ) => void;
  setDisableClearAllBtn: (isDisabled: boolean) => void;
  selectedFeatures?: MutableRefObject<string[]>;
  clearAllCheckboxes?: boolean;
}

/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info propetties
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo({
  mapId,
  features,
  currentFeatureIndex,
  selectedFeatures,
  onClearCheckboxes,
  onFeatureNavigateChange,
  setDisableClearAllBtn,
  clearAllCheckboxes,
}: TypeFeatureInfoProps): JSX.Element {
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const [checked, setChecked] = useState<boolean>(false);
  const [checkedFeatures, setCheckedFeatures] = useState<Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>>([]);
  const feature = features![currentFeatureIndex];
  const featureUid = getUid(feature.geometry);
  const featureIconSrc = feature.featureIcon.toDataURL();
  const nameFieldValue = feature.fieldInfo[feature.nameField!]!.value as string;

  const sxClasses = getSxClasses(theme);

  const featureInfoList: TypeFieldEntry[] = Object.keys(feature.fieldInfo).map((fieldName) => {
    return {
      fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
      value: feature.fieldInfo[fieldName]!.value,
      dataType: feature.fieldInfo[fieldName]!.dataType,
      alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      domain: null,
    };
  });

  const isFeatureInSelectedFeatures = checkedFeatures.some((obj) => {
    return (obj.geometry as TypeGeometry)?.ol_uid === (feature.geometry as TypeGeometry)?.ol_uid;
  });

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (!checked) {
      setChecked(true);
      setCheckedFeatures((prevValue) => [...prevValue, feature]);
    } else {
      setChecked(false);
      setCheckedFeatures((prevValue) =>
        prevValue.filter((item) => (item.geometry as TypeGeometry)?.ol_uid !== (feature.geometry as TypeGeometry)?.ol_uid)
      );
    }
  };

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    api.maps[mapId].zoomToExtent(feature.extent);
  };

  useEffect(() => {
    if (checkedFeatures.length !== 0) {
      checkedFeatures.forEach((checkedFeature: TypeFeatureInfoEntry) => {
        api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, checkedFeature));
      });
    }

    // disable the clear all button once we don't have any selected features
    setDisableClearAllBtn(checkedFeatures.length === 0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedFeatures]);

  useEffect(() => {
    if (selectedFeatures?.current && selectedFeatures.current.indexOf(featureUid) !== -1) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [featureUid, selectedFeatures]);

  // Keep track of current feature change, clear all layers, then highlight current feature
  // this needs to be in condition that don't
  useEffect(() => {
    if (checkedFeatures.length === 0) {
      api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, 'all'));
    }
    api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
    onFeatureNavigateChange(checkedFeatures, feature);
    // to keep the checkbox checked if current feature is one of selected features
    setChecked(isFeatureInSelectedFeatures);
    // if we haven't checked any features, clear the highlight from other features except the one we are currently visiting
    // once we are navigating next and previous feature

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature]);

  useEffect(() => {
    if (clearAllCheckboxes) {
      setCheckedFeatures([]);
      setChecked(false);
      onClearCheckboxes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAllCheckboxes]);

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
                <Tooltip title={t('details.zoom_to')} placement="top" enterDelay={1000}>
                  <ZoomInSearchIcon />
                </Tooltip>
              </IconButton>
            </>
          }
        >
          <img src={featureIconSrc} alt={nameFieldValue} style={sxClasses.featureInfoSingleImage} />
          <ListItemText sx={sxClasses.itemText} primary={nameFieldValue} />
        </ListItem>
      </List>

      <List sx={sxClasses.featureInfoListContainer}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

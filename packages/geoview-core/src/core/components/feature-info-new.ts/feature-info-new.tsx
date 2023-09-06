/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/require-default-props */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Paper } from '@mui/material';

import linkifyHtml from 'linkify-html';

import { getUid } from 'ol/util';

import { CardMedia, List, ListItem, ListItemText, ZoomInSearchIcon, Tooltip, IconButton, Box, Checkbox } from '@/ui';
import { api, TypeFeatureInfoEntry } from '@/app';
import { HtmlToReact } from '../../containers/html-to-react';
import { featureHighlightPayload, clearHighlightsPayload, TypeFieldEntry } from '@/api/events/payloads';
import { isImage, stringify, generateId, sanitizeHtmlContent } from '../../utils/utilities';
import { LightBoxSlides } from '../lightbox/lightbox';
import { EVENT_NAMES } from '@/api/events/event-types';
import { FeatureInfoTable } from './feature-info-table';

const sxClasses = {
  layerItem: {
    color: 'text.primary',
    padding: 0,
  },
  itemText: {
    fontSize: 14,
    noWrap: true,
    '& .MuiListItemText-primary': {
      font: 'normal normal 600 20px/27px Roboto, Helvetica, Arial, sans-serif',
    },
    '& .MuiListItemText-secondary': {
      font: 'normal normal 16px/22px Roboto, Helvetica, Arial, sans-serif',
      color: '#000000',
    },
  },
  featureInfoItem: {
    width: '100%',
    margin: '5px 0',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  featureInfoItemOdd: {
    display: 'flex',
    width: '100%',
    margin: '5px 0',
    backgroundColor: 'rgba(0,0,0,0.2)',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  featureInfoItemKey: {
    fontSize: '0.85em',
    marginRight: 0,
    paddingRight: '10px',
    fontWeight: 700,
    wordBreak: 'break-word',
    // border: '1px solid red',
  },
  featureInfoItemValue: {
    fontSize: '0.85em',
    marginRight: 0,
    marginTop: '5px',
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // border: '1px solid green',
  },
  featureInfoItemImage: {
    cursor: 'pointer',
  },
};

export interface TypeFeatureInfoProps {
  mapId: string;
  feature: TypeFeatureInfoEntry;
  selectedFeatures?: MutableRefObject<string[]>;
}

/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo({ mapId, feature, selectedFeatures }: TypeFeatureInfoProps): JSX.Element {
  const { t } = useTranslation<string>();

  const featureUid = getUid(feature.geometry);

  const nameFieldValue = feature.fieldInfo[feature.nameField!]!.value as string;
  const featureInfoList: TypeFieldEntry[] = Object.keys(feature.fieldInfo).map((fieldName) => {
    return {
      fieldKey: feature.fieldInfo[fieldName]!.fieldKey,
      value: feature.fieldInfo[fieldName]!.value,
      dataType: feature.fieldInfo[fieldName]!.dataType,
      alias: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      domain: null,
    };
  });

  // lightbox component state
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);

  const [checked, setChecked] = useState<boolean>(false);

  // linkify options
  const linkifyOptions = {
    attributes: {
      title: t('details.external_link'),
    },
    defaultProtocol: 'https',
    format: {
      url: (value: string) => (value.length > 50 ? `${value.slice(0, 40)}…${value.slice(value.length - 10, value.length)}` : value),
    },
    ignoreTags: ['script', 'style', 'img'],
    target: '_blank',
  };

  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!checked) {
      setChecked(true);
      api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
    } else {
      setChecked(false);
      api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, featureUid));
    }
  };

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    api.maps[mapId].zoomToExtent(feature.extent);
  };

  useEffect(() => {
    if (selectedFeatures?.current && selectedFeatures.current.indexOf(featureUid) !== -1) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [featureUid, selectedFeatures]);

  return (
    <Paper sx={{ backgroundColor: checked ? '#FFFAD1' : 'initial' }}>
      <List style={{ paddingLeft: '25px', paddingTop: '25px' }}>
        <ListItem
          secondaryAction={
            <>
              <Tooltip title={t('details.select')} placement="top" enterDelay={1000}>
                <Checkbox onChange={(e) => handleSelect(e)} checked={checked} />
              </Tooltip>
              <IconButton color="primary" onClick={(e) => handleZoomIn(e)}>
                <Tooltip title={t('details.zoom_to')} placement="top" enterDelay={1000}>
                  <ZoomInSearchIcon />
                </Tooltip>
              </IconButton>
            </>
          }
        >
          <ListItemText sx={sxClasses.itemText} primary={nameFieldValue} secondary="Layer quick overview info" />
        </ListItem>
      </List>

      <List sx={{ paddingLeft: '25px', paddingRight: '25px', paddingBottom: '25px' }}>
        <FeatureInfoTable featureInfoList={featureInfoList} />
      </List>
    </Paper>
  );
}

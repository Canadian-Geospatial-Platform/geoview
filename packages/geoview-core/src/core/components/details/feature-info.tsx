/* eslint-disable react/require-default-props */
import React, { MutableRefObject, useEffect, useState } from 'react';

import { getUid } from 'ol/util';

import { useTheme, Theme } from '@mui/material/styles';
import MaterialCardMedia from '@mui/material/CardMedia';
import { useTranslation } from 'react-i18next';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ExpandMoreIcon,
  ExpandLessIcon,
  ZoomInSearchIcon,
  Tooltip,
  IconButton,
  Box,
  CheckBoxIcon,
  CheckBoxOutIcon,
} from '../../../ui';
import { api } from '../../../app';
import { TypeFeatureInfoEntry, TypeFieldEntry } from '../../../api/events/payloads/get-feature-info-payload';
import { DetailsProps } from './details';
import { isImage, stringify, generateId } from '../../utils/utilities';
import { LightboxImg, LightBoxSlides } from '../lightbox/lightbox';
import { EVENT_NAMES } from '../../../api/events/event-types';
import { featureHighlightPayload } from '../../../api/events/payloads/feature-highlight-payload';
import { clearHighlightsPayload } from '../../../api/events/payloads/clear-highlights-payload';

const sxClasses = {
  layerItem: {
    color: 'text.secondary',
    padding: 0,
  },
  layerItemSelected: {
    color: 'text.primary',
    padding: 0,
    border: 'solid',
  },
  itemText: {
    fontSize: 14,
    noWrap: true,
  },
  expandableIconContainer: {
    paddingLeft: 10,
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
  },
  featureInfoItemValue: {
    fontSize: '0.85em',
    marginRight: 0,
    marginTop: '5px',
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  featureInfoItemImage: {
    cursor: 'pointer',
  },
};

export interface TypeFeatureProps {
  // eslint-disable-next-line react/no-unused-prop-types
  feature: TypeFeatureInfoEntry;
  startOpen?: boolean;
  selectedFeatures?: MutableRefObject<string[]>;
  detailsSettings: DetailsProps;
}

/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo(props: TypeFeatureProps): JSX.Element {
  const { t } = useTranslation<string>();

  const { feature, startOpen, selectedFeatures, detailsSettings } = props;
  const { mapId } = detailsSettings;
  const featureIconSrc = feature.featureIcon.toDataURL();
  const featureUid = getUid(feature.geometry);
  const nameFieldValue = feature.fieldInfo[feature.nameField!]!.value as string;
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<boolean>(false);
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);

  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  useEffect(() => {
    if (selectedFeatures?.current && selectedFeatures.current.indexOf(featureUid) !== -1) {
      setIsSelected(true);
      setOpen(true);
    } else {
      setIsSelected(false);
      setOpen(false);
    }
  }, [featureUid, selectedFeatures]);

  function handleZoomIn(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    api.map(mapId).zoomToExtent(feature.extent);
    setOpen(true);
  }

  function handleSelect(e: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    e.stopPropagation();
    if (!isSelected) {
      setIsSelected(true);
      api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
    } else {
      setIsSelected(false);
      api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, featureUid));
    }
  }

  function handleOpen(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setOpen(!isOpen);
  }

  useEffect(() => {
    // a list of FeatureInfo with only one element will pass down the startOpen prop
    if (startOpen) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // todo keep the marker to be showing up
  /*  useEffect(() => {
    api.event.emit(markerDefinitionPayload(api.eventNames.MARKER_ICON.EVENT_MARKER_ICON_SHOW, handlerName, location, {} as TypeJsonObject));
  }, [currentZoom, location, handlerName]);
  */

  /**
   * Parse the content of the field to see if we need to create an image, a string element or a link
   * @param {TypeFieldEntry} featureInfoItem the field item
   * @returns {JSX.Element | JSX.Element[]} the React element(s)
   */
  function setFeatureItem(featureInfoItem: TypeFieldEntry): JSX.Element | JSX.Element[] {
    const slidesSetup: LightBoxSlides[] = [];

    function process(item: string, alias: string, index: number): JSX.Element {
      let element: JSX.Element;
      if (typeof item === 'string' && isImage(item)) {
        slidesSetup.push({ src: item, alt: alias, downloadUrl: item });
        const id = generateId();
        element = (
          <MaterialCardMedia
            key={id}
            component="img"
            sx={[sxClasses.featureInfoItemValue, sxClasses.featureInfoItemImage]}
            alt={alias}
            src={item}
            tabIndex={0}
            onClick={() => {
              setIsLightboxOpen(true);
              setSlides(slidesSetup);
              setSlidesIndex(index);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsLightboxOpen(true);
                setSlides(slidesSetup);
              }
            }}
          />
        );
      } else {
        element = (
          <Box key={generateId()} sx={sxClasses.featureInfoItemValue}>
            {item}
          </Box>
        );
      }

      return element;
    }

    // item must be a string
    const { alias } = featureInfoItem;
    const { value } = featureInfoItem;
    let values: string | string[] = Array.isArray(value) ? String(value.map(stringify)) : String(stringify(value));
    values = values.toString().split(';');
    const results = Array.isArray(values)
      ? values.map((item: string, index: number) => process(item, alias, index))
      : process(values, alias, 0);

    return results;
  }

  return (
    <>
      <ListItem sx={isSelected ? sxClasses.layerItemSelected : sxClasses.layerItem} onClick={(e) => handleSelect(e)}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary" onClick={(e) => handleOpen(e)}>
              {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemIcon>
          <ListItemIcon>
            <img alt={nameFieldValue} src={featureIconSrc} style={{ ...theme.iconImg, width: '35px', height: '35px' }} />
          </ListItemIcon>
          <ListItemText sx={sxClasses.itemText} primary={nameFieldValue} />
          <ListItemIcon>
            <IconButton color="primary">
              <Tooltip title={t('details.select')} placement="top" enterDelay={1000}>
                {isSelected ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
              </Tooltip>
            </IconButton>
          </ListItemIcon>
          <ListItemIcon>
            <IconButton color="primary" onClick={(e) => handleZoomIn(e)}>
              <Tooltip title={t('details.zoom_to')} placement="top" enterDelay={1000}>
                <ZoomInSearchIcon />
              </Tooltip>
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box>
          <LightboxImg
            open={isLightboxOpen}
            slides={slides}
            index={slidesIndex}
            exited={() => {
              // TODO: because lighbox element is render outside the map container, the focus trap is not able to access it.
              // TODO: if we use the keyboard to access the image, we can only close with esc key.
              // TODO: #1113
              setIsLightboxOpen(false);
              setSlides([]);
            }}
          />
          <List sx={sxClasses.expandableIconContainer}>
            {
              // loop through each feature
              featureInfoList.map((featureInfoItem, index) => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <ListItem key={index} sx={index % 2 > 0 ? sxClasses.featureInfoItem : sxClasses.featureInfoItemOdd}>
                    <Box sx={sxClasses.featureInfoItemKey}>{featureInfoItem.alias}</Box>
                    <Box component="span" sx={{ flex: 1 }} />
                    <Box>{setFeatureItem(featureInfoItem)}</Box>
                  </ListItem>
                );
              })
            }
          </List>
        </Box>
      </Collapse>
    </>
  );
}

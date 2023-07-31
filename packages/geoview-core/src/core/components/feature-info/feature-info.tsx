/* eslint-disable react/require-default-props */
import React, { useState } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import linkifyHtml from 'linkify-html';

import {
  CardMedia,
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
} from '@/ui';
import { api } from '@/app';
import { HtmlToReact } from '../../containers/html-to-react';
import { TypeFeatureInfoEntry, TypeFieldEntry } from '@/api/events/payloads';
import { isImage, stringify, generateId, sanitizeHtmlContent } from '../../utils/utilities';
import { LightboxImg, LightBoxSlides } from '../lightbox/lightbox';

const sxClasses = {
  layerItem: {
    color: 'text.primary',
    padding: 0,
  },
  itemText: {
    fontSize: 14,
    noWrap: true,
  },
  expandableIconContainer: {
    padding: '10px',
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

export interface TypeFeatureInfoProps {
  mapId: string;
  feature: TypeFeatureInfoEntry;
  startOpen?: boolean;
}

/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo(props: TypeFeatureInfoProps): JSX.Element {
  const { t } = useTranslation<string>();

  const { feature, startOpen, mapId } = props;
  const featureIconSrc = feature.featureIcon.toDataURL();
  const nameFieldValue = feature.fieldInfo[feature.nameField!]!.value as string;
  const [isOpen, setOpen] = useState<boolean | undefined>(startOpen);
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

  function handleZoomIn(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    api.map(mapId).zoomToExtent(feature.extent);
    setOpen(true);
  }

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
        element = (
          <CardMedia
            key={generateId()}
            sx={[sxClasses.featureInfoItemValue, sxClasses.featureInfoItemImage]}
            alt={alias}
            src={item}
            tabIndex={0}
            click={() => {
              setIsLightBoxOpen(true);
              setSlides(slidesSetup);
              setSlidesIndex(index);
            }}
            keyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                setIsLightBoxOpen(true);
                setSlides(slidesSetup);
              }
            }}
          />
        );
      } else {
        element = (
          <Box key={generateId()} sx={sxClasses.featureInfoItemValue}>
            <HtmlToReact htmlContent={sanitizeHtmlContent(linkifyHtml(item, linkifyOptions))} />
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
      <ListItem sx={sxClasses.layerItem} onClick={() => setOpen(!isOpen)}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary">{isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </ListItemIcon>
          <ListItemIcon>
            <img alt={nameFieldValue} src={featureIconSrc} style={{ ...theme.iconImg, width: '35px', height: '35px' }} />
          </ListItemIcon>
          <ListItemText sx={sxClasses.itemText} primary={nameFieldValue} />
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
            open={isLightBoxOpen}
            slides={slides}
            index={slidesIndex}
            exited={() => {
              // TODO: because lighbox element is render outside the map container, the focus trap is not able to access it.
              // TODO: if we use the keyboard to access the image, we can only close with esc key.
              // TODO: #1113
              setIsLightBoxOpen(false);
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

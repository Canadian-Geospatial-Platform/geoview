/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { fromLonLat } from 'ol/proj';
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
  ZoomOutSearchIcon,
  Tooltip,
  IconButton,
  Box,
} from '../../../ui';
import { api } from '../../../app';
import { TypeFeatureInfoEntry } from '../../../api/events/payloads/get-feature-info-payload';
import { DetailsProps } from './details';

const useStyles = makeStyles((theme) => ({
  layerItem: {
    color: theme.palette.text.primary,
    padding: 0,
  },
  itemText: {
    fontSize: 14,
    noWrap: true,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  featureInfoItem: {
    display: 'flex',
    width: '100%',
    margin: '5px 0',
  },
  featureInfoItemOdd: {
    display: 'flex',
    width: '100%',
    margin: '5px 0',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  featureInfoItemKey: {
    fontWeight: 'bold',
    fontSize: '0.7em',
    width: '40%',
  },
  featureInfoItemValue: {
    fontSize: '0.7em',
    width: '40%',
  },
  iconImg: {
    ...theme.iconImg,
    width: '35px',
    height: '35px',
  },
}));
export interface TypeFeatureProps {
  // eslint-disable-next-line react/no-unused-prop-types
  feature: TypeFeatureInfoEntry;
  startOpen?: boolean;
  detailsSettings: DetailsProps;
}

/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export function FeatureInfo(props: TypeFeatureProps): JSX.Element {
  const { feature, startOpen, detailsSettings } = props;
  const classes = useStyles();
  const { mapId, backgroundStyle } = detailsSettings;
  const featureId = `Feature Info ${feature.featureKey}`;
  const featureIconSrc = feature.featureIcon.toDataURL();
  const [isOpen, setOpen] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<boolean>(false);
  const featureInfoList = Object.keys(feature.fieldInfo).map((fieldName) => {
    return {
      key: feature.fieldInfo[fieldName]!.alias ? feature.fieldInfo[fieldName]!.alias : fieldName,
      type: feature.fieldInfo[fieldName]!.dataType,
      value: feature.fieldInfo[fieldName]!.value,
    };
  });
  const fontColor = backgroundStyle === 'dark' ? { color: '#fff' } : {};
  const { currentProjection } = api.map(mapId);
  const { zoom, center } = api.map(mapId).mapFeaturesConfig.map.viewSettings;
  const projectionConfig = api.projection.projections[currentProjection];

  function handleZoomIn(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    if (!currentZoom) {
      api.map(mapId).zoomToExtent(feature.extent);
      setOpen(true);
    } else {
      api
        .map(mapId)
        .map.getView()
        .animate({
          center: fromLonLat(center, projectionConfig),
          duration: 500,
          zoom,
        });
    }
    setCurrentZoom(!currentZoom);
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
  return (
    <>
      <ListItem className={classes.layerItem} onClick={() => setOpen(!isOpen)}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary" sx={fontColor}>
              {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemIcon>
          <ListItemIcon>
            <img alt={featureId} src={featureIconSrc} className={classes.iconImg} />
          </ListItemIcon>
          <Tooltip title={featureId} placement="top" enterDelay={1000}>
            <ListItemText className={classes.itemText} sx={fontColor} primary={featureId} />
          </Tooltip>
          <ListItemIcon>
            <IconButton sx={fontColor} onClick={(e) => handleZoomIn(e)}>
              {!currentZoom ? <ZoomInSearchIcon /> : <ZoomOutSearchIcon />}
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box>
          <List className={classes.expandableIconContainer}>
            {
              // loop through each layer in the map server
              featureInfoList.map((featureInfoItem, index) => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <ListItem key={index} className={index % 2 > 0 ? classes.featureInfoItem : classes.featureInfoItemOdd}>
                    <Box sx={fontColor} className={classes.featureInfoItemKey}>
                      {featureInfoItem.key}
                    </Box>
                    <Box sx={fontColor} className={classes.featureInfoItemValue}>
                      {featureInfoItem.value}
                    </Box>
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

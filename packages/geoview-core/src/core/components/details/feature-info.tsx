/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';
import { getCenter, Extent } from 'ol/extent';
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

const sxClasses = {
  details: {
    width: '100%',
  },
  layerItem: {
    color: 'text.primary',
    padding: 0,
  },
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  legendIcon: {
    width: 24,
    height: 24,
    background: '#fff',
  },
  solidBackground: {
    background: '#fff',
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
};

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
  const { mapId, location, backgroundStyle } = detailsSettings;

  const featureId = `Feature Info ${feature.featureKey}`;
  const featureGeoMetry = feature.geometry;
  const featureInfoList = Object.keys(feature.featureInfo).map((featureKey) => {
    return { key: featureKey, value: feature.featureInfo[featureKey] };
  });
  const fontColor = backgroundStyle === 'dark' ? { color: '#fff' } : {};

  const { currentProjection } = api.map(mapId);
  const { zoom, center } = api.map(mapId).mapFeaturesConfig.map.viewSettings;
  const projectionConfig = api.projection.projections[currentProjection];
  // console.log(api.map(mapId).mapFeaturesConfig.map.viewSettings);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<boolean>(false);

  const getFeatureZoomCenter = (geometry: Geometry) => {
    let featurePoint = null;
    let zoomCenter = null;
    if (geometry instanceof Polygon) {
      featurePoint = geometry.getInteriorPoint() !== undefined ? geometry.getInteriorPoint() : null;
    }

    if (geometry instanceof LineString) {
      featurePoint = geometry.getCoordinateAt(0.5) !== undefined ? new Point(geometry.getCoordinateAt(0.5)) : null;
    }

    if (geometry instanceof Point) {
      featurePoint = geometry !== undefined ? (geometry as Point) : null;
    }

    if (geometry instanceof MultiPoint) {
      const mcenter = getCenter(geometry.getExtent() as Extent) as Coordinate;
      featurePoint = mcenter !== undefined ? new Point(center) : null;
    }
    if (featurePoint !== null) {
      zoomCenter = getCenter(featurePoint.getExtent() as Extent) as Coordinate;
    }
    return zoomCenter !== undefined ? zoomCenter : null;
  };

  function handleZoomIn() {
    // get map and set initial bounds to use in zoom home
    let zoomCenter = null;
    if (featureGeoMetry !== undefined) {
      // const geoviewLayers = api.map(mapId).layer.vector;
      // console.log(geoviewLayers, featureGeoMetry);
      zoomCenter = getFeatureZoomCenter(featureGeoMetry);
      // console.log(location, featureGeoMetry, zoomCenter);
    }

    if (zoomCenter === null || currentZoom) {
      zoomCenter = location as Coordinate;
    }

    api
      .map(mapId)
      .map.getView()
      .animate({
        center: fromLonLat(zoomCenter, projectionConfig),
        duration: 500,
        zoom: currentZoom ? zoom : zoom + 2,
      });

    // console.log(featureGeoMetry);
    setCurrentZoom(!currentZoom);
    setOpen(true);
  }

  useEffect(() => {
    // a list of FeatureInfo with only one element will pass down the startOpen prop
    if (startOpen) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ListItem sx={{ ...sxClasses.layerItem, ...fontColor }}>
        <ListItemButton>
          <ListItemIcon>
            <IconButton color="primary" sx={fontColor} onClick={() => setOpen(!isOpen)}>
              {!isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemIcon>
          <Tooltip title={featureId} placement="top" enterDelay={1000} onClick={() => setOpen(!isOpen)}>
            <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={featureId} />
          </Tooltip>
          <ListItemIcon>
            <IconButton color="primary" sx={fontColor} onClick={() => handleZoomIn()}>
              {!currentZoom ? <ZoomInSearchIcon /> : <ZoomOutSearchIcon />}
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box>
          <List sx={sxClasses.expandableIconContainer}>
            {
              // loop through each layer in the map server
              featureInfoList.map((featureInfoItem, index) => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <ListItem key={index} sx={index % 2 > 0 ? sxClasses.featureInfoItem : sxClasses.featureInfoItemOdd}>
                    <Box sx={sxClasses.featureInfoItemKey}>{featureInfoItem.key}</Box>
                    <Box sx={sxClasses.featureInfoItemValue}>{featureInfoItem.value}</Box>
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

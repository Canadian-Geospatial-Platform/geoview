import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';

import { Overlay } from 'ol';

import { Theme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';

import { payloadIsAMarkerDefinition } from '../../../api/events/payloads/marker-definition-payload';

const useStyles = makeStyles((theme: Theme) => ({
  markerIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: theme.zIndex.tooltip,
  },
  symbologyIcon: {
    transform: 'scale(2)',
  },
  overlayPane: {
    background: theme.palette.backdrop,
    zIndex: theme.zIndex.tooltip,
    backdropFilter: 'blur(0.5px)',
    visibility: 'hidden',
  },
}));

/**
 * Create a react element to display a marker when a user clicks on
 * the map at the click location
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
export function ClickMarker(): JSX.Element {
  const [showMarker, setShowMarker] = useState(false);
  // const [markerPos, setMarkerPos] = useState<Coordinate>(); // ! markerPos is never used. this line probably needs to be deleted.
  const [markerIcon, setMarkerIcon] = useState<ReactElement>();

  const classes = useStyles();

  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;

  const overlay = document.createElement('div');

  /**
   * Remove the marker icon
   */
  const removeIcon = useCallback(() => {
    setShowMarker(false);
    overlay.style.visibility = 'hidden';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Hide features from markerPane (set zIndex to -1) because they are always on top of overlay
   */
  function hideMarker(): void {
    const featElems = document.getElementsByClassName(`leaflet-map-${mapId}`)[0].getElementsByClassName('leaflet-marker-pane')[0].children;
    [...featElems].forEach((element: Element) => {
      // eslint-disable-next-line no-param-reassign
      if (element.classList.contains('leaflet-marker-icon')) (element as HTMLElement).style.zIndex = '-1';
    });
  }

  const icon = (
    <div className={classes.markerIcon}>
      <img
        alt="marker"
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARuSURBVDiNjZVrbFRVEMd/5967e9vddbduN4WWYgXKKyVQWgIhkQBVqJIYCQZJI00UH2DiNxUUQwQNSfH1RYwghphoCIGADQk1QKqAGCKhCKTKq6GWbYHSdvve9u7ee8cP210LAjrJ+XAmM78zOf8zcxT/bROBYuDRkX03cA1ofliSeoDfBFYAz2UZemFZXsBf6De9gkvbQCJx7k7/4LAjrUAtcBBI/B/wDGBL6Zhg0cZ5E8YvKswJ+zRl4LqIOOC6xBO2fbytJ7a1oS16sSveDGwG/ngYuEJXatOnT06f9ErJuEINUYgLrosK5CDiID2d4LogLrbtyDeX7rSu/631msBHwPE0SB9dqa5Uzf4V5SWrpuXna6AQAQREyFqzGWPWAuwzR0j7Fag5EV+oPOILHGjuni5wFugYDTaB7Z8vmTFj1bSC/DQMEbRIAZ6FK9BL5qGCYVSWD4m1I4N9mZhJj3j9OR5dP3azf/LIvbtp8AulY0LPbF86c6oCBQKAt7Ia8+VN6BNKQNPA8GJMKcNTsRKUwrl6LlN9aTgreLSt37o9ZHcDjWnwpi+eLp01NdcfSAd6lq7GU7ma5C+1WF9tQC+ajnS3M7TtNZTpw1tZDeLiXGnIXEvEq+sHW3pN4IABTDR1fdyiotxwRtFIAZ4lVSRP1pI4+CW4Ltb3NSnxhgaw9n4GCOazr2KfrsNtv5FSPt8fztLV+GFHHteA4vL8kN/vNYw02CirANcl+eO3GWWlL4b0xTL7RO0OEBdj/rKMz2doRmk42wcUa0BuYcjvBVA5EczXt6aCHRtzzQeoUG7qsLlLMeZWko7LeqMGsW28i1fie2cnWngsAIU+wwtENEBERO55z/zLcT+7T3uN5IkGdLX1xZMA0tOJ9fX72KfrULqOtXsL0tsFgH3maOoNj8QN73gPpRskftpH/JO1uLHbAETjdgLo1ICmhlu9gwMJ206fajfUg9LwLHvpn+KCYVQwoy/e5esAhX26LuMbTLr2hdhQHGjSgGbLcaInWroyykjXLZLH9uBZsBzv82+isv2Yq98lq3ojKjuAWfU2nsUrsQ7twu1oy4B/vj0YsxyJAi3pW6qaOSb01qnqJ8r09HwQwXiqCu/SF0EEsZOpyg0PKEXi0C6sw7vBcUBckrYjCw83nWvsGf4Y2JdukKvtg1ZFxGcG54wNhdIt7TRdwGmoR4b60QsmgpMkWb8X67sa7PMnMi0Nws5LndE913saga2MamkHuFjf3DF/dn4oUJzj86eTJN6He+08+pRypC+G9f221JwYNU+ORHs71v0avQxsANrh7unWJXBj/6Wb08LZHr00LxjU0nNDBOfyWewLJ2E4nqnSdlzZ+eed6NpTNy4LfEhqunEvGOAvoOFoc+fkuusdw3l+0ygMmKZXUxrDccRKQQcs2z7S2tO55vj1K3uaYo3A+tFQePDX5CH1NS03dTV+dl7Q91jANAWXaH/C+r2jPz6i/g8jK3kv4EHg0VYETOHuz/Qq0PKwpL8BL8EAdKaMj7AAAAAASUVORK5CYII="
      />
    </div>
  );

  useEffect(() => {
    const { map } = api.map(mapId);

    setMarkerIcon(icon as ReactElement);

    map.getView().on('change:resolution', removeIcon);
    map.on('movestart', removeIcon);

    // create overlay pane
    const detailsOverlay = new Overlay({
      id: `overlay-${mapId}`,
      element: overlay,
    });
    overlay.setAttribute('class', `overlay-marker-blur ${classes.overlayPane}`);

    map.addOverlay(detailsOverlay);

    api.event.on(
      EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW,
      (payload) => {
        if (payloadIsAMarkerDefinition(payload)) {
          if (payload.handlerName!.includes(mapId)) {
            // toggle the marker icon
            setShowMarker(true);

            // set the overlay... get map size and apply mapPane transform to the overlay
            const test = api.geoUtilities.getTranslateValues(api.map(mapId).map.getOverlayById(`overlay-${mapId}`).getElement()!);
            const size = map.getSize()!;
            overlay.style.height = `${size[1]}px`;
            overlay.style.width = `${size[0]}px`;
            overlay.style.transform = `translate3d(${-test.x}px,${-test.y}px,${test.z})`;
            overlay.style.visibility = 'visible';
            overlay.style.display = 'block';

            // hide marker pane marker (mostly comes from ESRI feature or GeoJSON)
            hideMarker();

            // update the click location
            // setMarkerPos(Cast<Coordinate>(payload.lnglat)); // ! markerPos is never used. this line probably needs to be deleted.

            if (payload.symbology) {
              const theSymbology = payload.symbology;
              let iconHtml = '';

              // get symbology image
              if (theSymbology.imageData) {
                iconHtml = `<img class='${classes.symbologyIcon}' src='data:${theSymbology.contentType};base64,${theSymbology.imageData}' alt="" />`;
              } else if (theSymbology.legendImageUrl) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                iconHtml = `<img class='${classes.symbologyIcon}' src='${theSymbology.legendImageUrl}' alt='' />`;
              }

              setMarkerIcon(<div className={classes.markerIcon}>iconHtml</div>);
            } else {
              setMarkerIcon(icon);
            }
          }
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE,
      (payload) => {
        // we do not need to verify the payload as no marker are pass
        // we only need to validate if we have handler name (map id)
        if (payload.handlerName!.includes(mapId)) {
          setShowMarker(false);
          overlay.style.display = 'none';
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW, mapId);
      api.event.off(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return markerIcon && showMarker ? (
    markerIcon
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
}

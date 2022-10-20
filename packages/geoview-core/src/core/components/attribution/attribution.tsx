/* eslint-disable no-underscore-dangle */
import React, { useContext, useEffect } from 'react';

import OLAttribution, { Options } from 'ol/control/Attribution';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { payloadIsABoolean } from '../../../api/events/payloads/boolean-payload';

const useStyles = makeStyles((theme) => ({
  attributionContainer: {
    display: 'flex',
    padding: theme.spacing(0, 4),
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    alignItems: 'center',
    width: '100%',
    '& .ol-attribution': {
      display: 'flex !important',
      flexDirection: 'row',
      position: 'relative',
      backgroundColor: 'initial',
      borderRadius: 'initial',
      padding: 'initial',
      margin: 'initial',
      left: 'auto',
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      maxWidth: 'initial',
      textAlign: 'left',
      overflow: 'hidden',
      '& button:not(.expand-collapse-icon)': {
        display: 'none',
      },
      '& ul': {
        display: 'block',
        width: 0,
        maxWidth: '500px',
        overflow: 'hidden',
        margin: 'initial',
        padding: 'initial',
        color: theme.palette.primary.light,
        textShadow: 'initial',
        fontSize: 'initial',
        '& li': {
          display: 'block',
          fontSize: theme.typography.subtitle2.fontSize,
          color: theme.palette.primary.light,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        },
      },
    },
  },
}));

/**
 * Custom Attribution control that extends Openlayers Attribution control.
 * Class adds title to attribution text to show a tooltip when mouse is over it.
 *
 * @class CustomAttribution
 */
class CustomAttribution extends OLAttribution {
  attributions: string[] = [];

  mapId: string;

  /**
   * Constructor that enables attribution text tooltip.
   *
   * @param {Options} optOptions control options
   */
  constructor(optOptions: Options, mapId: string) {
    const options = optOptions || {};

    super(options);

    this.mapId = mapId;
  }

  /**
   * Return the attribution control element
   *
   * @returns {HTMLElement} the attribution control element
   */
  getTargetElement() {
    return this.element;
  }

  /**
   * Format the attribution elemtn by removeing duplicate and add tooltip (title)
   */
  formatAttribution() {
    // find ul element in attribution control
    const ulElement = this.element.getElementsByTagName('UL')[0];
    const compAttribution: string[] = [];

    if (ulElement) {
      // find li elements in ul element
      const liElements = ulElement.getElementsByTagName('LI');

      if (liElements && liElements.length > 0) {
        // add title attribute to li elements
        for (let liElementIndex = 0; liElementIndex < liElements.length; liElementIndex++) {
          const liElement = liElements[liElementIndex] as HTMLElement;
          const attributionText = liElement.innerText;

          // if elemetn doat not exist, add. Otherwise remove
          if (!compAttribution.includes(attributionText.toLowerCase().replaceAll(' ', ''))) {
            liElement.setAttribute('title', attributionText);
            this.attributions.push(attributionText);
            compAttribution.push(attributionText.toLowerCase().replaceAll(' ', ''));
          } else {
            liElement.remove();
          }
        }
      }
    }
  }

  /**
   * Return all attributions.
   *
   * @returns {string[]} return attributions text
   */
  getAttributions(): string[] {
    return this.attributions;
  }
}

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 *
 * @returns {JSX.Element} created attribution element
 */
export function Attribution(): JSX.Element {
  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  useEffect(() => {
    const { map } = api.map(mapId);

    const attributionText = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

    const attributionControl = new CustomAttribution(
      {
        target: attributionText,
        collapsible: false,
        collapsed: false,
        label: document.createElement('div'),
        collapseLabel: document.createElement('div'),
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE,
      (payload) => {
        if (payloadIsABoolean(payload)) {
          if (payload.handlerName!.includes(mapId) && payload.status) {
            attributionControl.formatAttribution();
          }
        }
      },
      mapId
    );

    map.addControl(attributionControl);
  }, [mapId]);

  return <div id={`${mapId}-attribution-text`} className={classes.attributionContainer} />;
}

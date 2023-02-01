/* eslint-disable no-underscore-dangle */
import React, { useContext, useEffect, useState, useRef } from 'react';

import OLAttribution, { Options } from 'ol/control/Attribution';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';
import { Tooltip, Box } from '../../../ui';
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
    transition: 'opacity 1ms ease-in 300ms',
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
        maxWidth: '500px',
        overflow: 'hidden',
        margin: 'initial',
        padding: 'initial',
        color: theme.palette.primary.light,
        textShadow: 'initial',
        fontSize: 'initial',
        '& li': {
          display: 'block',
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
   * Format the attribution element by removing duplicate
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
  const attributionTextRef = useRef<Array<string>>([]);
  const [attribtuionTextOpacity, setAttribtuionTextOpacity] = useState<boolean>(false);

  const { mapId } = mapConfig;

  useEffect(() => {
    const { map } = api.map(mapId);

    const attributionTextElement = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

    const attributionControl = new CustomAttribution(
      {
        target: attributionTextElement,
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
          if (attributionTextElement) {
            const liElements = attributionTextElement.getElementsByTagName('LI');
            if (liElements && liElements.length > 0) {
              for (let liElementIndex = 0; liElementIndex < liElements.length; liElementIndex++) {
                const liElement = liElements[liElementIndex] as HTMLElement;
                attributionTextRef.current.push(liElement.innerText);
              }
            }
          }
          if (payload.handlerName!.includes(mapId) && payload.status) {
            attributionControl.formatAttribution();
          }
          if (!payload.status) {
            attributionTextRef.current.length = 0;
          }
          setAttribtuionTextOpacity(payload.status);
        }
      },
      mapId
    );

    map.addControl(attributionControl);
  }, [mapId]);

  return (
    <Tooltip title={!attributionTextRef.current?.length ? '' : attributionTextRef.current.join('\n')}>
      <Box id={`${mapId}-attribution-text`} className={classes.attributionContainer} sx={{ opacity: attribtuionTextOpacity ? 1 : 0 }} />
    </Tooltip>
  );
}

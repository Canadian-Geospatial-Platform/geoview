/* eslint-disable no-underscore-dangle */
import React, { useContext, useEffect } from 'react';

import OLAttribution, { Options } from 'ol/control/Attribution';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api, toJsonObject, TypeJsonObject } from '../../../app';

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
        display: 'block',
        margin: 'initial',
        padding: 'initial',
        fontWeight: 'initial',
        textDecoration: 'initial',
        fontSize: 'initial',
        textAlign: 'initial',
        height: 'auto',
        width: 'auto',
        lineHeight: 'initial',
        backgroundColor: 'initial',
        border: 'none',
        borderRadius: 'initial',
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

    /**
     * Enable attribution text tooltip.
     * Timeout is used to wait for attribution control to get attribution text from layer sources
     */
    setTimeout(() => {
      this.enableAttributionTextTooltip_();
    }, 5000);
  }

  private attributionVal: TypeJsonObject = toJsonObject({
    'en-CA': '© Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources',
    'fr-CA': '© Sa Majesté la Reine du Chef du Canada, représentée par le ministre des Ressources naturelles',
  });

  /**
   * Return the attribution control element
   *
   * @returns {HTMLElement} the attribution control element
   */
  getTargetElement() {
    return this.element;
  }

  /**
   * function that enables attribution text tooltip
   * and adds nrcan copyright text if it is not already added.
   *
   * @private
   */
  enableAttributionTextTooltip_() {
    // find ul element in attribution control
    const ulElement = this.element.getElementsByTagName('UL')[0];

    // nrcan copy right exists? If not add it
    let nrcanCopyRightExists = false;

    if (ulElement) {
      // find li elements in ul element
      const liElements = ulElement.getElementsByTagName('LI');

      if (liElements && liElements.length > 0) {
        // add title attribute to li elements
        for (let liElementIndex = 0; liElementIndex < liElements.length; liElementIndex++) {
          const liElement = liElements[liElementIndex] as HTMLElement;

          const attributionText = liElement.innerText;

          // check if nrcan copyright exists
          if (
            (attributionText.includes('Queen in Right of Canada') && attributionText.includes('Natural Resources')) ||
            (attributionText.includes('Reine du Chef du Canada') && attributionText.includes('Ressources naturelles'))
          ) {
            nrcanCopyRightExists = true;
          }

          // add tooltip title
          liElement.setAttribute('title', liElement.innerText);

          if (liElement.tagName === 'LI') {
            this.attributions.push(liElement.innerText);
          }
        }
      }

      // if nrcan copyright does not exist add it
      if (!nrcanCopyRightExists) {
        // get nrcan copyright based on language
        const copyRightText = this.attributionVal[api.map(this.mapId).language] as string;

        // create li element
        const nrcanCopyRight = document.createElement('LI');

        // add nrcan copyright text to li element
        nrcanCopyRight.innerText = copyRightText;

        // add tooltip text
        nrcanCopyRight.setAttribute('title', copyRightText);

        // add nrcan copyright li to ul element at the top
        ulElement.prepend(nrcanCopyRight);

        // add nrcan copyright text to attributions at the beginning of the array
        this.attributions.unshift(copyRightText);
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

  const mapId = mapConfig.id;

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

    map.addControl(attributionControl);
  }, [mapId]);

  return <div id={`${mapId}-attribution-text`} className={classes.attributionContainer} />;
}

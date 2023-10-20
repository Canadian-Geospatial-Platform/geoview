/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import { useTheme } from '@mui/material/styles';

import OLAttribution, { Options } from 'ol/control/Attribution';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { Tooltip, Box } from '@/ui';
import { getSxClasses } from './attribution-style';

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
}

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 *
 * @returns {JSX.Element} created attribution element
 */
export function Attribution(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [attribution, setAttribution] = useState('');

  // get store values
  const mapElement = useStore(getGeoViewStore(mapId), (state) => state.mapState.mapElement);
  const expanded = useStore(getGeoViewStore(mapId), (state) => state.footerBarState.expanded);

  useEffect(() => {
    let attributionControl: CustomAttribution;

    if (mapElement !== undefined) {
      const attributionTextElement = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

      attributionControl = new CustomAttribution(
        {
          target: attributionTextElement,
          collapsible: false,
          collapsed: false,
          label: document.createElement('div'),
          collapseLabel: document.createElement('div'),
        },
        mapId
      );

      attributionControl.formatAttribution();
      mapElement.addControl(attributionControl);
    }
    return () => {
      if (mapElement !== undefined) {
        mapElement.removeControl(attributionControl);
      }
    };
  }, [mapId, mapElement]);

  useEffect(() => {
    const attributionTextElement = document.getElementById(`${mapId}-attribution-text`) as HTMLElement;

    // TODO: put attribution in store from add layer events
    const tooltipAttribution = [];
    if (attributionTextElement && expanded) {
      const liElements = attributionTextElement.getElementsByTagName('LI');
      if (liElements && liElements.length > 0) {
        for (let liElementIndex = 0; liElementIndex < liElements.length; liElementIndex++) {
          const liElement = liElements[liElementIndex] as HTMLElement;
          tooltipAttribution.push(liElement.innerText);
        }
      }
    }

    setAttribution(tooltipAttribution.join('\n'));
  }, [expanded, mapId]);

  return (
    <Tooltip title={attribution}>
      <Box
        onKeyDown={(evt) => {
          if (evt.code === 'Space') {
            evt.preventDefault(); // prevent space keydown to scroll the page
            evt.stopPropagation();
          }
        }}
        id={`${mapId}-attribution-text`}
        sx={[sxClasses.attributionContainer, { visibility: expanded ? 'visible' : 'hidden' }]}
        tabIndex={0}
      />
    </Tooltip>
  );
}

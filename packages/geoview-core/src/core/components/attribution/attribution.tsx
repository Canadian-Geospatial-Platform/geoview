/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import { useTheme } from '@mui/material/styles';

import { MapContext } from '@/core/app-start';
import { Tooltip, Box } from '@/ui';
import { getSxClasses } from './attribution-style';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';

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

  // get store value
  const expanded = useUIFooterBarExpanded();

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

import React, { createElement, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapBasemapOptions, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { TypeBasemapOptions } from '@/api/config/types/map-schema-types';
import { MapIcon } from '@/ui';
import { TypePanelProps } from '@/ui/panel/panel-types';
import { TypeIconButtonProps, IconButton } from '@/ui/icon-button/icon-button';
import { List, ListItem } from '@/ui/list';
import { BlockIcon, PublicIcon, SatelliteIcon, SignpostIcon } from '@/ui/icons';

const basemapChoiceOptions: Record<string, TypeBasemapOptions> = {
  transport: { basemapId: 'transport', shaded: true, labeled: true },
  imagery: { basemapId: 'imagery', shaded: false, labeled: false },
  simple: { basemapId: 'simple', shaded: false, labeled: false },
  nogeom: { basemapId: 'nogeom', shaded: false, labeled: false },
};

/**
 * Create a basemap select button to open the select panel, and set panel content
 * @returns {JSX.Element} the created basemap select button
 */
export default function BasemapSelect(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/basemap');

  const { t } = useTranslation<string>();

  // Get values from store
  const { createBasemapFromOptions } = useMapStoreActions();
  const configBasemapOptions = useMapBasemapOptions();

  // Check if the basemap from the config is one of our default basemaps
  const noDefault =
    Object.keys(basemapChoiceOptions).includes(configBasemapOptions.basemapId) &&
    JSON.stringify(configBasemapOptions) === JSON.stringify(basemapChoiceOptions[configBasemapOptions.basemapId]);

  const [selectedBasemap, setSelectedBasemap] = useState<string>(noDefault ? configBasemapOptions.basemapId : 'default');

  /**
   * Handles basemap selection and updates basemap
   * @returns {JSX.Element} the created basemap select button
   */
  const handleChoice = (basemapChoice: string): void => {
    setSelectedBasemap(basemapChoice);
    createBasemapFromOptions(basemapChoice === 'default' ? configBasemapOptions : basemapChoiceOptions[basemapChoice]).catch((error) => {
      // Log
      logger.logPromiseFailed('setBaseMap in basemaps.ts', error);
    });
  };

  /**
   * Render buttons in navbar panel.
   * @returns ReactNode
   */
  const renderButtons = (): ReactNode => {
    return (
      <List key="basemapButtons">
        {!noDefault && (
          <ListItem>
            <IconButton
              id="button-default"
              aria-label="basemaps.default"
              tooltip="basemaps.default"
              tooltipPlacement="left"
              size="small"
              onClick={() => handleChoice('default')}
              disabled={selectedBasemap === 'default'}
            >
              <MapIcon />
              {t('basemaps.default')}
            </IconButton>
          </ListItem>
        )}
        <ListItem>
          <IconButton
            id="button-transport"
            aria-label="basemaps.transport"
            tooltip="basemaps.transport"
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice('transport')}
            disabled={selectedBasemap === 'transport'}
          >
            <SignpostIcon />
            {t('basemaps.transport')}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-imagery"
            aria-label="basemaps.imagery"
            tooltip="basemaps.imagery"
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice('imagery')}
            disabled={selectedBasemap === 'imagery'}
          >
            <SatelliteIcon />
            {t('basemaps.imagery')}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-simple"
            aria-label="basemaps.simple"
            tooltip="basemaps.simple"
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice('simple')}
            disabled={selectedBasemap === 'simple'}
          >
            <PublicIcon />
            {t('basemaps.simple')}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-nogeom"
            aria-label="basemaps.nogeom"
            tooltip="basemaps.nogeom"
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice('nogeom')}
            disabled={selectedBasemap === 'nogeom'}
          >
            <BlockIcon />
            {t('basemaps.nogeom')}
          </IconButton>
        </ListItem>
      </List>
    );
  };

  // Set up props for nav bar panel button
  const button: TypeIconButtonProps = {
    tooltip: 'mapnav.basemap',
    children: createElement(MapIcon),
    tooltipPlacement: 'left',
  };

  const panel: TypePanelProps = {
    title: 'basemaps.select',
    icon: createElement(MapIcon),
    content: renderButtons(),
    width: 'flex',
  };

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'basemapSelect', button, panel }} />;
}

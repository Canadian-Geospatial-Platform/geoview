import type { ReactNode } from 'react';
import { createElement, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapBasemapOptions, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import type { TypeBasemapOptions } from '@/api/types/map-schema-types';
import { MapIcon } from '@/ui';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
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
   */
  const handleChoice = useCallback(
    (basemapChoice: string): void => {
      // Log
      logger.logTraceUseCallback('BASEMAP-SELECT, handleChoice', basemapChoice);

      setSelectedBasemap(basemapChoice);
      createBasemapFromOptions(basemapChoice === 'default' ? configBasemapOptions : basemapChoiceOptions[basemapChoice]).catch(
        (error: unknown) => {
          // Log
          logger.logPromiseFailed('setBaseMap in basemaps.ts', error);
        }
      );

      // Focus the close button after selection
      const closeButton = document.querySelector('.MuiDialogTitle-root button') as HTMLButtonElement;
      if (closeButton) {
        closeButton.focus();
      }
    },
    [configBasemapOptions, createBasemapFromOptions]
  );

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
              aria-label={t('basemaps.default')}
              tooltip={t('basemaps.default')!}
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
            aria-label={t('basemaps.transport')}
            tooltip={t('basemaps.transport')!}
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
            aria-label={t('basemaps.imagery')}
            tooltip={t('basemaps.imagery')!}
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
            aria-label={t('basemaps.simple')}
            tooltip={t('basemaps.simple')!}
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
            aria-label={t('basemaps.nogeom')}
            tooltip={t('basemaps.nogeom')!}
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
  const button: IconButtonPropsExtend = {
    'aria-label': 'mapnav.basemap',
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

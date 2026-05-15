import type { ReactNode, MouseEvent } from 'react';
import { createElement, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useStoreMapHasGeoviewBasemapLayer, useStoreMapBasemapOptions } from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import type { TypeBasemapOptions } from '@/api/types/map-schema-types';
import { MapIcon } from '@/ui';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { Button } from '@/ui/button/button';
import { List, ListItem } from '@/ui/list';
import { BlockIcon, PublicIcon, SatelliteIcon, SignpostIcon } from '@/ui/icons';
import { useLayerController, useMapController } from '@/core/controllers/use-controllers';
import type { SxStyles } from '@/ui/style/types';

/** Mapping of basemap choice identifiers to their options. */
const basemapChoiceOptions: Record<string, TypeBasemapOptions> = {
  transport: { basemapId: 'transport', shaded: true, labeled: true },
  imagery: { basemapId: 'imagery', shaded: false, labeled: false },
  simple: { basemapId: 'simple', shaded: false, labeled: false },
  nogeom: { basemapId: 'nogeom', shaded: false, labeled: false },
};

/**
 * Creates a basemap select button to open the select panel.
 *
 * @returns The basemap select button
 */
export default function BasemapSelect(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/basemap');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const mapId = useStoreGeoViewMapId();

  // Get values from store
  const configBasemapOptions = useStoreMapBasemapOptions();
  const hasGeoviewBasemapLayer = useStoreMapHasGeoviewBasemapLayer();
  const mapController = useMapController();
  const layerController = useLayerController();

  /**
   * Memoizes style classes for the basemap select component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('BASEMAP-SELECT - memoSxClasses', theme);

    return getSxClasses(theme);
  }, [theme]);

  // Check if the basemap from the config is one of our default basemaps.
  // If there is a custom basemap, we need to use it as the default regardless of basemap options.
  const noDefault =
    Object.keys(basemapChoiceOptions).includes(configBasemapOptions.basemapId) &&
    JSON.stringify(configBasemapOptions) === JSON.stringify(basemapChoiceOptions[configBasemapOptions.basemapId]) &&
    !hasGeoviewBasemapLayer;

  const [selectedBasemap, setSelectedBasemap] = useState<string>(noDefault ? configBasemapOptions.basemapId : 'default');

  // #region Handlers

  /**
   * Handles basemap selection and updates the map basemap.
   *
   * @param basemapChoice - The selected basemap identifier
   * @param event - The button click event
   */
  const handleChoice = useCallback(
    (basemapChoice: string, event: MouseEvent<HTMLButtonElement>): void => {
      // Prevent action if this basemap is already selected
      if (selectedBasemap === basemapChoice) return;

      // Update state to the new selection
      setSelectedBasemap(basemapChoice);

      // If the Geoview basemap layer is present, toggle visibility based on selection. We hide it on nogeom.
      if (hasGeoviewBasemapLayer) {
        if (basemapChoice === 'default') layerController.setAllLayersVisibilityBasemapsOnly(true);
        else layerController.setAllLayersVisibilityBasemapsOnly(false);
      }

      mapController
        .setBasemap(basemapChoice === 'default' ? configBasemapOptions : basemapChoiceOptions[basemapChoice])
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('setBaseMap in basemaps.ts', error);
        });

      // Keep focus on the button that was pressed
      event.currentTarget.focus();
    },
    [configBasemapOptions, hasGeoviewBasemapLayer, layerController, mapController, selectedBasemap]
  );

  // #endregion Handlers

  /**
   * Renders the basemap choice buttons.
   *
   * @returns The list of basemap buttons
   */
  const renderButtons = (): ReactNode => {
    return (
      <List key="basemapButtons" role="group" aria-label={t('mapnav.basemap')}>
        {!noDefault && (
          <ListItem>
            <Button
              id={`${mapId}-button-default`}
              type="textWithIcon"
              startIcon={<MapIcon />}
              size="small"
              onClick={(event) => handleChoice('default', event)}
              aria-pressed={selectedBasemap === 'default'}
              fullWidth
              sx={memoSxClasses.button}
            >
              {t('basemaps.default')}
            </Button>
          </ListItem>
        )}
        <ListItem>
          <Button
            id={`${mapId}-button-transport`}
            type="textWithIcon"
            startIcon={<SignpostIcon />}
            size="small"
            onClick={(event) => handleChoice('transport', event)}
            aria-pressed={selectedBasemap === 'transport'}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('basemaps.transport')}
          </Button>
        </ListItem>
        <ListItem>
          <Button
            id={`${mapId}-button-imagery`}
            type="textWithIcon"
            startIcon={<SatelliteIcon />}
            size="small"
            onClick={(event) => handleChoice('imagery', event)}
            aria-pressed={selectedBasemap === 'imagery'}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('basemaps.imagery')}
          </Button>
        </ListItem>
        <ListItem>
          <Button
            id={`${mapId}-button-simple`}
            type="textWithIcon"
            startIcon={<PublicIcon />}
            size="small"
            onClick={(event) => handleChoice('simple', event)}
            aria-pressed={selectedBasemap === 'simple'}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('basemaps.simple')}
          </Button>
        </ListItem>
        <ListItem>
          <Button
            id={`${mapId}-button-nogeom`}
            type="textWithIcon"
            startIcon={<BlockIcon />}
            size="small"
            onClick={(event) => handleChoice('nogeom', event)}
            aria-pressed={selectedBasemap === 'nogeom'}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('basemaps.nogeom')}
          </Button>
        </ListItem>
      </List>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    'aria-label': t('mapnav.basemap'),
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

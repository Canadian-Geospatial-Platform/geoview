import { createElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapProjection, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { TypeValidMapProjectionCodes } from '@/api/config/types/map-schema-types';
import { TypePanelProps } from '@/ui/panel/panel-types';
import { IconButtonPropsExtend, IconButton } from '@/ui/icon-button/icon-button';
import { List, ListItem } from '@/ui/list';
import { ProjectionIcon, SatelliteIcon, SignpostIcon } from '@/ui/icons';

const projectionChoiceOptions: {
  [key: string]: {
    code: TypeValidMapProjectionCodes;
  };
} = {
  '3978': { code: 3978 },
  '3857': { code: 3857 },
};

/**
 * Create a projection select button to open the select panel, and set panel content
 * @returns {JSX.Element} the created basemap select button
 */
export default function BasemapSelect(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/projection');

  // Hook
  const { t } = useTranslation<string>();

  // Store
  const projection = useMapProjection();
  const { setProjection } = useMapStoreActions();

  /**
   * Handles basemap selection and updates basemap
   * @returns {JSX.Element} the created basemap select button
   */
  const handleChoice = (projectionCode: TypeValidMapProjectionCodes): void => {
    // setSelectedBasemap(basemapChoice);
    // createBasemapFromOptions(basemapChoice === 'default' ? configBasemapOptions : basemapChoiceOptions[basemapChoice]).catch((error) => {
    //   // Log
    //   logger.logPromiseFailed('setBaseMap in basemaps.ts', error);
    // });
    setProjection(projectionCode);
  };

  /**
   * Render buttons in navbar panel.
   * @returns ReactNode
   */
  const renderButtons = (): ReactNode => {
    return (
      <List key="basemapButtons">
        <ListItem>
          <IconButton
            id="button-transport"
            aria-label={t('basemaps.transport') as string}
            tooltip={t('basemaps.transport') as string}
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice(projectionChoiceOptions['3857'].code)}
            disabled={projection === 3857}
          >
            <SignpostIcon />
            {t('basemaps.transport')}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-imagery"
            aria-label={t('basemaps.imagery') as string}
            tooltip={t('basemaps.imagery') as string}
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice(projectionChoiceOptions['3857'].code)}
            disabled={projection === 3978}
          >
            <SatelliteIcon />
            {t('basemaps.imagery')}
          </IconButton>
        </ListItem>
      </List>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    tooltip: 'mapnav.basemap',
    children: createElement(ProjectionIcon),
    tooltipPlacement: 'left',
  };

  const panel: TypePanelProps = {
    title: 'projection',
    icon: createElement(ProjectionIcon),
    content: renderButtons(),
    width: 'flex',
  };

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'projection', button, panel }} />;
}

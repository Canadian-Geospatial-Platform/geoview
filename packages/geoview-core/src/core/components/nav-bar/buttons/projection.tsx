import type { ReactNode } from 'react';
import { createElement, useCallback } from 'react';
import { useMapProjection, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import type { TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { List, ListItem } from '@/ui/list';
import { ProjectionIcon, PublicIcon } from '@/ui/icons';
import { useTranslation } from 'react-i18next';

const projectionChoiceOptions: {
  [key: string]: {
    code: TypeValidMapProjectionCodes;
    name: string;
  };
} = {
  '3857': { code: 3857, name: 'Web Mercator' },
  '3978': { code: 3978, name: 'LCC' },
};

/**
 * Create a projection select button to open the select panel, and set panel content
 * @returns {JSX.Element} the created basemap select button
 */
export default function Projection(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/projection');

  const { t } = useTranslation<string>();

  // Store
  const projection = useMapProjection();
  const { setProjection } = useMapStoreActions();

  /**
   * Handles map projection choice
   * @param {TypeValidMapProjectionCodes} projectionCode the projection code to switch to
   */
  const handleChoice = useCallback(
    (projectionCode: TypeValidMapProjectionCodes): void => {
      setProjection(projectionCode);
    },
    [setProjection]
  );

  /**
   * Render buttons in navbar panel.
   * @returns ReactNode
   */
  const renderButtons = (): ReactNode => {
    return (
      <List key="projectionButtons">
        <ListItem>
          <IconButton
            id="button-wm"
            aria-label={projectionChoiceOptions['3857'].name}
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice(projectionChoiceOptions['3857'].code)}
            disabled={projection === 3857}
          >
            <PublicIcon />
            {projectionChoiceOptions['3857'].name}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-lcc"
            aria-label={projectionChoiceOptions['3978'].name}
            tooltipPlacement="left"
            size="small"
            onClick={() => handleChoice(projectionChoiceOptions['3978'].code)}
            disabled={projection === 3978}
          >
            <PublicIcon />
            {projectionChoiceOptions['3978'].name}
          </IconButton>
        </ListItem>
      </List>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    'aria-label': t('mapnav.projection'),
    children: createElement(ProjectionIcon),
    tooltipPlacement: 'left',
  };

  const panel: TypePanelProps = {
    title: 'Projection',
    icon: createElement(ProjectionIcon),
    content: renderButtons(),
    width: 'flex',
  };

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'projection', button, panel }} />;
}

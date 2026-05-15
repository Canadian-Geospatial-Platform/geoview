import type { ReactNode, MouseEvent } from 'react';
import { createElement, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import type { TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import type { SxStyles } from '@/ui/style/types';
import { Button } from '@/ui/button/button';
import { List, ListItem } from '@/ui/list';
import { ProjectionIcon, PublicIcon } from '@/ui/icons';
import { logger } from '@/core/utils/logger';
import { useStoreMapCurrentProjection } from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useMapController } from '@/core/controllers/use-controllers';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';

/** Mapping of projection codes to their display names. */
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
 * Creates a projection select button to open the select panel.
 *
 * @returns The projection select button
 */
export default function Projection(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/projection');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const mapId = useStoreGeoViewMapId();

  // Store
  const projection = useStoreMapCurrentProjection();
  const mapController = useMapController();

  /**
   * Memoizes style classes for the projection component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('PROJECTION - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // #region Handlers

  /**
   * Handles map projection choice by extracting projection code from button ID.
   *
   * @param event - The button click event
   */
  const handleChoice = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      // Extract projection code from button ID (format: "mapId-proj-3857")
      const projCodeStr = event.currentTarget.id.split('-').pop();
      const projectionCode = Number(projCodeStr) as TypeValidMapProjectionCodes;

      // Runtime validation
      if (Number.isNaN(projectionCode)) {
        logger.logError('Invalid projection code in button ID');
        return;
      }

      if (!Object.values(projectionChoiceOptions).some((opt) => opt.code === projectionCode)) {
        logger.logError(`Unsupported projection code: ${projectionCode}`);
        return;
      }

      // Prevent action if this projection is already selected
      if (projection === projectionCode) return;

      mapController.setProjectionAndForget(projectionCode);

      // Keep focus on the button that was pressed
      event.currentTarget.focus();
    },
    [mapController, projection]
  );

  // #endregion Handlers

  /**
   * Renders the projection choice buttons.
   *
   * @returns The list of projection buttons
   */
  const renderButtons = (): ReactNode => {
    return (
      <List key="projectionButtons" role="group" aria-label={t('mapnav.projection')}>
        {Object.entries(projectionChoiceOptions).map(([key, proj]) => (
          <ListItem key={key}>
            <Button
              id={`${mapId}-proj-${proj.code}`}
              type="textWithIcon"
              startIcon={<PublicIcon />}
              size="small"
              onClick={handleChoice}
              aria-pressed={projection === proj.code}
              fullWidth
              sx={memoSxClasses.button}
            >
              {proj.name}
            </Button>
          </ListItem>
        ))}
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

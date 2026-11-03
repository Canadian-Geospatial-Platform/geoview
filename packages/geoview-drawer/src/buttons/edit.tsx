import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStoreDrawerIsEditing } from 'geoview-core/core/stores/states/drawer-state';

import { IconButton, EditIcon, EditOffIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

/** Properties for the Edit button. */
interface EditProps {
  /** The map-scoped id of the button, so keyboard editing can return focus to it. */
  id: string;
}

/**
 * Creates an edit button to toggle editing capabilities.
 *
 * @param props - Properties defined in EditProps interface
 * @returns The edit button element
 */
export default function Edit({ id }: EditProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/edit');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
  const isEditing = useStoreDrawerIsEditing();
  const drawerController = useDrawerController();

  /**
   * Handles a click on the edit button
   */
  const handleToggleEditing = (): void => {
    drawerController.toggleEditing();
  };

  return (
    <IconButton
      id={id}
      aria-label={t('drawer.edit')}
      tooltipPlacement="left"
      className={isEditing ? 'highlighted active' : ''}
      onClick={handleToggleEditing}
      sx={memoSxClasses.navButton}
    >
      {isEditing ? <EditOffIcon /> : <EditIcon />}
    </IconButton>
  );
}

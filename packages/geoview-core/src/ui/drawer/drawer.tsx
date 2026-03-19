import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import type { DrawerProps } from '@mui/material';
import { Drawer as MaterialDrawer, Box } from '@mui/material';

import { IconButton } from '@/ui/icon-button/icon-button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/ui/icons/index';
import { getSxClasses } from '@/ui/drawer/drawer-style';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Drawer component extending Material-UI's DrawerProps
 */
export interface DrawerPropsExtend extends DrawerProps {
  status?: boolean;
}

/**
 * Material-UI Drawer component with collapsible toggle functionality.
 *
 * Wraps Material-UI's Drawer to provide a slide-out side panel with built-in
 * toggle button for opening/closing. Supports status prop for controlled state.
 * Default variant is temporary (slides over content). All Material-UI Drawer props
 * are supported and passed through directly.
 *
 * @param props - Drawer configuration (see DrawerPropsExtend interface)
 * @returns Drawer component with toggle button and theme-aware styling
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Drawer>
 *   <List>
 *     <ListItem>Content</ListItem>
 *   </List>
 * </Drawer>
 *
 * // With controlled state
 * <Drawer
 *   status={isOpen}
 *   variant="permanent"
 * >
 *   <List>
 *     <ListItem>Drawer content</ListItem>
 *   </List>
 * </Drawer>
 *
 * // With custom styling
 * <Drawer
 *   className="custom-drawer"
 *   style={{ width: 240 }}
 * >
 *   <div>Drawer content</div>
 * </Drawer>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-drawer/}
 */
function DrawerUI(props: DrawerPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/drawer/drawer');

  // Get constant from props
  const { variant, status, className, style, children, ...rest } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [open, setOpen] = useState(false);

  // #region Handlers

  /**
   * Handles when the user toggles the drawer open/closed
   */
  const handleDrawerToggle = useCallback((drawerStatus: boolean): void => {
    logger.logTraceUseCallback('UI.DRAWER - handleDrawerToggle', drawerStatus);

    setOpen(drawerStatus);
  }, []);

  // #endregion

  // Update open state when status prop changes
  useEffect(() => {
    logger.logTraceUseEffect('UI.DRAWER - status', status);

    // set status from props if passed in
    if (status !== undefined) {
      setOpen(status);
    }
  }, [status]);

  return (
    <MaterialDrawer
      variant={variant || 'permanent'}
      sx={open ? sxClasses.drawerOpen : sxClasses.drawerClose}
      classes={{
        paper: className,
      }}
      style={style || undefined}
      {...rest}
    >
      <Box sx={sxClasses.toolbar}>
        <IconButton
          aria-label={open ? t('general.close') : t('general.open')}
          tooltipPlacement="right"
          onClick={() => {
            handleDrawerToggle(!open);
          }}
          size="large"
        >
          {!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      {children !== undefined && children}
    </MaterialDrawer>
  );
}

export const Drawer = DrawerUI;

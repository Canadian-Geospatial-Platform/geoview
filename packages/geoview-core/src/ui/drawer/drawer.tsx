import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { Drawer as MaterialDrawer, DrawerProps, Box } from '@mui/material';

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
 * Create a customized Material UI Drawer component.
 *
 * @component
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
 * @param {DrawerPropsExtend} props - The properties passed to the Drawer element
 * @returns {JSX.Element} The Drawer component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-drawer/}
 */
function DrawerUI(props: DrawerPropsExtend): JSX.Element {
  logger.logTraceRender('ui/drawer/drawer');

  // Get constant from props
  const { variant, status, className, style, children, ...rest } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [open, setOpen] = useState(false);

  // Memoize toggle handler
  const handleDrawerToggle = useCallback((drawerStatus: boolean): void => {
    logger.logTraceUseCallback('UI.DRAWER - handleDrawerToggle', drawerStatus);

    setOpen(drawerStatus);
  }, []);

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
          tooltip={open ? t('general.close')! : t('general.open')!}
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

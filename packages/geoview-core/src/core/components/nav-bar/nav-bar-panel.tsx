import { Fragment, useState, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './nav-bar-style';
import { Box, Popover, IconButton, ButtonGroup, DialogTitle, DialogContent } from '@/ui';
import { useAppFullscreenActive, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeButtonPanel } from '@/ui/panel/panel-types';

interface NavbarPanelType {
  buttonPanelGroups: Record<string, Record<string, TypeButtonPanel>>;
}

/**
 * Navbar modal component
 *
 * @returns {JSX.Element} the export modal component
 */
export default function NavbarPanel({ buttonPanelGroups }: NavbarPanelType): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation();

  const mapId = useGeoViewMapId();
  const geoviewElement = useAppGeoviewHTMLElement();
  const isMapFullScreen = useAppFullscreenActive();

  const shellContainer = geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;
  const [selectedButton, setSelectedButton] = useState<TypeButtonPanel | null>(null);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const id = open ? 'simple-popover' : undefined;

  const handleClick = (event: MouseEvent<HTMLElement>, buttonPanel: TypeButtonPanel): void => {
    setAnchorEl(event.currentTarget);
    setSelectedButton(buttonPanel);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  return (
    <>
      {Object.keys(buttonPanelGroups).map((groupName) => {
        const buttonPanelGroup = buttonPanelGroups[groupName];

        // if not an empty object, only then render any HTML
        if (Object.keys(buttonPanelGroup).length !== 0) {
          return (
            <Fragment key={groupName}>
              <ButtonGroup
                key={groupName}
                aria-label={t('mapnav.arianavbar')!}
                variant="contained"
                sx={sxClasses.navBtnGroup}
                orientation="vertical"
              >
                {Object.keys(buttonPanelGroup).map((buttonPanelKey) => {
                  const buttonPanel: TypeButtonPanel = buttonPanelGroup[buttonPanelKey];
                  // eslint-disable-next-line no-nested-ternary
                  return buttonPanel.button.visible ? (
                    !buttonPanel.panel ? (
                      <IconButton
                        key={buttonPanel.button.id}
                        id={buttonPanel.button.id}
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement={buttonPanel.button.tooltipPlacement}
                        sx={sxClasses.navButton}
                        onClick={buttonPanel.button.onClick}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    ) : (
                      <IconButton
                        key={buttonPanel.button.id}
                        id={buttonPanel.button.id}
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement={buttonPanel.button.tooltipPlacement}
                        sx={sxClasses.navButton}
                        onClick={(e) => handleClick(e, buttonPanel)}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    )
                  ) : null;
                })}
              </ButtonGroup>
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'center',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'center',
                  horizontal: 'right',
                }}
                onClose={handleClose}
                // popover will be displayed when screen is in fullscreen mode.
                {...(isMapFullScreen && { container: shellContainer })}
              >
                <Box sx={{ width: '400px', maxHeight: '500px' }}>
                  <DialogTitle>{(selectedButton?.panel?.title as string) ?? ''}</DialogTitle>
                  {/* <DialogContent>{selectedButton?.panel?.content ?? ''}</DialogContent> */}
                  <DialogContent dividers>
                    This is content,This is content,This is content,This is content,This is content,This is content,This is content,This is
                    content,This is content,This is content,This is content,This is content,This is content,This is content,This is content,
                    This is content,This is content,This is content,This is content,This is content,This is content,This is content, This is
                    content,This is content,This is content,This is content,This is content,This is content, This is content,This is
                    content,This is content,This is content,This is content,This is content,This is content, This is content,This is
                    content,This is content,This is content,This is content,This is content,This is content,This is content,This is
                    content,This is content, This is content,This is content,This is content,This is content,This is content,This is
                    content, This is content,This is content,This is content,This is content,This is content,This is content,This is
                    content, This is content,This is content,This is content,This is content,This is content,This is content,This is
                    content, This is content,This is content,This is content,This is content,This is content,This is content,This is
                    content,This is content, This is content,This is content,This is content,This is content,This is content,This is
                    content,This is content, This is content,This is content,This is content,This is content,
                  </DialogContent>
                </Box>
              </Popover>
            </Fragment>
          );
        }
        return null;
      })}
    </>
  );
}

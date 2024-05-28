import { useRef, useEffect, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import FocusTrap from 'focus-trap-react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { IconButton, CloseIcon, Box, TypePanelProps } from '..';
import { logger } from '@/core/utils/logger';

import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';
import { getSxClasses } from './panel-style';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
  panel: TypePanelProps;
  button: TypeIconButtonProps;

  // Callback when the user clicked the general close button
  onGeneralCloseClicked?: () => void;
  // Callback when the panel has completed opened (and transitioned in)
  onPanelOpened?: () => void;
  // Callback when the panel has been closed
  onPanelClosed?: () => void;
};

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export function Panel(props: TypePanelAppProps): JSX.Element {
  const { panel, button, onPanelOpened, onPanelClosed, onGeneralCloseClicked } = props;
  const { status: open, panelStyles } = panel;

  const { t } = useTranslation<string>();

  // Get the theme
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  // set the active trap value for FocusTrap
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelWidth = panel?.width ?? 350;
  const panelContainerStyles = {
    ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
    width: open ? panelWidth : 0,
    maxWidth: panel?.width ?? 400,
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 64px)',
      maxWidth: 'calc(100% - 64px)',
    },
    transition: `width ${theme.transitions.duration.standard}ms ease`,
    position: 'absolute',
    left: '64px',
    height: '100%',
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.PANEL - open');

    if (open) {
      // set focus on close button on panel open
      if (closeBtnRef && closeBtnRef.current) {
        (closeBtnRef.current as HTMLElement).focus();
      }

      // Wait the transition period (+50 ms just to be sure of shenanigans)
      setTimeout(() => {
        onPanelOpened?.();
      }, theme.transitions.duration.standard + 50);
    } else {
      // Wait the transition period (+50 ms just to be sure of shenanigans)
      setTimeout(() => {
        onPanelClosed?.();
      }, theme.transitions.duration.standard + 50);
    }
  }, [open, theme.transitions.duration.standard, onPanelOpened, onPanelClosed]);

  // TODO: refactor - remove comment in tsx for production build facebook/create-react-app#9507
  return (
    <Box sx={panelContainerStyles}>
      <FocusTrap
        active={activeTrapGeoView && open}
        focusTrapOptions={{
          escapeDeactivates: false,
          clickOutsideDeactivates: true,
        }}
      >
        <Card
          sx={{
            ...sxClasses.panelContainer,
            display: open ? 'block' : 'none',
            ...(panelStyles?.panelCard && { ...panelStyles.panelCard }),
          }}
          ref={panelRef as React.MutableRefObject<null>}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              onGeneralCloseClicked?.();
            }
          }}
          {...{ 'data-id': button.id }}
        >
          <CardHeader
            sx={panelStyles?.panelCardHeader ? { ...panelStyles.panelCardHeader } : {}}
            ref={panelHeader}
            title={t(panel.title as string)}
            titleTypographyProps={{
              component: 'h2',
            }}
            action={
              open ? (
                <IconButton
                  tooltip={t('general.close')!}
                  tooltipPlacement="right"
                  aria-label={t('general.close')!}
                  size="small"
                  onClick={() => onGeneralCloseClicked?.()}
                  iconRef={closeBtnRef}
                  className="cgpv-panel-close"
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                // eslint-disable-next-line react/jsx-no-useless-fragment
                <></>
              )
            }
          />

          <CardContent sx={{ ...sxClasses.panelContentContainer, ...(panelStyles ? panelStyles.panelCardContent : {}) }}>
            {typeof panel.content === 'string' ? <HtmlToReact htmlContent={panel.content} /> : panel.content}
          </CardContent>
        </Card>
      </FocusTrap>
    </Box>
  );
}

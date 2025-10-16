import type { KeyboardEvent } from 'react';
import { useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// TODO: reuse our own custom ui
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';

import { Box } from '@/ui/layout/index';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import { CloseIcon } from '@/ui/icons/index';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { getSxClasses } from '@/ui/panel/panel-style';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import { FocusTrapContainer } from '@/core/components/common';
import { delay } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
  panel: TypePanelProps;
  button: IconButtonPropsExtend;

  // Callback when the user clicked the general close button
  onGeneralClose?: () => void;
  // Callback when the panel has completed opened (and transitioned in)
  onOpen?: () => void;
  // Callback when the panel has been closed
  onClose?: () => void;
  // Callback when the panel has been closed by escape key
  onKeyDown?: (event: KeyboardEvent) => void;
};

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
function PanelUI(props: TypePanelAppProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/panel/panel');

  // Get constant from props
  const { panel, button, onOpen, onClose, onGeneralClose, onKeyDown, ...rest } = props;
  const { status: open = false, isFocusTrapped = false, panelStyles, panelGroupName } = panel;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // TODO: should the mapSize pass as props to remove link with store
  // Store
  const mapSize = useMapSize();

  // State
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLButtonElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelWidth = panel?.width ?? 400;

  // TODO: style - manage style in the sx classes, regroup height and width management
  const panelContainerStyles = {
    ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
    width: open ? panelWidth : 0,
    height: `calc(100%  - 40px)`,
    maxWidth: panel?.width ?? 400,
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 50px)',
      maxWidth: 'calc(100% - 50px)',
    },
    transition: `${theme.transitions.duration.standard}ms ease`,
    position: 'absolute',
    left: '50px',
  };

  useEffect(() => {
    logger.logTraceUseEffect('UI.PANEL - open');

    if (open) {
      // set focus on close button on panel open
      if (closeBtnRef && closeBtnRef.current) {
        (closeBtnRef.current as HTMLElement).focus();
      }

      // Wait the transition period (+50 ms just to be sure of shenanigans)
      delay(theme.transitions.duration.standard + 50)
        .then(() => {
          onOpen?.();
        })
        .catch(() => {
          logger.logPromiseFailed('in delay in UI.PANEL - open');
        });
    } else {
      // Wait the transition period (+50 ms just to be sure of shenanigans)
      delay(theme.transitions.duration.standard + 50)
        .then(() => {
          onClose?.();
        })
        .catch(() => {
          logger.logPromiseFailed('in delay in UI.PANEL - open');
        });
    }
  }, [open, theme.transitions.duration.standard, onOpen, onClose]);

  /**
   * Update the width of data table and layers panel when window is resize based on mapsize
   */
  useEffect(() => {
    logger.logTraceUseEffect('UI.PANEL - update width');

    // TODO: style - panel type or even width should be pass as props to remove dependency
    if (
      (panelGroupName === DEFAULT_APPBAR_CORE.DATA_TABLE || panelGroupName === DEFAULT_APPBAR_CORE.LAYERS) &&
      panelContainerRef.current &&
      open
    ) {
      panelContainerRef.current.style.width = `${mapSize[0]}px`;
      panelContainerRef.current.style.maxWidth = `${mapSize[0]}px`;
    } else {
      panelContainerRef.current?.removeAttribute('style');
    }
  }, [mapSize, panelGroupName, open]);

  return (
    <Box sx={panelContainerStyles} ref={panelContainerRef} className={`appbar-panel-${panelGroupName}`}>
      <FocusTrapContainer open={isFocusTrapped} id="app-bar-focus-trap">
        <Card
          sx={{
            ...sxClasses.panelContainer,
            display: open ? 'block' : 'none',
            ...(panelStyles?.panelCard && { ...panelStyles.panelCard }),
          }}
          ref={panelRef as React.MutableRefObject<null>}
          onKeyDown={(event: KeyboardEvent) => onKeyDown?.(event)}
          {...{ 'data-id': button.id }}
          {...rest}
        >
          <CardHeader
            sx={panelStyles?.panelCardHeader ? { ...panelStyles.panelCardHeader } : {}}
            ref={panelHeader}
            title={t(panel.title)}
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
                  onClick={() => onGeneralClose?.()}
                  iconRef={closeBtnRef}
                  className="cgpv-panel-close"
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                ''
              )
            }
          />

          <CardContent sx={{ ...sxClasses.panelContentContainer, ...(panelStyles ? panelStyles.panelCardContent : {}) }}>
            {typeof panel.content === 'string' ? <UseHtmlToReact htmlContent={panel.content} /> : panel.content}
          </CardContent>
        </Card>
      </FocusTrapContainer>
    </Box>
  );
}

export const Panel = PanelUI;

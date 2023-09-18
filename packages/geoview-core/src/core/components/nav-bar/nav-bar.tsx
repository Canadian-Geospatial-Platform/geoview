import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import Export from './buttons/export';
import Location from './buttons/location';

import ExportModal from '../export/export-modal';

import { api, payloadIsABoolean } from '@/app';
import { Panel, ButtonGroup, IconButton, Box } from '@/ui';

import { MapContext } from '@/core/app-start';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAButtonPanel, ButtonPanelPayload, PayloadBaseClass } from '@/api/events/payloads';
import { TypeButtonPanel } from '@/ui/panel/panel-types';

const navBtnWidth = '44px';
const navBtnHeight = '44px';

const useStyles = makeStyles((theme) => ({
  navBarRef: {
    position: 'absolute',
    right: theme.spacing(5),
    height: '600px',
    maxHeight: 'calc( 100% - 200px)',
    display: 'flex',
    flexDirection: 'row',
    marginRight: 0,
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transition: 'bottom 300ms ease-in-out',
  },
  navBtnGroupContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    pointerEvents: 'auto',
    justifyContent: 'end',
    overflowY: 'hidden',
    padding: 5,
  },
  navBtnGroup: {
    borderRadius: theme.spacing(5),
    '&:not(:last-child)': {
      marginBottom: theme.spacing(11),
    },
    '& .MuiButtonGroup-grouped:not(:last-child)': {
      borderColor: theme.navBar.borderColor,
    },
  },
  navBarButton: {
    backgroundColor: theme.navBar.btnDefaultBg,
    color: theme.navBar.btnDefaultColor,
    borderRadius: theme.spacing(5),
    width: navBtnWidth,
    height: navBtnHeight,
    maxWidth: navBtnWidth,
    minWidth: navBtnWidth,
    padding: 'initial',
    transition: 'background-color 0.3s ease-in-out',
    '&:not(:last-of-type)': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottom: `1px solid ${theme.navBar.borderColor}`,
    },
    '&:not(:first-of-type)': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    '&:hover': {
      backgroundColor: theme.navBar.btnHoverBg,
      color: theme.navBar.btnHoverColor,
    },
    '&:focus': {
      backgroundColor: theme.navBar.btnFocusBg,
      color: theme.navBar.btnFocusColor,
    },
    '&:active': {
      backgroundColor: theme.navBar.btnFocusBg,
      color: theme.navBar.btnActiveColor,
    },
  },
}));

/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export function Navbar(): JSX.Element {
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});
  const [ModalIsShown, setModalIsShown] = useState(false);
  const [footerBarExpanded, setFooterBarExpanded] = useState<boolean>(false);

  const classes = useStyles();

  const { t } = useTranslation<string>();

  const navBarRef = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;
  const { navBar } = api.maps[mapId].mapFeaturesConfig;

  const addButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      setButtonPanelGroups({
        ...buttonPanelGroups,
        [payload.appBarGroupName]: {
          ...buttonPanelGroups[payload.appBarGroupName],
          [payload.appBarId]: payload.buttonPanel as TypeButtonPanel,
        },
      });
    },
    [buttonPanelGroups]
  );

  const removeButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };

        const group = state[payload.appBarGroupName];

        delete group[payload.appBarId];

        return state;
      });
    },
    [setButtonPanelGroups]
  );

  const openModal = () => {
    setModalIsShown(true);
  };

  const closeModal = () => {
    setModalIsShown(false);
  };

  useEffect(() => {
    const navbarBtnPanelCreateListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) addButtonPanel(payload);
    };
    // listen to new nav-bar panel creation
    api.event.on(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, navbarBtnPanelCreateListenerFunction, mapId);

    const navbarBtnPanelRemoveListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) removeButtonPanel(payload);
    };
    // listen to new nav-bar panel removal
    api.event.on(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, navbarBtnPanelRemoveListenerFunction, mapId);

    const footerbarExpandCollapseListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsABoolean(payload)) setFooterBarExpanded(payload.status);
    };
    // listen to footerbar expand/collapse event
    api.event.on(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, footerbarExpandCollapseListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, mapId, navbarBtnPanelCreateListenerFunction);
      api.event.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, mapId, navbarBtnPanelRemoveListenerFunction);
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId, footerbarExpandCollapseListenerFunction);
    };
  }, [addButtonPanel, mapId, removeButtonPanel]);

  return (
    /** TODO - KenChase Need to add styling for scenario when more buttons that can fit vertically occurs (or limit number of buttons that can be added) */
    <Box ref={navBarRef} className={classes.navBarRef} sx={{ bottom: footerBarExpanded ? 80 : 40 }}>
      {Object.keys(buttonPanelGroups).map((groupName) => {
        const buttonPanelGroup = buttonPanelGroups[groupName];

        // display the panels in the list
        const panels = Object.keys(buttonPanelGroup).map((buttonPanelKey) => {
          const buttonPanel = buttonPanelGroup[buttonPanelKey];

          return buttonPanel.panel ? <Panel key={buttonPanel.button.id} button={buttonPanel.button} panel={buttonPanel.panel} /> : null;
        });

        if (panels.length > 0) {
          return <div key={groupName}>{panels}</div>;
        }
        return null;
      })}
      <div className={classes.navBtnGroupContainer}>
        {Object.keys(buttonPanelGroups).map((groupName) => {
          const buttonPanelGroup = buttonPanelGroups[groupName];

          // if not an empty object, only then render any HTML
          if (Object.keys(buttonPanelGroup).length !== 0) {
            return (
              <ButtonGroup
                key={groupName}
                orientation="vertical"
                aria-label={t('mapnav.arianavbar')!}
                variant="contained"
                classes={{ root: classes.navBtnGroup }}
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
                        className={classes.navBarButton}
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
                        className={classes.navBarButton}
                        onClick={() => {
                          if (!buttonPanel.panel?.status) {
                            buttonPanel.panel?.open();
                          } else {
                            buttonPanel.panel?.close();
                          }
                        }}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    )
                  ) : null;
                })}
              </ButtonGroup>
            );
          }
          return null;
        })}
        <ButtonGroup
          orientation="vertical"
          aria-label={t('mapnav.arianavbar')!}
          variant="contained"
          classes={{ root: classes.navBtnGroup }}
        >
          <ZoomIn className={classes.navBarButton} />
          <ZoomOut className={classes.navBarButton} />
        </ButtonGroup>
        <ButtonGroup
          orientation="vertical"
          aria-label={t('mapnav.arianavbar')!}
          variant="contained"
          classes={{ root: classes.navBtnGroup }}
        >
          {navBar?.includes('fullscreen') && <Fullscreen className={classes.navBarButton} />}
          {navBar?.includes('location') && <Location className={classes.navBarButton} />}
          {navBar?.includes('home') && <Home className={classes.navBarButton} />}
          {navBar?.includes('export') && <Export className={classes.navBarButton} openModal={openModal} />}
        </ButtonGroup>
        <ExportModal isShown={ModalIsShown} closeModal={closeModal} />
      </div>
    </Box>
  );
}

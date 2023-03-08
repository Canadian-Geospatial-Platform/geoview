import { useState, useRef, useEffect, useCallback, Fragment, useContext, SetStateAction, Dispatch } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { List, ListItem, Panel, IconButton } from '../../../ui';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';

import { MapContext } from '../../app-start';

import { payloadIsAButtonPanel, ButtonPanelPayload } from '../../../api/events/payloads/button-panel-payload';
import { TypeButtonPanel } from '../../../ui/panel/panel-types';

import Export from './buttons/export';
import ExportModal from '../export/export-modal';

const useStyles = makeStyles((theme) => ({
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '100%',
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    backgroundColor: theme.appBar.background,
  },
  appBarList: {
    width: 60,
    '& li': {
      backgroundColor: 'transparent',
      color: theme.palette.primary.light,
      justifyContent: 'center',
      margin: '16px 0',
      padding: 0,
      '&:hover': {
        backgroundColor: 'transparent',
        color: theme.palette.primary.light,
      },
    },
  },

  exportButtonDiv: {
    position: 'absolute',
    bottom: 0,
  },

  appBarButtons: {
    borderRightColor: theme.appBar.border,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    width: 64,
  },
  appBarButton: {
    backgroundColor: theme.appBar.btnDefaultBg,
    color: theme.palette.primary.light,
    height: 44,
    width: 44,
    transition: 'background-color 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: theme.appBar.btnHoverBg,
      color: theme.palette.primary.light,
    },
    '&:focus': {
      backgroundColor: theme.appBar.btnFocusBg,
      color: theme.palette.primary.light,
    },
    '&:active': {
      backgroundColor: theme.appBar.btnActiveBg,
      color: theme.palette.primary.light,
    },
    '&.active': {
      backgroundColor: theme.appBar.btnActiveBg,
      color: theme.palette.background.paper,
    },
    '& .MuiSvgIcon-root': {
      height: 20,
      width: 20,
    },
  },
  appBarButtonIcon: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.light,
  },
  appBarPanels: {},
}));

type AppbarProps = {
  setActivetrap: Dispatch<SetStateAction<boolean>>;
};
/**
 * Create an app-bar with buttons that can open a panel
 */
export function Appbar({ setActivetrap }: AppbarProps): JSX.Element {
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});
  const [ModalIsShown, setModalIsShown] = useState(false);
  const [selectedAppBarButtonId, setSelectedAppbarButtonId] = useState<string>('');

  const classes = useStyles();

  const appBar = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const openModal = () => {
    setModalIsShown(true);
    // this will remove the focus active trap from map and focus will be on export modal
    setActivetrap(false);
  };

  const closeModal = () => {
    setModalIsShown(false);
    // this will add back focus active trap from map and focus will be on export modal
    setActivetrap(true);
  };

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

  useEffect(() => {
    // listen to new panel creation
    api.event.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          addButtonPanel(payload);
        }
      },
      mapId
    );

    // listen on panel removal
    api.event.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          removeButtonPanel(payload);
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE,
      () => {
        setSelectedAppbarButtonId('');
      },
      `${mapId}/${selectedAppBarButtonId}`
    );

    return () => {
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, mapId);
    };
  }, [addButtonPanel, mapId, removeButtonPanel, selectedAppBarButtonId]);

  return (
    <div className={classes.appBar} ref={appBar}>
      {Object.keys(api.map(mapId).appBarButtons.getAllButtonPanels()).filter((buttonPanel) => {
        return api.map(mapId).appBarButtons.getAllButtonPanels()[buttonPanel].button?.visible;
      }).length > 0 && (
        <div className={classes.appBarButtons}>
          {Object.keys(buttonPanelGroups).map((groupName: string) => {
            // get button panels from group
            const buttonPanels = buttonPanelGroups[groupName];

            // display the button panels in the list
            return (
              <List key={groupName} className={classes.appBarList}>
                {Object.keys(buttonPanels).map((buttonPanelsKey) => {
                  const buttonPanel = buttonPanels[buttonPanelsKey];
                  return buttonPanel?.button.visible !== undefined && buttonPanel?.button.visible ? (
                    <Fragment key={buttonPanel.button.id}>
                      <ListItem>
                        <IconButton
                          id={buttonPanel.button.id}
                          aria-label={buttonPanel.button.tooltip}
                          tooltip={buttonPanel.button.tooltip}
                          tooltipPlacement="right"
                          className={`${classes.appBarButton} ${selectedAppBarButtonId === buttonPanel.button.id ? 'active' : ''}`}
                          size="small"
                          onClick={() => {
                            if (!buttonPanel.panel?.status) {
                              buttonPanel.panel?.open();
                              setSelectedAppbarButtonId(buttonPanel?.button?.id ?? '');
                            } else {
                              buttonPanel.panel?.close();
                              setSelectedAppbarButtonId('');
                            }
                          }}
                        >
                          {buttonPanel.button.children}
                        </IconButton>
                      </ListItem>
                    </Fragment>
                  ) : null;
                })}
              </List>
            );
          })}
          <div className={classes.exportButtonDiv}>
            <List className={classes.appBarList}>
              <ListItem>
                <Export className={`${classes.appBarButton} ${ModalIsShown ? 'active' : ''}`} openModal={openModal} />
              </ListItem>
            </List>
          </div>
        </div>
      )}
      {Object.keys(buttonPanelGroups).map((groupName: string) => {
        // get button panels from group
        const buttonPanels = buttonPanelGroups[groupName];

        // display the panels in the list
        return (
          <Fragment key={groupName}>
            {Object.keys(buttonPanels).map((buttonPanelsKey) => {
              const buttonPanel = buttonPanels[buttonPanelsKey];
              return buttonPanel?.panel ? (
                <Panel key={buttonPanel.panel.panelId} panel={buttonPanel.panel} button={buttonPanel.button} />
              ) : null;
            })}
          </Fragment>
        );
      })}
      <ExportModal isShown={ModalIsShown} closeModal={closeModal} />
    </div>
  );
}

import { useState, useRef, useEffect, useCallback, Fragment, useContext, SetStateAction, Dispatch } from 'react';
import { Box, useTheme } from '@mui/material';

import { List, ListItem, Panel, IconButton } from '@/ui';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { MapContext, TypeMapContext } from '@/core/app-start';

import { payloadIsAButtonPanel, ButtonPanelPayload, PayloadBaseClass } from '@/api/events/payloads';
import { TypeButtonPanel } from '@/ui/panel/panel-types';

import Export from './buttons/export';
import Geolocator from './buttons/geolocator';
import Notifications from '@/core/components/notifications/notifications';
import Version from './buttons/version';
import ExportModal from '../export/export-modal';
import { getSxClasses } from './app-bar-style';

type AppbarProps = {
  activeTrap: boolean;
  activeTrapSet: Dispatch<SetStateAction<boolean>>;
};

/**
 * Create an app-bar with buttons that can open a panel
 */
export function Appbar({ activeTrap, activeTrapSet }: AppbarProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});
  const [ModalIsShown, setModalIsShown] = useState(false);
  const [selectedAppBarButtonId, setSelectedAppbarButtonId] = useState<string>('');

  const appBar = useRef<HTMLDivElement>(null);

  const mapContext = useContext(MapContext);

  const { mapFeaturesConfig, mapId } = mapContext as Required<TypeMapContext>;
  const trapActive = useRef<boolean>(activeTrap);

  const openModal = () => {
    setModalIsShown(true);
    trapActive.current = activeTrap;
    // this will remove the focus active trap from map and focus will be on export modal
    activeTrapSet(false);
  };

  const closeModal = () => {
    setModalIsShown(false);
    activeTrapSet(trapActive.current);
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

  const appBarPanelCloseListenerFunction = () => setSelectedAppbarButtonId('');

  useEffect(() => {
    const appBarPanelCreateListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) addButtonPanel(payload);
    };
    // listen to new panel creation
    api.event.on(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, appBarPanelCreateListenerFunction, mapId);

    const appBarPanelRemoveListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) removeButtonPanel(payload);
    };

    // listen on panel removal
    api.event.on(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, appBarPanelRemoveListenerFunction, mapId);

    // listen on panel close
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, appBarPanelCloseListenerFunction, `${mapId}/${selectedAppBarButtonId}`);

    return () => {
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId, appBarPanelCreateListenerFunction);
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId, appBarPanelRemoveListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, mapId, appBarPanelCloseListenerFunction);
    };
  }, [addButtonPanel, mapId, removeButtonPanel, selectedAppBarButtonId]);

  return (
    <Box sx={sxClasses.appBar} ref={appBar}>
      <Box sx={sxClasses.appBarButtons}>
        {mapFeaturesConfig.appBar?.includes('geolocator') && mapFeaturesConfig?.map.interaction === 'dynamic' && (
          <Box>
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <Geolocator sx={sxClasses.appBarButton} mapId={mapId} />
              </ListItem>
            </List>
          </Box>
        )}

        {Object.keys(buttonPanelGroups).map((groupName: string) => {
          // get button panels from group
          const buttonPanels = buttonPanelGroups[groupName];

          // display the button panels in the list
          return (
            <List key={groupName} sx={sxClasses.appBarList}>
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
                        className={`${sxClasses.appBarButton} ${selectedAppBarButtonId === buttonPanel.button.id ? 'active' : ''}`}
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
        {mapFeaturesConfig.appBar?.includes('export') && (
          <Box>
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <Export className={`${sxClasses.appBarButton} ${ModalIsShown ? 'active' : ''}`} openModal={openModal} />
              </ListItem>
            </List>
          </Box>
        )}
        <Box sx={sxClasses.versionButtonDiv}>
          <List sx={sxClasses.appBarList}>
            <hr />
            <ListItem>
              <Notifications />
            </ListItem>
            <ListItem>
              <Version />
            </ListItem>
          </List>
        </Box>
      </Box>
      {Object.keys(buttonPanelGroups).map((groupName: string) => {
        // get button panels from group
        const buttonPanels = buttonPanelGroups[groupName];

        // display the panels in the list
        return (
          <Fragment key={groupName}>
            {Object.keys(buttonPanels).map((buttonPanelsKey) => {
              const buttonPanel = buttonPanels[buttonPanelsKey];
              return buttonPanel?.panel ? (
                <Panel
                  key={buttonPanel.panel.panelId}
                  panel={buttonPanel.panel}
                  button={buttonPanel.button}
                  handlePanelOpened={buttonPanel.handlePanelOpened}
                />
              ) : null;
            })}
          </Fragment>
        );
      })}
      <ExportModal isShown={ModalIsShown} closeModal={closeModal} />
    </Box>
  );
}

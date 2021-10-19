import { useState, useRef, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Drawer, List, Divider, IconButton, Tooltip, Fade } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { DomEvent } from 'leaflet';
import { useMap } from 'react-leaflet';

import Version from './buttons/version';

import ButtonApp from './button';
import PanelApp from '../panel/panel';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import { CONST_PANEL_TYPES } from '../../types/cgpv-types';

const drawerWidth = 200;

const useStyles = makeStyles((theme) => ({
    appBar: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: '100%',
        margin: theme.spacing(2, 2),
        border: '2px solid rgba(0, 0, 0, 0.2)',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
    },
    drawerOpen: {
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerClose: {
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowX: 'hidden',
        width: '61px',
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1),
    },
    spacer: {
        flexGrow: 1,
        backgroundColor: theme.palette.primary.main,
    },
}));

/**
 * Create an appbar with buttons that can open a panel
 */
export function Appbar(): JSX.Element {
    const [open, setOpen] = useState(false);
    const [buttonPanelId, setButtonPanelId] = useState<string>();
    const [panelOpen, setPanelOpen] = useState(false);
    const [, setPanelCount] = useState(0);

    const { t } = useTranslation<string>();

    const classes = useStyles();

    const map = useMap();

    const appBar = useRef<HTMLDivElement>(null);

    const mapId = api.mapInstance(map).id;

    /**
     * function that causes rerender when adding a new panel
     */
    const updatePanelCount = useCallback(() => {
        setPanelCount((count) => count + 1);
    }, []);

    /**
     * Open / Close the panel
     * @param {boolean} status status of the panel
     */
    const openClosePanel = (status: boolean): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE, mapId, {
            panelType: CONST_PANEL_TYPES.APPBAR,
            handlerId: mapId,
            status,
        });

        // if appbar is open then close it
        if (open) setOpen(false);
    };

    const openCloseDrawer = (status: boolean): void => {
        setOpen(status);

        // if panel is open then close it
        if (panelOpen) openClosePanel(false);

        // emit an api event when drawer opens/closes
        api.event.emit(EVENT_NAMES.EVENT_DRAWER_OPEN_CLOSE, mapId, {
            status: open,
        });
    };

    useEffect(() => {
        const appBarChildren = appBar.current?.children[0] as HTMLElement;
        // disable events on container
        DomEvent.disableClickPropagation(appBarChildren);
        DomEvent.disableScrollPropagation(appBarChildren);

        // listen to panel open/close events
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE,
            (payload) => {
                if (payload && payload.handlerId === mapId && payload.panelType === CONST_PANEL_TYPES.APPBAR) setPanelOpen(payload.status);
            },
            mapId
        );

        // listen to new panel creation
        api.event.on(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, () => {
            updatePanelCount();
        });

        // listen on panel removal
        api.event.on(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, () => {
            updatePanelCount();
        });

        // listen to event when a request to open a panel
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN,
            (args) => {
                if (args.handlerId === mapId) {
                    const buttonPanel = Object.keys(api.map(mapId).buttonPanel.appBarPanels).map((groupName: string) => {
                        const buttonPanels = api.map(mapId).buttonPanel.appBarPanels[groupName];

                        return buttonPanels[args.buttonId];
                    })[0];

                    if (buttonPanel) {
                        setButtonPanelId(buttonPanel.button.id);
                        openClosePanel(!panelOpen);
                    }
                }
            },
            mapId
        );

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN);
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE);
            api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE);
            api.event.off(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={classes.appBar} ref={appBar}>
            <Drawer
                variant="permanent"
                className={open ? classes.drawerOpen : classes.drawerClose}
                classes={{ paper: open ? classes.drawerOpen : classes.drawerClose }}
            >
                <div className={classes.toolbar}>
                    <Tooltip title={open ? t('general.close') : t('general.open')} placement="right" TransitionComponent={Fade}>
                        <IconButton
                            onClick={() => {
                                openCloseDrawer(!open);
                            }}
                        >
                            {!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        </IconButton>
                    </Tooltip>
                </div>
                <Divider />
                <List>
                    {Object.keys(api.mapInstance(map).buttonPanel.appBarPanels).map((groupName: string) => {
                        // get button panels from group
                        const buttonPanels = api.mapInstance(map).buttonPanel.appBarPanels[groupName];

                        // display the button panels in the list
                        return (
                            <div key={groupName}>
                                {Object.keys(buttonPanels).map((buttonId) => {
                                    const buttonPanel = buttonPanels[buttonId];

                                    return buttonPanel.button.visible ? (
                                        <div key={buttonPanel.button.id}>
                                            <ButtonApp
                                                tooltip={buttonPanel.button.tooltip}
                                                icon={buttonPanel.button.icon}
                                                id={buttonPanel.button.id}
                                                onClickFunction={() => {
                                                    setButtonPanelId(buttonPanel.button.id);
                                                    openClosePanel(!panelOpen);
                                                }}
                                            />
                                            <Divider className={classes.spacer} />
                                            <Divider />
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        );
                    })}
                </List>
                <Divider className={classes.spacer} />
                <Divider />
                <List>
                    <Version />
                </List>
            </Drawer>
            {Object.keys(api.mapInstance(map).buttonPanel.appBarPanels).map((groupName: string) => {
                // get button panels from group
                const buttonPanels = api.mapInstance(map).buttonPanel.appBarPanels[groupName];

                // display the panels in the list
                return (
                    <div key={groupName}>
                        {Object.keys(buttonPanels).map((buttonId) => {
                            const buttonPanel = buttonPanels[buttonId];

                            const isOpen = buttonPanelId === buttonPanel.button.id && panelOpen;

                            return buttonPanel.panel ? (
                                <PanelApp
                                    key={buttonPanel.button.id}
                                    panel={buttonPanel.panel}
                                    button={buttonPanel.button}
                                    panelOpen={isOpen}
                                />
                            ) : null;
                        })}
                    </div>
                );
            })}
        </div>
    );
}

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

import { MapInterface } from '../../common/map-viewer';
import { PanelType } from '../../common/panel';
import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

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

export function Appbar(): JSX.Element {
    const [open, setOpen] = useState(false);
    const [panel, setPanel] = useState<PanelType>();
    const [panelOpen, setPanelOpen] = useState(false);
    const [, setPanelCount] = useState(0);

    const { t } = useTranslation();

    const classes = useStyles();

    const map = useMap();

    const appBar = useRef();

    const mapId = (api.mapInstance(map) as MapInterface).id;

    /**
     * function that causes rerender when adding a new panel
     */
    const updatePanelCount = useCallback(() => {
        setPanelCount((count) => count + 1);
    }, []);

    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation(appBar.current.children[0] as HTMLElement);
        DomEvent.disableScrollPropagation(appBar.current.children[0] as HTMLElement);

        // listen to panel open/close events
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE,
            (payload) => {
                if (payload && payload.handlerId === mapId) setPanelOpen(payload.status);
            },
            mapId
        );

        // listen to new panel creation
        api.event.on(EVENT_NAMES.EVENT_PANEL_CREATE, () => {
            updatePanelCount();
        });

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE);
            api.event.off(EVENT_NAMES.EVENT_PANEL_CREATE);
        };
    }, []);

    const openClosePanel = (status: boolean): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE, mapId, {
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

    return (
        <div className={classes.appBar} ref={appBar}>
            <Drawer
                variant="permanent"
                className={open ? classes.drawerOpen : classes.drawerClose}
                classes={{ paper: open ? classes.drawerOpen : classes.drawerClose }}
            >
                <div className={classes.toolbar}>
                    <Tooltip title={t('close')} placement="right" TransitionComponent={Fade}>
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
                    {api.mapInstance(map).panels.map((sPanel: PanelType) => {
                        return (
                            <ButtonApp
                                key={sPanel.id}
                                tooltip={sPanel.buttonTooltip}
                                icon={sPanel.buttonIcon}
                                onClickFunction={() => {
                                    setPanel(sPanel);
                                    openClosePanel(true);
                                }}
                            />
                        );
                    })}
                </List>
                <Divider className={classes.spacer} />
                <Divider />
                <List>
                    <Version />
                </List>
            </Drawer>
            {panel && panelOpen && <PanelApp panel={panel} />}
        </div>
    );
}

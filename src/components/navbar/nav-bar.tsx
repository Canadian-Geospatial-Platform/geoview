import { useCallback, useEffect, useRef, useState } from 'react';

import { DomEvent } from 'leaflet';

import { useMap } from 'react-leaflet';

import { useTranslation } from 'react-i18next';

import { ButtonGroup } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';

import { LEAFLET_POSITION_CLASSES } from '../../common/constant';
import { api } from '../../api/api';
import { ButtonPanel, ButtonPanelType } from '../../common/ui/button-panel';
import { ButtonMapNav } from './button';
import { EVENT_NAMES } from '../../api/event';
import { Button } from '../../common/ui/button';
import { PANEL_TYPES } from '../../common/ui/panel';
import PanelApp from '../panel/panel';

const useStyles = makeStyles((theme) => ({
    navBar: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: theme.spacing(14),
        zIndex: theme.zIndex.appBar,
    },
    root: {
        display: 'flex',
        overflow: 'auto',
        '& > *': {
            margin: theme.spacing(3),
        },
        '& .MuiButtonGroup-vertical': {
            width: '32px',
            '& button': {
                minWidth: '32px',
            },
        },
        position: 'relative',
        flexDirection: 'column',
        pointerEvents: 'auto',
    },
}));

/**
 * Create a navbar with buttons that can call functions or open custom panels
 */
export function NavBar(): JSX.Element {
    const [panel, setPanel] = useState<ButtonPanelType>();
    const [panelOpen, setPanelOpen] = useState(false);

    const [, setButtonCount] = useState(0);

    const classes = useStyles();
    const { t } = useTranslation();

    const navBar = useRef();

    const map = useMap();

    const mapId = (api.mapInstance(map) as MapInterface).id;

    /**
     * function that causes rerender when adding a new button, button panel
     */
    const updatePanelCount = useCallback(() => {
        setButtonCount((count) => count + 1);
    }, []);

    /**
     * Open or close the panel
     *
     * @param {boolean} status the status of the panel
     */
    const openClosePanel = (status: boolean): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE, mapId, {
            panelType: PANEL_TYPES.NAVBAR,
            handlerId: mapId,
            status,
        });
    };

    /**
     * listen to events to open/close the panel and to create the buttons
     */
    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation(navBar.current.children[0] as HTMLElement);
        DomEvent.disableScrollPropagation(navBar.current.children[0] as HTMLElement);

        // listen to panel open/close events
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE,
            (payload) => {
                if (payload && payload.handlerId === mapId && payload.panelType === PANEL_TYPES.NAVBAR) setPanelOpen(payload.status);
            },
            mapId
        );

        // listen to event when a request to open a panel
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN,
            (args) => {
                if (args.handlerId === mapId) {
                    const buttonPanel = Object.keys((api.map(mapId) as ButtonPanel).navBarButtons).map((groupName: string) => {
                        const buttonPanels: ButtonPanelType[] = (api.map(mapId) as ButtonPanel).navBarButtons[groupName];

                        return buttonPanels.filter((bPanel: ButtonPanelType) => {
                            return args.buttonId === bPanel.button.id;
                        })[0];
                    })[0];

                    setPanel(buttonPanel);
                    openClosePanel(true);
                }
            },
            mapId
        );

        // listen to new navbar panel creation
        api.event.on(EVENT_NAMES.EVENT_NAVBAR_PANEL_CREATE, () => {
            updatePanelCount();
        });

        // listen to new navbar button creation
        api.event.on(EVENT_NAMES.EVENT_NAVBAR_BUTTON_CREATE, () => {
            updatePanelCount();
        });

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN);
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE);
            api.event.off(EVENT_NAMES.EVENT_NAVBAR_PANEL_CREATE);
            api.event.off(EVENT_NAMES.EVENT_NAVBAR_BUTTON_CREATE);
        };
    }, []);

    return (
        <div ref={navBar} className={`${LEAFLET_POSITION_CLASSES.bottomright} ${classes.navBar}`}>
            {panel && panelOpen && <PanelApp panel={panel.panel} />}
            <div className={classes.root}>
                {Object.keys((api.mapInstance(map) as ButtonPanel).navBarButtons).map((groupName) => {
                    const buttons = (api.mapInstance(map) as ButtonPanel).navBarButtons[groupName];

                    return (
                        <ButtonGroup key={groupName} orientation="vertical" aria-label={t('mapnav.ariaNavbar')} variant="contained">
                            {buttons.map((buttonPanel: Button | ButtonPanelType) => {
                                return buttonPanel instanceof Button ? (
                                    <ButtonMapNav
                                        key={buttonPanel.id}
                                        tooltip={buttonPanel.tooltip}
                                        icon={buttonPanel.icon}
                                        onClickFunction={() => {
                                            if (buttonPanel.callback) buttonPanel.callback();
                                        }}
                                    />
                                ) : (
                                    <ButtonMapNav
                                        key={buttonPanel.button.id}
                                        tooltip={buttonPanel.button.tooltip}
                                        icon={buttonPanel.button.icon}
                                        onClickFunction={() => {
                                            setPanel(buttonPanel);
                                            openClosePanel(true);
                                        }}
                                    />
                                );
                            })}
                        </ButtonGroup>
                    );
                })}
                <ButtonGroup orientation="vertical" aria-label={t('mapnav.ariaNavbar')} variant="contained">
                    <ZoomIn />
                    <ZoomOut />
                </ButtonGroup>
                <ButtonGroup orientation="vertical" aria-label={t('mapnav.ariaNavbar', '')} variant="contained">
                    <Fullscreen />
                    <Home />
                </ButtonGroup>
            </div>
        </div>
    );
}

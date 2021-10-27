/* eslint-disable react-hooks/exhaustive-deps */
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
import { ButtonPanel } from '../../common/ui/button-panel';
import { ButtonMapNav } from './button';
import { EVENT_NAMES } from '../../api/event';
import PanelApp from '../panel/panel';
import { Cast, TypeButtonPanel, CONST_PANEL_TYPES } from '../../types/cgpv-types';

const useStyles = makeStyles((theme) => ({
    navBarRef: {
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
    const [buttonPanelId, setButtonPanelId] = useState<string>();
    const [panelOpen, setPanelOpen] = useState(false);

    const [, setButtonCount] = useState(0);

    const classes = useStyles();
    const { t } = useTranslation<string>();

    const navBarRef = useRef<HTMLDivElement>(null);

    const map = useMap();

    const mapId = api.mapInstance(map).id;
    const buttonPanelApi = api.map(mapId).buttonPanel;

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
            panelType: CONST_PANEL_TYPES.NAVBAR,
            handlerId: mapId,
            status,
        });
    };

    /**
     * listen to events to open/close the panel and to create the buttons
     */
    useEffect(() => {
        // disable events on container
        const navBarChildrenHTMLElements = Cast<HTMLElement[]>(navBarRef.current?.children);
        DomEvent.disableClickPropagation(navBarChildrenHTMLElements[0]);
        DomEvent.disableScrollPropagation(navBarChildrenHTMLElements[0]);

        // listen to panel open/close events
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE,
            (payload) => {
                if (payload && payload.handlerId === mapId && payload.panelType === CONST_PANEL_TYPES.NAVBAR) setPanelOpen(payload.status);
            },
            mapId
        );

        // listen to event when a request to open a panel
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN,
            (args) => {
                if (args.handlerId === mapId) {
                    const buttonPanel = Object.keys(buttonPanelApi.navBarButtons).map((groupName: string) => {
                        const buttonPanels = buttonPanelApi.navBarButtons[groupName];

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

        // listen to new navbar panel creation
        api.event.on(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_CREATE, () => {
            updatePanelCount();
        });

        // listen to new navbar panel removal
        api.event.on(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, () => {
            updatePanelCount();
        });

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN);
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE);
            api.event.off(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_CREATE);
            api.event.off(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_REMOVE);
        };
    }, []);

    return (
        <div ref={navBarRef} className={`${LEAFLET_POSITION_CLASSES.bottomright} ${classes.navBarRef}`}>
            {Object.keys(buttonPanelApi.navBarButtons).map((groupName) => {
                const buttons = buttonPanelApi.navBarButtons[groupName];

                // display the panels in the list
                return (
                    <div key={groupName}>
                        {Object.keys(buttons).map((buttonId) => {
                            const buttonPanel = buttons[buttonId];

                            const isOpen = buttonPanelId === buttonPanel.button.id && panelOpen;

                            return buttonPanel.panel ? (
                                <PanelApp
                                    key={buttonPanel.button.id}
                                    button={buttonPanel.button}
                                    panel={buttonPanel.panel}
                                    panelOpen={isOpen}
                                />
                            ) : null;
                        })}
                    </div>
                );
            })}
            <div className={classes.root}>
                {Object.keys(buttonPanelApi.navBarButtons).map((groupName) => {
                    const buttons = buttonPanelApi.navBarButtons[groupName];

                    return (
                        <ButtonGroup key={groupName} orientation="vertical" aria-label={t('mapnav.arianavbar')} variant="contained">
                            {Object.keys(buttons).map((buttonId) => {
                                const buttonPanel: TypeButtonPanel = buttons[buttonId];
                                // eslint-disable-next-line no-nested-ternary
                                return buttonPanel.button.visible ? (
                                    !buttonPanel.panel ? (
                                        <ButtonMapNav
                                            key={buttonPanel.button.id}
                                            tooltip={buttonPanel.button.tooltip}
                                            icon={buttonPanel.button.icon}
                                            onClickFunction={() => {
                                                if (buttonPanel.button.callback) buttonPanel.button.callback();
                                            }}
                                        />
                                    ) : (
                                        <ButtonMapNav
                                            key={buttonPanel.button.id}
                                            tooltip={buttonPanel.button.tooltip}
                                            icon={buttonPanel.button.icon}
                                            onClickFunction={() => {
                                                setButtonPanelId(buttonPanel.button.id);
                                                openClosePanel(!panelOpen);
                                            }}
                                        />
                                    )
                                ) : null;
                            })}
                        </ButtonGroup>
                    );
                })}
                <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar')} variant="contained">
                    <ZoomIn />
                    <ZoomOut />
                </ButtonGroup>
                <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar', '')} variant="contained">
                    <Fullscreen />
                    <Home />
                </ButtonGroup>
            </div>
        </div>
    );
}

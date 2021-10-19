/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { DomEvent } from 'leaflet';

import { useMap } from 'react-leaflet';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Card, CardHeader, CardContent, Divider, IconButton, Tooltip, Fade } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import FocusTrap from 'focus-trap-react';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import { HtmlToReact } from '../../common/containers/html-to-react';
import { styles } from '../../assests/style/theme';
import { Cast, TypePanelAppProps } from '../../types/cgpv-types';

const useStyles = makeStyles((theme) => ({
    root: {
        maxWidth: 600,
        minWidth: 300,
        height: '100%',
        marginLeft: theme.spacing(2),
        borderRadius: 0,
        [theme.breakpoints.down('xs')]: {
            width: 'auto !important',
            minWidth: 100,
        },
    },
    cardContainer: {
        height: '100%',
        overflow: 'hidden',
        overflowY: 'auto',
        paddingBottom: '10px !important',
        boxSizing: 'border-box',
    },
    avatar: {
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(3, 7),
    },
}));

/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 */
export default function PanelApp(props: TypePanelAppProps): JSX.Element {
    const { panel, button, panelOpen } = props;

    // set the active trap value for FocusTrap
    const [activeTrap, setActivetrap] = useState(false);

    const [actionButtons, setActionButtons] = useState<JSX.Element[] & React.ReactNode[]>([]);
    const [, updatePanelContent] = useState(0);

    const classes = useStyles(props);
    const { t } = useTranslation<string>();

    const map = useMap();
    const mapId = api.mapInstance(map).id;

    const panelRef = useRef<HTMLElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    /**
     * function that causes rerender when changing panel content
     */
    const updateComponent = useCallback(() => {
        updatePanelContent((count) => count + 1);
    }, []);

    /**
     * Close the panel
     */
    function closePanel(): void {
        setActivetrap(false);

        // set panel status to false
        panel.status = false;

        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE, mapId, {
            // used to tell which panel type has been closed
            panelType: panel.type,
            // used when checking which panel was closed from which map
            handlerId: mapId,
            // status of panel (false = closed)
            status: false,
        });

        // emit an event to hide the marker when using the details panel
        api.event.emit(EVENT_NAMES.EVENT_MARKER_ICON_HIDE, mapId, {});

        const buttonElement = document.getElementById(panel.buttonId);

        if (buttonElement) {
            // put back focus on calling button
            document.getElementById(panel.buttonId)?.focus();
        } else {
            const mapCont = map.getContainer();
            mapCont.focus();

            // if in focus trap mode, trigger the event
            if (mapCont.closest('.llwp-map')?.classList.contains('map-focus-trap')) {
                mapCont.classList.add('keyboard-focus');
                api.event.emit(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, `leaflet-map-${mapId}`, {});
            }
        }
    }

    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation(panelRef.current as HTMLElement);
        DomEvent.disableScrollPropagation(panelRef.current as HTMLElement);

        api.event.on(
            EVENT_NAMES.EVENT_PANEL_CLOSE,
            (args) => {
                if (args.buttonId === panel.buttonId) closePanel();
            },
            mapId
        );

        // listen to add action button event
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_ADD_ACTION,
            (args) => {
                if (args.buttonId === panel.buttonId) {
                    const { actionButton } = args;

                    setActionButtons((prev) => [
                        ...prev,
                        <Tooltip
                            id={actionButton.id}
                            key={actionButton.id}
                            title={actionButton.title}
                            placement="right"
                            TransitionComponent={Fade}
                        >
                            <IconButton
                                id={actionButton.id}
                                className="cgpv-panel-close"
                                aria-label={actionButton.title}
                                onClick={actionButton.action}
                            >
                                {typeof actionButton.icon === 'string' ? (
                                    <HtmlToReact
                                        style={{
                                            display: 'flex',
                                        }}
                                        htmlContent={actionButton.icon}
                                    />
                                ) : typeof actionButton.icon === 'object' ? (
                                    actionButton.icon
                                ) : (
                                    <actionButton.icon />
                                )}
                            </IconButton>
                        </Tooltip>,
                    ]);
                }
            },
            mapId
        );

        // listen to remove action button event
        api.event.on(EVENT_NAMES.EVENT_PANEL_REMOVE_ACTION, (args) => {
            if (args.buttonId === panel.buttonId) {
                const { actionButtonId } = args;
                setActionButtons((list) =>
                    list.filter((item) => {
                        return item.props.id !== actionButtonId;
                    })
                );
            }
        });

        // listen to change panel content and rerender
        api.event.on(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT, (args) => {
            // set focus on close button on panel content change
            setTimeout(() => Cast<HTMLElement>(closeBtnRef.current).focus(), 100);

            if (args.buttonId === panel.buttonId) {
                updateComponent();
            }
        });

        // listen to open panel to activate focus trap and focus on close
        api.event.on(
            EVENT_NAMES.EVENT_PANEL_OPEN,
            (args) => {
                if (args.buttonId === panel.buttonId) {
                    setActivetrap(true);

                    // set focus on close button on panel open
                    setTimeout(() => Cast<HTMLElement>(closeBtnRef.current).focus(), 0);
                }
            },
            mapId
        );

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE);
            api.event.off(EVENT_NAMES.EVENT_PANEL_ADD_ACTION);
            api.event.off(EVENT_NAMES.EVENT_PANEL_REMOVE_ACTION);
            api.event.off(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT);
            api.event.off(EVENT_NAMES.EVENT_PANEL_OPEN);
        };
    }, []);

    useEffect(() => {
        // set focus on close button on panel open
        if (button.visible) Cast<HTMLElement>(closeBtnRef.current).focus();
    }, [button, closeBtnRef]);

    return (
        <FocusTrap active={activeTrap} focusTrapOptions={{ escapeDeactivates: false }}>
            <Card
                ref={panelRef}
                className={`leaflet-control ${classes.root}`}
                style={{
                    width: panel.width,
                    display: panelOpen ? 'block' : 'none',
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        closePanel();
                    }
                }}
                {...{ 'data-id': panel.buttonId }}
            >
                <CardHeader
                    className={classes.avatar}
                    avatar={
                        typeof panel.icon === 'string' ? (
                            <HtmlToReact style={styles.buttonIcon} htmlContent={panel.icon} />
                        ) : typeof panel.icon === 'object' ? (
                            <panel.icon />
                        ) : (
                            <panel.icon />
                        )
                    }
                    title={t(panel.title)}
                    action={
                        <>
                            {actionButtons}
                            <Tooltip title={t('general.close')} placement="right" TransitionComponent={Fade}>
                                <IconButton
                                    ref={closeBtnRef}
                                    className="cgpv-panel-close"
                                    aria-label={t('general.close')}
                                    onClick={closePanel}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    }
                />
                <Divider />
                <CardContent className={classes.cardContainer}>
                    {typeof panel.content === 'string' ? (
                        <HtmlToReact htmlContent={panel.content} />
                    ) : typeof panel.content === 'object' ? (
                        panel.content
                    ) : (
                        <panel.content />
                    )}
                </CardContent>
            </Card>
        </FocusTrap>
    );
}

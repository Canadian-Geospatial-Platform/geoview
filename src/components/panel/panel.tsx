/* eslint-disable no-nested-ternary */
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { DomEvent } from 'leaflet';

import { useMap } from 'react-leaflet';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Card, CardHeader, CardContent, Divider, IconButton, Tooltip, Fade } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import { MapInterface } from '../../common/map-viewer';

import { HtmlToReact } from '../../common/containers/html-to-react';
import { Panel } from '../../common/ui/panel';
import { styles } from '../../assests/style/theme';
import { Button } from '../../common/ui/button';

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
        paddingBottom: '60px !important',
        boxSizing: 'border-box',
    },
    avatar: {
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(3, 7),
    },
}));

/**
 * Interface for panel properties
 */
interface PanelAppProps {
    panel: Panel;
    panelOpen: boolean;
    button: Button;
}

/**
 * Create a panel with a header title, icon and content
 * @param {PanelAppProps} props panel properties
 */
export default function PanelApp(props: PanelAppProps): JSX.Element {
    const { panel, button, panelOpen } = props;

    const [actionButtons, setActionButtons] = useState<JSX.Element[] & React.ReactNode[]>([]);
    const [, updatePanelContent] = useState(0);

    const classes = useStyles(props);
    const { t } = useTranslation();

    const map = useMap();
    const mapId = (api.mapInstance(map) as MapInterface).id;

    const panelRef = useRef();
    const closeBtnRef = useRef();

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

        const buttonElement = document.getElementById(panel.buttonId);

        if (buttonElement) {
            // put back focus on calling button
            document.getElementById(panel.buttonId)?.focus();
        } else {
            map.getContainer().focus();
        }
    }

    useEffect(() => {
        // disable events on container
        const panelElement = (panelRef.current as unknown) as HTMLElement;
        DomEvent.disableClickPropagation(panelElement);
        DomEvent.disableScrollPropagation(panelElement);

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
            if (args.buttonId === panel.buttonId) {
                updateComponent();
            }
        });

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE);
            api.event.off(EVENT_NAMES.EVENT_PANEL_ADD_ACTION);
            api.event.off(EVENT_NAMES.EVENT_PANEL_REMOVE_ACTION);
            api.event.off(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT);
        };
    }, []);

    useEffect(() => {
        // set focus on close button on panel open
        if (button.visible) ((closeBtnRef.current as unknown) as HTMLElement).focus();
    });

    return (
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
                        <Tooltip title={t('close')} placement="right" TransitionComponent={Fade}>
                            <IconButton ref={closeBtnRef} className="cgpv-panel-close" aria-label={t('close')} onClick={closePanel}>
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
    );
}

/* eslint-disable no-nested-ternary */
import { useRef, useEffect } from 'react';

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
    },
    avatar: {
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(3, 7),
    },
}));

/**
 * interface for panel properties
 */
interface PanelAppProps {
    panel: Panel;
    panelOpen: boolean;
}

/**
 * Create a panel with a header title, icon and content
 * @param {PanelAppProps} props panel properties
 */
export default function PanelApp(props: PanelAppProps): JSX.Element {
    const { panel, panelOpen } = props;

    const classes = useStyles(props);
    const { t } = useTranslation();

    const map = useMap();

    const mapId = (api.mapInstance(map) as MapInterface).id;

    const panelRef = useRef();

    /**
     * Close the panel
     */
    function closePanel(): void {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN_CLOSE, mapId, {
            // used to tell which panel type has been closed
            panelType: panel.type,
            // used when checking which panel was closed from which map
            handlerId: mapId,
            // status of panel (false = closed)
            status: false,
        });

        // put back focus on calling button
        document.getElementById(panel.buttonId)?.focus();
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

        // set focus on close button
        (panelElement.getElementsByClassName('cgpv-panel-close')[0] as HTMLElement).focus();

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE);
        };
    }, []);

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
        >
            <CardHeader
                className={classes.avatar}
                avatar={
                    typeof panel.icon === 'string' ? (
                        <HtmlToReact htmlContent={panel.icon} />
                    ) : typeof panel.icon === 'object' ? (
                        <panel.icon />
                    ) : (
                        <panel.icon />
                    )
                }
                title={t(panel.title)}
                action={
                    <Tooltip title={t('close')} placement="right" TransitionComponent={Fade}>
                        <IconButton className="cgpv-panel-close" aria-label={t('close')} onClick={closePanel}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                }
            />
            <Divider />
            <CardContent>
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

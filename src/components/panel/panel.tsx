/* eslint-disable no-nested-ternary */
import { useRef, useEffect } from 'react';

import { DomEvent } from 'leaflet';

import { useMap } from 'react-leaflet';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Card, CardHeader, CardContent, Divider, IconButton } from '@material-ui/core';
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
        height: 'auto',
        marginLeft: theme.spacing(2),
        borderRadius: 0,
        [theme.breakpoints.down('xs')]: {
            width: 'auto !important',
            minWidth: 100,
        },
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
}

/**
 * Create a panel with a header title, icon and content
 * @param {PanelAppProps} props panel properties
 */
export default function PanelApp(props: PanelAppProps): JSX.Element {
    const { panel } = props;

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
    }

    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation((panelRef.current as unknown) as HTMLElement);
        DomEvent.disableScrollPropagation((panelRef.current as unknown) as HTMLElement);

        api.event.on(
            EVENT_NAMES.EVENT_PANEL_CLOSE,
            (args) => {
                if (args.buttonId === panel.buttonId) closePanel();
            },
            mapId
        );

        return () => {
            api.event.off(EVENT_NAMES.EVENT_PANEL_CLOSE);
        };
    }, []);

    return (
        <Card
            className={`leaflet-control ${classes.root}`}
            ref={panelRef}
            style={{
                width: panel.width,
            }}
        >
            <CardHeader
                className={classes.avatar}
                avatar={typeof panel.icon === 'string' ? <HtmlToReact htmlContent={panel.icon} /> : panel.icon}
                title={t(panel.title)}
                action={
                    <IconButton aria-label={t('appbar.close')} onClick={closePanel}>
                        <CloseIcon />
                    </IconButton>
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

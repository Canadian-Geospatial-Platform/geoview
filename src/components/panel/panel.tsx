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

import { PanelProps } from '../../common/button-panel';
import { HtmlToReact } from '../../common/containers/html-to-react';

interface PanelAppProps {
    panel: PanelProps;
}

const useStyles = makeStyles((theme) => ({
    root: {
        maxWidth: 600,
        minWidth: 300,
        height: '100%',
        marginLeft: theme.spacing(2),
        borderRadius: 0,
        [theme.breakpoints.down('sm')]: {
            width: 'auto !important',
            minWidth: 100,
        },
    },
    avatar: {
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(3, 7),
    },
}));

export default function PanelApp(props: PanelAppProps): JSX.Element {
    const { panel } = props;

    const classes = useStyles(props);
    const { t } = useTranslation();

    const map = useMap();

    const mapId = (api.mapInstance(map) as MapInterface).id;

    const panelRef = useRef();
    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation((panelRef.current as unknown) as HTMLElement);
        DomEvent.disableScrollPropagation((panelRef.current as unknown) as HTMLElement);
    }, []);

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

    return (
        <Card
            className={classes.root}
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
            <CardContent>{typeof panel.content === 'string' ? <HtmlToReact htmlContent={panel.content} /> : panel.content}</CardContent>
        </Card>
    );
}

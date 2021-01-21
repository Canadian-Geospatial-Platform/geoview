import { useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Card, CardHeader, CardContent, Divider, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import { DomEvent } from 'leaflet';

const useStyles = makeStyles((theme) => ({
    root: {
        maxWidth: 300,
        height: '100%',
        marginLeft: theme.spacing(2),
        borderRadius: 0,
    },
    avatar: {
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(3, 7),
    },
}));

export default function PanelApp(props: PanelAppProps): JSX.Element {
    const { title, icon, content, closeDrawer } = props;
    const classes = useStyles(props);
    const { t } = useTranslation();

    const panel = useRef();
    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation((panel.current as unknown) as HTMLElement);
        DomEvent.disableScrollPropagation((panel.current as unknown) as HTMLElement);
    }, []);

    useEffect(() => {
        // TODO: first draf to open close the custom appbar pnael component. Make this cleaner
        if (typeof panel.current !== 'undefined') {
            panel.current.parentElement.style.display = 'block';

            // close drawer when panel opens
            closeDrawer();
        }
    });

    function closePanel(): void {
        panel.current.parentElement.style.display = 'none';
    }

    return (
        <Card className={classes.root} ref={panel}>
            <CardHeader
                className={classes.avatar}
                avatar={icon}
                title={t(title)}
                action={
                    <IconButton aria-label={t('appbar.close')} onClick={closePanel}>
                        <CloseIcon />
                    </IconButton>
                }
            />
            <Divider />
            <CardContent>{content}</CardContent>
        </Card>
    );
}

interface PanelAppProps {
    title: string;
    // eslint-disable-next-line react/require-default-props
    icon?: React.ReactNode;
    content: Element;
    closeDrawer: () => void;
}

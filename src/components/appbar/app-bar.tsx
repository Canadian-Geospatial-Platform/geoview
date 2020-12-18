import { useState, useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Drawer, List, Divider, IconButton, Tooltip, Fade } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { DomEvent } from 'leaflet';

import Layers from './buttons/layers';
import Version from './buttons/version';

const drawerWidth = 200;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        height: '100%',
        width: '60px',
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
        backgroundColor: 'white',
    },
    githubSection: {
        paddingBottom: '30px',
    },
}));

export function Appbar(props: AppBarProps): JSX.Element {
    const { id } = props;
    const { t } = useTranslation();
    const classes = useStyles();

    const appBar = useRef();
    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation(appBar.current.children[0] as HTMLElement);
        DomEvent.disableScrollPropagation(appBar.current.children[0] as HTMLElement);
    }, []);

    const [open, setOpen] = useState(false);

    // side menu items
    // const items = [{ divider: true }, { id: 'layers' }, { divider: true }, { id: 'fullscreen' }, { id: 'help' }];
    const items = [{ id: 'legend' }];

    const handleDrawerClose = () => {
        setOpen(!open);
    };

    return (
        <div className={classes.root} ref={appBar}>
            <Drawer
                variant="permanent"
                className={open ? classes.drawerOpen : classes.drawerClose}
                classes={{ paper: open ? classes.drawerOpen : classes.drawerClose }}
            >
                <div className={classes.toolbar}>
                    <Tooltip title={t('close')} placement="right" TransitionComponent={Fade}>
                        <IconButton onClick={handleDrawerClose}>{!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}</IconButton>
                    </Tooltip>
                </div>
                <Divider />
                <List>
                    {items.map((item) => (
                        <Layers key={`${id}-${item.id}`} />
                    ))}
                </List>
                <Divider className={classes.spacer} />
                <Divider />
                <List className={classes.githubSection}>
                    <Version />
                </List>
            </Drawer>
            <div className="cgp-apppanel" />
        </div>
    );
}

interface AppBarProps {
    id: string;
}

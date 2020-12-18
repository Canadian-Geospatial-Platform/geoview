import { useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { Tooltip, Fade, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { DomEvent } from 'leaflet';

const useStyles = makeStyles({
    color: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        color: '#666666',
        '&:hover': {
            backgroundColor: '#fff',
            color: '#000',
        },
    },
});

export function ButtonMapNav(props: ButtonMapNavProps): JSX.Element {
    const { tooltip, icon, onClickFunction, parentClass } = props;
    const classes = useStyles();
    const { t } = useTranslation();

    const newButton = useRef();
    useEffect(() => {
        // disable events on container
        DomEvent.disableClickPropagation(newButton.current.children[0] as HTMLElement);
        DomEvent.disableScrollPropagation(newButton.current.children[0] as HTMLElement);
    }, []);

    return (
        <Tooltip title={t(tooltip)} placement="left" TransitionComponent={Fade} ref={newButton}>
            <Button className={`${parentClass} ${classes.color}`} onClick={onClickFunction}>
                {icon}
            </Button>
        </Tooltip>
    );
}

interface ButtonMapNavProps {
    tooltip: string;
    icon: React.ReactNode;
    onClickFunction: () => void;
    parentClass: string;
}

export interface OtherProps {
    [x: string]: string;
}

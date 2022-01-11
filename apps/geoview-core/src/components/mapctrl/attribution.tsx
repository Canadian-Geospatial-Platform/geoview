import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { LEAFLET_POSITION_CLASSES } from '../../common/constant';

const useStyles = makeStyles((theme) => ({
    attributionContainer: {
        marginLeft: '65px',
        backgroundColor: theme.palette.primary.main,
        padding: theme.spacing(0, 4),
    },
    attributionText: {
        margin: '0 !important',
        padding: theme.spacing(2),
        fontSize: theme.typography.subtitle2.fontSize,
    },
}));

type AttributionProps = {
    attribution: string;
};

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 * @param props attribution properties to get the attribution text
 */
export function Attribution(props: AttributionProps): JSX.Element {
    const { attribution } = props;

    const classes = useStyles();

    return (
        <div className={[classes.attributionContainer, LEAFLET_POSITION_CLASSES.bottomleft].join(' ')}>
            <span className={['leaflet-control', classes.attributionText].join(' ')}>{attribution}</span>
        </div>
    );
}

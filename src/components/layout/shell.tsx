import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';

import FocusTrap from 'focus-trap-react';

import { MapConfigProps } from '../../api/config';
import { Map } from '../map/map';
import { FocusTrapDialog } from './focus-trap';

const useStyles = makeStyles((theme) => ({
    shell: {
        top: theme.spacing(0),
        right: theme.spacing(0),
        left: theme.spacing(0),
        bottom: theme.spacing(0),
        overflow: 'hidden',
        zIndex: -1,
        height: '100%',
        pointerEvents: 'none',
    },
    skip: {
        position: 'absolute',
        left: -1000,
        height: 1,
        width: 1,
        textAlign: 'left',
        overflow: 'hidden',

        '&:active, &:focus, &:hover': {
            left: theme.spacing(0),
            zIndex: theme.zIndex.tooltip,
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
        },
    },
}));

/**
 * Interface for the shell properties
 */
interface ShellProps {
    id: string;
    config: MapConfigProps;
}

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(props: ShellProps): JSX.Element {
    const { id, config } = props;

    const classes = useStyles();
    const { t } = useTranslation();

    // set the active trap value for FocusTrap and pass the callback to the dialog window
    const [activeTrap, setActivetrap] = useState(false);

    /**
     * Set the focus trap
     * @param {boolean} dialogTrap the callback value from dialog trap
     */
    function handleCallback(dialogTrap: boolean): void {
        setActivetrap(dialogTrap);
    }

    return (
        <FocusTrap active={activeTrap} focusTrapOptions={{ escapeDeactivates: false }}>
            <div className={classes.shell}>
                <a id={`toplink-${id}`} href={`#bottomlink-${id}`} className={classes.skip}>
                    {t('keyboardnav.start')}
                </a>
                <Map
                    id={id}
                    center={config.center}
                    zoom={config.zoom}
                    projection={config.projection}
                    language={config.language}
                    layers={config.layers}
                    basemapOptions={config.basemapOptions}
                />
                <FocusTrapDialog id={id} callback={handleCallback} />
                <a id={`bottomlink-${id}`} href={`#toplink-${id}`} className={classes.skip}>
                    {t('keyboardnav.end')}
                </a>
            </div>
        </FocusTrap>
    );
}

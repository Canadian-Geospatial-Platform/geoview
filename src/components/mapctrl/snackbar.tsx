import { useEffect } from 'react';

import { Button } from '@material-ui/core';

import { useSnackbar } from 'notistack';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

/**
 * Snackbar properties interface
 */
interface SnackBarProps {
    id: string;
}

/**
 * Snackbar button properties interface
 */
interface SnackButtonProps {
    label: string;
    action(): void;
}

/**
 * The snackbar button component
 * @param {SnackButtonProps} props the snackbar button properties
 * @return {JSX.Element} the snackbar component
 */
function SnackButton(props: SnackButtonProps): JSX.Element {
    const { label, action } = props;
    return <Button onClick={action}>{label}</Button>;
}

/**
 * Create a app/map message component to inform user on viewer state
 * We use the notistack npm module who has the following props (https://www.npmjs.com/package/notistack)
 *      - variant: 'default','success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
export function Snackbar(props: SnackBarProps): null {
    const { id } = props;

    const { enqueueSnackbar } = useSnackbar();
    useEffect(() => {
        // listen to API event when app wants to show message
        api.event.on(EVENT_NAMES.EVENT_SNACKBAR_OPEN, (payload) => {
            const opts = payload.options ? payload.options : {};

            // apply function if provided
            opts.action = payload.button ? SnackButton({ label: payload.button.label, action: payload.button.action }) : null;

            // show the notification
            if (payload && id === payload.handlerName) enqueueSnackbar(payload.message, opts);
        });

        // remove the listener when the component unmounts
        return () => {
            api.event.off(EVENT_NAMES.EVENT_SNACKBAR_OPEN);
        };
    }, []);

    return null;
}

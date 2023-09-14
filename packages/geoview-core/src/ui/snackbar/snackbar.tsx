import { useEffect, useContext, forwardRef, useState } from 'react';

import { Alert as MaterialAlert, AlertProps, Snackbar as MaterialSnackbar, Button } from '@mui/material';

import { MapContext } from '@/core/app-start';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Cast } from '@/core/types/global-types';
import { PayloadBaseClass, payloadIsASnackbarMessage } from '@/api/events/payloads';
import { SnackbarType } from '@/api/events/payloads/snackbar-message-payload';

/**
 * Snackbar properties interface
 */
interface SnackBarProps {
  snackBarId: string;
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
 * @returns {JSX.Element} the snackbar component
 */
function SnackButton(props: SnackButtonProps): JSX.Element {
  const { label, action } = props;
  return <Button onClick={action}>{label}</Button>;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MaterialAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

/**
 * Create a app/map message component to inform user on viewer state
 * - severity: 'success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
export function Snackbar(props: SnackBarProps): JSX.Element {
  const { snackBarId } = props;

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('info');
  const [button, setButton] = useState<JSX.Element | undefined>();

  const snackBarOpenListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsASnackbarMessage(payload)) {
      // apply function if provided
      const myButton = payload.button
        ? SnackButton({
            label: payload.button.label as string,
            action: Cast<() => void>(payload.button.action),
          })
        : undefined;

      // get message and set type
      setMessage(payload.message);
      setButton(myButton);
      setSnackbarType(payload.snackbarType);

      // show the notification
      setOpen(true);
    }
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  useEffect(() => {
    // listen to API event when app wants to show message
    api.event.on(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, snackBarOpenListenerFunction, mapId);

    // remove the listener when the component unmounts
    return () => {
      api.event.off(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, snackBarOpenListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MaterialSnackbar
      sx={{
        position: 'absolute',
        bottom: '40px!important',
      }}
      id={snackBarId}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
    >
      <Alert onClose={handleClose} severity={snackbarType} sx={{ width: '100%' }}>
        {message}
        {button}
      </Alert>
    </MaterialSnackbar>
  );
}

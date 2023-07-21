import { useEffect, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';

import { useSnackbar } from 'notistack';

import { MapContext } from '@/core/app-start';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Cast, TypeJsonArray, TypeJsonValue } from '@/core/types/global-types';
import { payloadIsASnackbarMessage } from '@/api/events/payloads/snackbar-message-payload';

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

/**
 * Create a app/map message component to inform user on viewer state
 * We use the notistack npm module who has the following props (https://www.npmjs.com/package/notistack)
 *      - variant: 'default','success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
export function Snackbar(props: SnackBarProps): null {
  const { snackBarId } = props;

  const { t } = useTranslation<string>();

  const { enqueueSnackbar } = useSnackbar();

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Take string and replace parameters from array of values
   * @param {string[]} params array of parameters to replace
   * @param {string} message original message
   * @returns {string} message with values replaced
   */
  function replaceParams(params: TypeJsonValue[] | TypeJsonArray | string[], message: string) {
    let tmpMess = message;
    (params as string[]).forEach((item: string) => {
      tmpMess = tmpMess.replace('__param__', item);
    });

    return tmpMess;
  }

  useEffect(() => {
    // listen to API event when app wants to show message
    api.event.on(
      EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN,
      (payload) => {
        if (payloadIsASnackbarMessage(payload)) {
          const options = payload.options ? payload.options : {};

          // apply function if provided
          (options.action as TypeJsonValue) = payload.button
            ? Cast<TypeJsonValue>(
                SnackButton({
                  label: payload.button.label as string,
                  action: Cast<() => void>(payload.button.action),
                })
              )
            : null;

          // get message
          const message =
            payload.message.type === 'string' ? payload.message.value : replaceParams(payload.message.params!, t(payload.message.value));

          // show the notification
          if (payload && snackBarId === payload.handlerName) enqueueSnackbar(message, options);
        }
      },
      mapId
    );

    // remove the listener when the component unmounts
    return () => {
      api.event.off(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

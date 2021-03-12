import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';

import { Dialog, DialogContentText } from '@material-ui/core';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

const useStyles = makeStyles((theme) => ({
    trap: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: theme.spacing(0),
        left: theme.spacing(0),
        width: '100%',
        height: '100%',
        zIndex: theme.zIndex.focusDialog,
        overflow: 'hidden',
    },
    root: {
        position: 'absolute',
    },
    backdrop: {
        position: 'absolute',
    },
    content: {
        padding: theme.spacing(5),
    }
}));

/**
 * Interface for the focus trap properties
 */
interface FocusTrapProps {
    id: string;
    callback: (dialogTrap: boolean) => void;
}

/**
 * Create a dialog component to explain to keyboard user how to trigger and remove FocusTrap
 * @param {FocusTrapProps} props the focus trap dialog properties
 * @returns {JSX.Element} the focus trap dialog component
 */
export function FocusTrapDialog(props: FocusTrapProps): JSX.Element {
    const { id, callback } = props;

    const classes = useStyles();
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);

    /**
     * Manage the focus dialog window for keyboard event. If user press Tab it will skip the map and Enter goes inside in focus trap mode
     * @param {KeyboardEvent} evt the keyboard event
     */
    function manageFocusDialog(evt: KeyboardEvent): void {
        const mapElement = document.getElementById(id);

        // we only listen for enter or tab
        if (evt.code === 'Tab' || evt.code === 'Enter') {
            // if user press a valid key, remove listener and close dialog
            mapElement?.removeEventListener('keydown', manageFocusDialog);
            setOpen(false);

            // prevent the event to propagate
            evt.preventDefault();
            evt.stopPropagation();

            if (evt.code === 'Tab' && !evt.ctrlKey && !evt.shiftKey && !evt.altKey) {
                // if tab, by pass the viewer and go to bottom link
                document.getElementById(`bottomlink-${id}`)?.focus();
            } else if (evt.code === 'Enter') {
                // add a class to specify the viewer is in focus trap mode
                mapElement?.classList.add('map-focus-trap');

                // remove the top and bottom link from focus cycle and start the FocusTrap
                mapElement?.querySelectorAll('a[class^="makeStyles-skip"]').forEach((elem) => elem.setAttribute('tabindex', '-1'));
                callback(true);

                // manage the exit of FocusTrap, remove the trap and focus the top link
                const manageExit = (evt2: KeyboardEvent) => {
                    if (evt2.code === 'Escape' && evt2.ctrlKey) {
                        // the user escape the trap, remove it, put back skip link in focus cycle and zoom to top link
                        callback(false);
                        mapElement?.classList.remove('map-focus-trap');
                        mapElement?.querySelectorAll('a[class^="makeStyles-skip"]').forEach((elem) => elem.setAttribute('tabindex', '0'));
                        document.getElementById(`toplink-${id}`)?.focus();

                        mapElement?.removeEventListener('keydown', manageExit);
                    }
                };

                mapElement?.addEventListener('keydown', manageExit);
            }
        }
    }

    /**
     * Manage skip bottom link. If user press enter it goes to top link and if he tries to focus the map, it goes to focus dialog
     * @param {KeyboardEvent} evt the keyboard event
     */
    function manageBottomLink(evt: KeyboardEvent): void {
        // if Enter, skip before the map element
        // if shift+Tab, focus the map element
        if (evt.code === 'Enter') {
            document.getElementById(`toplink-${id}`)?.focus();
        } else if (evt.code === 'Tab' && evt.shiftKey) {
            // prevent the event to tab to inner map
            evt.preventDefault();
            evt.stopPropagation();

            // focus the map element and emit the map keyboard focus event
            (document.getElementById(id)?.getElementsByClassName('leaflet-container')[0] as HTMLElement).focus();
            api.event.emit(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, id, {});
        }
    }

    useEffect(() => {
        document.getElementById(`bottomlink-${id}`)?.addEventListener('keydown', manageBottomLink);

        // on map keyboard focus, show focus trap dialog
        api.event.on(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, (payload) => {
            if (payload && payload.handlerName.includes(id)) {
                // when mnap element get focus and focus is not trap, show dialog window
                const mapElement = document.getElementById(id);

                if (mapElement && !mapElement.classList.contains('map-focus-trap')) {
                    setOpen(true);

                    // add a listener for the next to key down to see the selection
                    mapElement.addEventListener('keydown', manageFocusDialog);

                    // if user move the mouse over the map, cancel the dialog
                    mapElement.addEventListener(
                        'mousemove',
                        () => {
                            mapElement?.removeEventListener('keydown', manageFocusDialog);
                            setOpen(false);
                        },
                        { once: true }
                    );
                }
            }
        });

        return () => {
            document.removeEventListener('keydown', manageBottomLink);
            api.event.off(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS);
        };
    }, []);

    return (
        <Dialog
            style={{ position: 'absolute' }}
            disablePortal
            container={document.getElementsByClassName('llwp-map')[0]}
            aria-labelledby={t('keyboardnav.focusdialog.ariadesc')}
            open={open}
            className={classes.trap}
            classes={{
                root: classes.root,
            }}
            BackdropProps={{
                classes: { root: classes.backdrop },
            }}
        >
            <DialogContentText className={classes.content} dangerouslySetInnerHTML={{ __html: t('keyboardnav.focusdialog.toactivate') }} />
            <DialogContentText className={classes.content} dangerouslySetInnerHTML={{ __html: t('keyboardnav.focusdialog.main') }} />
        </Dialog>
    );
}

import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme, makeStyles } from '@material-ui/core/styles';

import useMediaQuery from '@material-ui/core/useMediaQuery';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

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
        background: theme.palette.backdrop,
    },
    content: {
        padding: theme.spacing(5),
    },
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

    const defaultTheme = useTheme();
    const classes = useStyles();
    const { t } = useTranslation<string>();

    const fullScreen = useMediaQuery(defaultTheme.breakpoints.down('sm'));

    const [open, setOpen] = useState(false);

    /**
     * Exit the focus trap
     */
    function exitFocus(): void {
        const mapElement = document.getElementById(id);

        // the user escape the trap, remove it, put back skip link in focus cycle and zoom to top link
        callback(false);
        mapElement?.classList.remove('map-focus-trap');
        mapElement?.querySelectorAll(`a[id*="link-${id}"]`).forEach((elem) => elem.setAttribute('tabindex', '0'));
        document.getElementById(`toplink-${id}`)?.focus();
    }

    /**
     * Set the focus trap
     */
    function setFocusTrap(): void {
        const mapElement = document.getElementById(id);

        // add a class to specify the viewer is in focus trap mode
        mapElement?.classList.add('map-focus-trap');

        // remove the top and bottom link from focus cycle and start the FocusTrap
        mapElement?.querySelectorAll(`a[id*="link-${id}"]`).forEach((elem) => elem.setAttribute('tabindex', '-1'));
        callback(true);

        // manage the exit of FocusTrap, remove the trap and focus the top link
        const manageExit = (evt2: KeyboardEvent) => {
            if (evt2.code === 'KeyQ' && evt2.ctrlKey) {
                exitFocus();
                mapElement?.removeEventListener('keydown', manageExit);
            }
        };

        mapElement?.addEventListener('keydown', manageExit);
    }

    const handleEnable = () => {
        setOpen(false);
        setFocusTrap();
    };
    const handleSkip = () => {
        // because the process is about to focus the map, apply a timeout before shifting focus on bottom link
        setOpen(false);
        setTimeout(() => document.getElementById(`bottomlink-${id}`)?.focus(), 0);
    };

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
            (document.getElementById(id)?.getElementsByClassName(`leaflet-map-${id}`)[0] as HTMLElement).focus();
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

                    // if user move the mouse over the map, cancel the dialog
                    mapElement.addEventListener(
                        'mousemove',
                        () => {
                            setOpen(false);
                            exitFocus();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog
            style={{ position: 'absolute' }}
            container={document.getElementsByClassName('llwp-map')[0]}
            open={open}
            aria-labelledby="wcag-dialog-title"
            aria-describedby="wcag-dialog-description"
            fullScreen={fullScreen}
            className={classes.trap}
            classes={{
                root: classes.root,
            }}
            BackdropProps={{
                classes: { root: classes.backdrop },
            }}
        >
            <DialogTitle id="wcag-dialog-title">{t('keyboardnav.focusdialog.title')}</DialogTitle>
            <DialogContent>
                <DialogContentText
                    id="wcag-dialog-description"
                    className={classes.content}
                    dangerouslySetInnerHTML={{ __html: t('keyboardnav.focusdialog.main') }}
                />
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={handleEnable}>
                    {t('keyboardnav.focusdialog.button.enable')}
                </Button>
                <Button onClick={handleSkip}>{t('keyboardnav.focusdialog.button.skip')}</Button>
            </DialogActions>
        </Dialog>
    );
}

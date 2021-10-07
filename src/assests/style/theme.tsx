import { CSSProperties } from 'react';
import { createMuiTheme, ThemeOptions } from '@material-ui/core/styles';
// eslint-disable-next-line no-restricted-imports
import { Variant, TypographyStyleOptions } from '@material-ui/core/styles/createTypography';

const headingStyles = {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontWeight: 700,
};

const themeOptions: ThemeOptions = {
    palette: {
        primary: {
            light: '#ffffff',
            main: '#ffffff',
            dark: '#000000',
            contrastText: '#666666',
        },
        secondary: {
            light: '#ff7961',
            main: '#f44336',
            dark: '#ba000d',
            contrastText: '#000',
        },
        backdrop: '#3F3F3F50',
    },
    typography: {
        fontSize: 16,
        htmlFontSize: 16,
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: headingStyles,
        h2: headingStyles,
        h3: headingStyles,
        h4: headingStyles,
        h5: headingStyles,
        h6: {
            fontWeight: 400,
        },
        subtitle1: {
            fontSize: '0.8rem',
        },
        subtitle2: {
            fontSize: '0.7rem',
        },
        body1: {},
        body2: {},
        caption: {},
        overline: {
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: 2,
        },
        button: {
            fontSize: 24,
            fontWeight: 500,
        },
        control: {
            fontSize: 11,
            fontWeight: 500,
        },
    },
    spacing: [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20, 30],
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
    zIndex: {
        mobileStepper: 1000,
        speedDial: 1050,
        appBar: 1100,
        drawer: 1200,
        modal: 1300,
        snackbar: 1400,
        tooltip: 1500,
        leafletControl: 500,
        focusDialog: 100,
    },
    transitions: {
        duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            // most basic recommended timing
            standard: 300,
            // this is to be used in complex animations
            complex: 375,
            // recommended when something is entering screen
            enteringScreen: 225,
            // recommended when something is leaving screen
            leavingScreen: 195,
            splash: 1500,
        },
        easing: {
            // This is the most common easing curve.
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            // Objects enter the screen at full velocity from off-screen and
            // slowly decelerate to a resting point.
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            // Objects leave the screen at full velocity. They do not decelerate when off-screen.
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            // The sharp curve is used by objects that may return to the screen at any time.
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        },
    },
    shape: {
        borderRadius: 6,
        left: '0%',
        center: '50%',
        right: '100%',
    },
    overrides: {
        button: {
            size: { width: '32px', height: '32px' },
        },
        northArrow: {
            size: { width: 42, height: 42 },
        },
        crosshairIcon: {
            size: { width: 275, height: 275 },
        },
        MuiFab: {
            extended: {
                padding: '0 24px',
            },
            label: {
                fontSize: '1rem',
            },
        },
        MuiDrawer: {
            paper: { position: 'relative' },
        },
    },
};

type TypeTypography = Partial<Record<Variant, TypographyStyleOptions>>;
export const styles: Record<string, CSSProperties> = {
    buttonIcon: {
        width: '1em',
        height: '1em',
        display: 'inherit',
        fontSize: (themeOptions.typography as TypeTypography).button?.fontSize,
        alignItems: 'inherit',
        justifyContent: 'inherit',
        transition: 'fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        flexShrink: 0,
        userSelect: 'none',
    },
};

export const theme = createMuiTheme(themeOptions);

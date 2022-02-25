import { createTheme, ThemeOptions } from "@mui/material/styles";

const headingStyles = {
  fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  fontWeight: 700,
};

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      light: "#ffffff",
      main: "#ffffff",
      dark: "#000000",
      contrastText: "#666666",
    },
    secondary: {
      light: "#ff7961",
      main: "#f44336",
      dark: "#ba000d",
      contrastText: "#000",
    },
    backdrop: "#3F3F3F50",
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
      fontSize: "0.8rem",
      lineHeight: 1.25,
    },
    subtitle2: {
      fontSize: "0.7rem",
      lineHeight: 1.25,
    },
    body1: {},
    body2: {},
    caption: {},
    overline: {
      fontSize: "0.875rem",
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
      md: 900,
      lg: 1200,
      xl: 1536,
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
    focusDialog: 1300,
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
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      // Objects enter the screen at full velocity from off-screen and
      // slowly decelerate to a resting point.
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      // Objects leave the screen at full velocity. They do not decelerate when off-screen.
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      // The sharp curve is used by objects that may return to the screen at any time.
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },
  shape: {
    borderRadius: 6,
    center: "50%",
    right: "100%",
    left: "0%",
  },
  components: {
    MuiFab: {
      styleOverrides: {
        root: { padding: "0 24px" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { position: "relative" },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        grouped: {
          minWidth: "auto",
        },
      },
    },
  },
  overrides: {
    button: {
      size: { width: "32px", height: "32px" },
    },
    northArrow: {
      size: { width: 42, height: 42 },
    },
    crosshairIcon: {
      size: { width: 275, height: 275 },
    },
  },
};

export const theme = createTheme(themeOptions);

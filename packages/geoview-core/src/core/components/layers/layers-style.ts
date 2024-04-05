import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  layersPanelContainer: {
    background: theme.palette.geoViewColor.bgColor.main,
    paddingBottom: '1rem',
  },
  // descriptions for right panel with buttons(describing what each panel does)
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'column',
    // alignItems: 'center',

    '& p': {
      margin: '0 3px',
    },
  },
});

import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  layersPanelContainer: {
    background: theme.palette.geoViewColor.bgColor.main,
    paddingBottom: '1rem',
    '& .guideBox': {
      ml: '30px',
      mb: '18px',
      td: {
        width: 'auto',
        paddingLeft: '15px',
      },
      th: {
        textAlign: 'left',
        paddingLeft: '15px',
      },
    },
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
  rightPanel: {
    borderColor: theme.palette.geoViewColor.primary.main,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderRadius: '5px',
  },
});

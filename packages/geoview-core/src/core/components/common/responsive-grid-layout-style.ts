import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  rightGridContent: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.white,
    width: '100%',
    '&.fullscreen-mode': {
      maxHeight: 'calc(100vh - 90px)',
      '& > div': {
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
      },
      '& .MuiTableContainer-root': {
        maxHeight: 'calc(100vh - 260px)',
      },
      '& .guidebox-container': {
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
      },
    },

    '& .MuiPaper-root': {
      border: 'none',
    },
    '& .guideBox': {
      margin: '1rem',
      img: {
        maxWidth: '100%',
      },
      td: {
        width: 'auto',
        paddingLeft: '15px',
      },
      th: {
        textAlign: 'left',
        paddingLeft: '15px',
      },
      '& h3': {
        '&:first-of-type': {
          display: 'flex',
          alignItems: 'center',
          gap: '0.325rem',
        },
      },
    },
  },
});

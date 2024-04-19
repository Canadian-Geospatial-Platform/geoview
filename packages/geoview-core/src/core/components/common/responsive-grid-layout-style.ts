import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  rightGridContent: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.white,
    width: '100%',
    overflow: 'auto',
    maxHeight: '600px',

    '&.fullscreen-mode': {
      maxHeight: 'calc(100vh - 150px)',

      '& .MuiTableContainer-root': {
        maxHeight: 'calc(100vh - 260px)',
      },
    },

    '& .MuiPaper-root': {
      border: 'none',
    },
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
});

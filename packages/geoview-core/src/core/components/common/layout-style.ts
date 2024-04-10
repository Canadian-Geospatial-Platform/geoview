import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
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

import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  rightButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.6rem',
    backgroundColor: theme.palette.geoViewColor.primary.lighten(0.5, 0.1),
    borderTopLeftRadius: '0.75rem',
    borderTopRightRadius: '0.5rem',
    padding: ' 0.5rem 0.5rem 0.5rem 1rem',
    borderTop: `0.2rem solid ${theme.palette.geoViewColor.primary.lighten(0.2, 0.4)}`,
    borderLeft: `0.2rem solid ${theme.palette.geoViewColor.primary.lighten(0.2, 0.4)}`,
  },
  rightGridContent: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[300],

    '&.guide-container': {
      backgroundColor: theme.palette.geoViewColor.white,
    },
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
      color: `${theme.palette.geoViewColor.grey.dark[800]}  !important`,
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

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): any => ({
  aoiCard: {
    height: '100%',
    overflowY: 'auto',
    '& .MuiCard-root': {
      backgroundColor: theme.palette.grey.A700,
      color: theme.palette.primary.light,
      display: 'flex',
      flexDirection: 'column',
      backgroundClip: 'padding-box',
      border: '2px solid rgba(255,255,255,0.25)',
      borderRadius: '6px',
      boxShadow: 'none',
      marginBottom: '16px',
      width: '300px',
      transition: 'all 0.3s ease-in-out',
      '&:last-child': {
        marginBottom: '0px',
      },
      '&:hover': {
        border: `2px solid #FFFF00`,
      },
      '&.active': {
        border: `2px solid #FFFFFF`,
      },
    },
    '& .MuiCardHeader-root': {
      backgroundColor: `${theme.palette.geoViewColor.grey.dark[900]} !important`,
      color: theme.palette.geoViewColor.grey.light[900],
      fontSize: 14,
      fontWeight: 400,
      margin: 0,
      padding: '0 12px',
      height: 60,
      width: '100%',
      order: 2,
    },
    '& .MuiCardContent-root': {
      order: 1,
      height: 190,
      position: 'relative',
      padding: 0,
      '&:last-child': {
        padding: 0,
      },
      '& .aoiCardThumbnail': {
        position: 'absolute',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        border: '1px solid theme.palette.geoViewColor.ccc',
        display: 'flex',
        align: 'center',
        objectFit: 'cover',
        top: 0,
        left: 0,
      },
      '& .aoiCardThumbnailOverlay': {
        display: 'block',
        height: '100%',
        width: '100%',
        position: 'absolute',
        backgroundColor: theme.palette.geoViewColor.grey.lighten(0.5, 0.85),
        transition: 'all 0.3s ease-in-out',
      },
    },
    '&:hover': {
      cursor: 'pointer',
      borderColor: theme.palette.geoViewColor.primary.main,
      '& .MuiCardContent-root': {
        '& .aoiCardThumbnailOverlay': {
          backgroundColor: theme.palette.geoViewColor.grey.lighten(0.5, 0.55),
        },
      },
    },
    '&.active': {
      borderColor: theme.palette.geoViewColor.primary.light[200],
      '& .MuiCardContent-root': {
        '& .aoiCardThumbnailOverlay': {
          backgroundColor: 'transparent',
        },
      },
      '&:hover': {
        borderColor: 'rgba(255,255,255,0.75)',
        '& .MuiCardContent-root': {
          '& .aoiCardThumbnailOverlay': {
            backgroundColor: 'rgba(0,0,0,0)',
          },
        },
      },
    },
  },
});

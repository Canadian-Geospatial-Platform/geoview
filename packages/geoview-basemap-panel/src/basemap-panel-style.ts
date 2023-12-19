/* @ts-expect-error there is no mui style in this package */
export const getSxClasses = (theme) => ({
  basemapCard: {
    '& .MuiCard-root': {
      backgroundColor: theme.palette.grey.A700,
      color: theme.palette.primary.light,
      display: 'flex',
      flexDirection: 'column',
      backgroundClip: 'padding-box',
      border: '1px solid rgba(255,255,255,0.25)',
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
      backgroundColor: `${theme.palette.grey.A700} !important`,
      color: theme.basemapPanel.header,
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
      '& .basemapCardThumbnail': {
        position: 'absolute',
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        top: 0,
        left: 0,
      },
      '& .basemapCardThumbnailOverlay': {
        display: 'block',
        height: '100%',
        width: '100%',
        position: 'absolute',
        backgroundColor: theme.basemapPanel.overlayDefault,
        transition: 'all 0.3s ease-in-out',
      },
    },
    '&:hover': {
      cursor: 'pointer',
      borderColor: theme.basemapPanel.borderHover,
      '& .MuiCardContent-root': {
        '& .basemapCardThumbnailOverlay': {
          backgroundColor: theme.basemapPanel.overlayHover,
        },
      },
    },
    '&.active': {
      borderColor: theme.basemapPanel.borderActive,
      '& .MuiCardContent-root': {
        '& .basemapCardThumbnailOverlay': {
          backgroundColor: theme.basemapPanel.overlayActive,
        },
      },
      '&:hover': {
        borderColor: 'rgba(255,255,255,0.75)',
        '& .MuiCardContent-root': {
          '& .basemapCardThumbnailOverlay': {
            backgroundColor: 'rgba(0,0,0,0)',
          },
        },
      },
    },
  },
});

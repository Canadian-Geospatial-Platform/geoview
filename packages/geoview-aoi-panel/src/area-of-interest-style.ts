import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the AOI panel components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  aoiCard: {
    height: '100%',
    overflowY: 'auto',
  },
  aoiCardButton: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid rgba(255,255,255,0.25)',
    borderRadius: '6px',
    boxShadow: 'none',
    margin: theme.spacing(2),
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    '&:last-child': {
      marginBottom: theme.spacing(0),
    },
    '&:hover': {
      border: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.common.black}`,
      outlineOffset: '6px',
    },
    '& .MuiCardHeader-root': {
      backgroundColor: `${theme.palette.geoViewColor?.grey.dark[900]} !important`,
      color: theme.palette.geoViewColor?.grey.light[900],
      fontSize: 14,
      fontWeight: 400,
      margin: theme.spacing(0),
      padding: theme.spacing(0, 1.5),
      height: 60,
      width: '100%',
      order: 2,
      border: 'none',
    },
    '& .MuiCardContent-root': {
      order: 1,
      height: 190,
      position: 'relative',
      padding: theme.spacing(0),
      '&:last-child': {
        padding: theme.spacing(0),
      },
      '& .aoiCardThumbnail': {
        position: 'absolute',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        objectFit: 'cover',
        top: 0,
        left: 0,
      },
    },
  },
});

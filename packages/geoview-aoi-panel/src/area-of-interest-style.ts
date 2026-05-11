import type { SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the AOI panel components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxStyles => ({
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
    margin: '16px',
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    '&:last-child': {
      marginBottom: '0px',
    },
    '&:hover': {
      border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.common.black}`,
      outlineOffset: '6px',
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
      border: 'none',
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
        display: 'flex',
        objectFit: 'cover',
        top: 0,
        left: 0,
      },
    },
  },
});

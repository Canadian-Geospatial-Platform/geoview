import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the AOI panel components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  aoiCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
  },
  aoiCardButton: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    font: 'inherit',
    color: 'inherit',
    borderRadius: theme.shape.borderRadiusMd,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid rgba(255,255,255,0.25)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      border: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
    },
    '& .aoiCardMedia': {
      display: 'block',
      height: 190,
      position: 'relative',
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
    '& .aoiCardTitle': {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: theme.palette.geoViewColor?.grey.dark[900],
      color: theme.palette.geoViewColor?.grey.light[900],
      fontSize: theme.palette.geoViewFontSize?.sm,
      fontWeight: 400,
      padding: theme.spacing(0, 1.5),
      height: 60,
      width: '100%',
    },
  },
});

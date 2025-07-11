import { Theme } from '@mui/material/styles';

/**
 * Get custom sx classes for the export modal
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  mapContainer: {
    '& img': {
      border: `${theme.palette.grey[500]} 1px solid`,
    },
  },
  legendContainer: {
    padding: '1rem',
    margin: '1rem',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  legendSpacing: {
    margin: '0.4rem',
  },
  legendTitle: {
    paddingRight: '0.2rem',
    marginLeft: '0.2em',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: theme.palette.geoViewFontSize.sm,
    display: 'flex',
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
  },
  legendLayerIcon: {
    maxWidth: '1.5em',
    maxHeight: '1.5em',
    verticalAlign: 'middle',
    textAlign: 'left',
  },
  legendItemIcon: {
    maxWidth: '1.5em',
    verticalAlign: 'middle',
    marginLeft: '0.5em',
    marginRight: '0.5em',
  },
  legendItem: {
    textAlign: 'left',
    marginLeft: '0.5em',
    marginTop: '0.2em',
    display: 'block',
    fontSize: theme.palette.geoViewFontSize.sm,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
  },
  hr: {
    width: '80%',
    marginLeft: '7px',
  },
  wmsImage: {
    maxWidth: '90%',
    cursor: 'arrow',
  },
  iconBtn: {
    width: '1.5rem',
    height: '1.5rem',
    minWidth: 0,
    padding: 0,
    border: '1px solid #a2b9bc',
    '&:hover': {
      border: '1px solid #92a8d1',
    },
  },
  toLine: {
    display: 'block',
  },
  scaleText: {
    fontSize: theme.palette.geoViewFontSize.default,
    color: theme.palette.geoViewColor.grey.dark[800],
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${theme.palette.geoViewColor.primary.light[300]}`,
    textTransform: 'lowercase',
    position: 'relative',
    display: 'inline-block',

    '&.interaction-static': {
      fontSize: theme.palette.geoViewFontSize.md,
      borderBottom: '1px solid',

      '&.hasScaleLine::before, &.hasScaleLine::after': {
        backgroundColor: `${theme.palette.geoViewColor.grey.dark[800]} !important`,
        width: '1px !important',
      },
    },

    '&.hasScaleLine::before, &.hasScaleLine::after': {
      content: '""',
      position: 'absolute',
      bottom: '-1px',
      width: '1px',
      height: '8px',
      backgroundColor: theme.palette.geoViewColor.grey.dark[800],
    },

    '&.hasScaleLine::before': {
      left: '-0px',
    },

    '&.hasScaleLine::after': {
      right: '-0px',
    },
  },
  disclaimerText: {
    fontSize: theme.palette.geoViewFontSize.sm,
    color: theme.palette.geoViewColor.grey.dark[800],
    margin: 0,
    marginBottom: '20px',
  },
  dateText: {
    fontSize: theme.palette.geoViewFontSize.sm,
    color: theme.palette.geoViewColor.grey.dark[800],
    marginBottom: '1rem',
  },
  AttributionText: {
    fontSize: theme.palette.geoViewFontSize.sm,
    color: theme.palette.geoViewColor.grey.dark[800],
    margin: '1rem',
  },
});

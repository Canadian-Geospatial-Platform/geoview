import { Theme } from '@mui/material/styles';
/**
 * Get custom sx classes for the export modal
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  legendContainer: {
    padding: '1rem',
    margin: '1rem',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  legendTitle: {
    paddingRight: '0.2rem',
    marginLeft: '0.2em',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: theme.palette.geoViewFontSize.sm,
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
    marginLeft: '1.5em',
  },
  legendItem: {
    textAlign: 'left',
    marginLeft: '0.5em',
    paddingLeft: '0.15rem',
    fontSize: theme.palette.geoViewFontSize.sm,
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
});

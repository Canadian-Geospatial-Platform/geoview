import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    textAlign: 'left',
    fontWeight: '600',
    color: theme.palette.geoViewColor.textColor.main,
    fontSize: theme.palette.geoViewFontSize.md,
  },
  subtitle: {
    fontWeight: 'normal',
    fontSize: theme.palette.geoViewFontSize.md,
    textAlign: 'left',
    marginBottom: '15px',
  },
  layersListContainer: {
    padding: '20px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',

    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('md')]: {
      width: '50%',
    },
    [theme.breakpoints.up('lg')]: {
      width: '33.33%',
    },
  },
  legendLayerListItem: {
    padding: '6px 4px',
    '& .layerTitle': {
      fontSize: theme.palette.geoViewFontSize.md,
      fontWeight: '600',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      '>p': {
        margin: 0,
        color: theme.palette.geoViewColor.textColor.light[400],
        fontSize: theme.palette.geoViewFontSize.sm,
        lineHeight: 1.43,
      },
    },

    '& .layerTitle > .MuiListItemText-secondary': {
      color: theme.palette.geoViewColor.textColor.light[400],
    },
    '& .layerTitle > div': {
      color: theme.palette.geoViewColor.textColor.light[400],
    },

    '& .MuiListItemText-root': {
      marginLeft: '12px',
    },

    '& .MuiCollapse-vertical': {
      marginLeft: '6px',

      '& ul': {
        marginTop: 0,
        padding: 0,
      },
      '& li': {
        borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]}`,
        paddingLeft: '6px',
        marginBottom: '3px',
        fontWeight: '400',

        '&.unchecked': {
          borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]}`,
          fontStyle: 'italic',
          color: theme.palette.geoViewColor.textColor.light[600],
        },
      },
    },
  },
  collapsibleContainer: {
    width: '100%',
    padding: '10px 0',
    margin: '0px 10px',
  },
  legendInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  legendInstructionsBody: {
    fontSize: theme.palette.geoViewFontSize.default,
  },
  subList: {
    width: '100%',
    '& .MuiListItemIcon-root': {
      minWidth: '1rem',
    },
    '& img': {
      maxWidth: '1.5rem',
    },
  },
  layerStackIcons: {
    flexWrap: 'wrap',
    '& button': {
      padding: '0.25rem',
      '& svg': {
        width: '1.25rem',
        height: '1.25rem',
      },
    },
  },
});

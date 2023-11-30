import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  container: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  subtitle: {
    font: theme.footerPanel.titleFont,
    fontWeight: 'normal',
    fontSize: '0.9em',
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
    '& .layerTitle > .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
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
        borderLeft: '5px solid #848884',
        paddingLeft: '6px',
        marginBottom: '3px',
        fontWeight: '400',

        '&.unchecked': {
          borderLeft: '5px solid #bbbbbb',
          fontStyle: 'italic',
          color: '#a3a3a3',
        },
      },
    },
  },
  collapsibleContainer: {
    width: '100%',
    padding: '10px 0',
    margin: '0px 10px',
  },
});

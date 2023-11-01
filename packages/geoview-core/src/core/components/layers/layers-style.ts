import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',

    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 0 0 16px',
        height: '100%',
      },
      '& .MuiBox-root': {
        height: '100%',
        borderTopRightRadius: '4px',
        borderBottomRightRadius: '4px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },

    '& .MuiListItemIcon-root': {
      minWidth: '2.5rem',
      marginRight: '20px',
    },
    '& .MuiListItemText-root': {
      '>span': {
        fontSize: '1rem',
      },
      '> p': {
        fontSize: '0.875rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
  legendContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  legendTitle: {
    textAlign: 'left',
    fontFamily: 'Open Sans, Semibold',
    fontSize: '18px',
  },
  categoryTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  categoryTitle: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  legendButton: {
    font: 'normal normal medium 16px/611px Noto Sans Myanmar',
    color: '#515BA5',
    backgroundColor: '#F4F5FF',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  legendButtonText: {
    font: 'normal normal medium 16px/611px Noto Sans Myanmar',
    textTransform: 'capitalize',
    fontWeight: 'bold',
    color: '#515BA5',
    fontSize: '16px',
  },
  legendItemContainer: {
    border: '2px solid red',
    width: '100%',
  },
});

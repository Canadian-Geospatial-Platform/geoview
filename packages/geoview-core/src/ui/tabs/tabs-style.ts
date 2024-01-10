export const getSxClasses = () => ({
  rightIcons: {
    background: 'white',
    marginTop: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    height: '100%',
    borderTop: 1,
    paddingTop: '0 !important',
    borderColor: 'divider',
  },
  tab: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 'min(4vw, 24px)',
    padding: '16px 2%',
    textTransform: 'capitalize',
    '&.Mui-selected': {
      color: 'secondary.main',
    },
    '.MuiTab-iconWrapper': {
      marginRight: '7px',
      maxWidth: '18px',
    },
  },
});

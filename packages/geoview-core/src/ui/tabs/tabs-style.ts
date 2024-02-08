export const getSxClasses = () => ({
  rightIcons: {
    marginTop: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    borderTop: 1,
    paddingTop: '0 !important',
    borderColor: 'divider',
    height: '100%',
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
  mobileDropdown: {
    maxWidth: '200px',
    p: 6,
    '& .MuiInputBase-root': {
      borderRadius: '4px',
    },
    '& .MuiSelect-select': {
      padding: '8px 12px !important',
    },
  },
});

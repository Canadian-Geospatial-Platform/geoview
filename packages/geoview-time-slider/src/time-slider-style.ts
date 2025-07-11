// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): any => ({
  panelHeaders: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    marginBottom: '20px',
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: '0px 12px 9px -13px #E0E0E0',
  },
});

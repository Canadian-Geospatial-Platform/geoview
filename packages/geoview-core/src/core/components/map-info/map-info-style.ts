// map-info.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (): any => ({
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'noWrap',
    '& button': {
      cursor: 'pointer',
      margin: 'auto 0 auto auto',
    },
    justifyContent: 'end',
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },

  // map-info-expand-button.tsx
  expandButton: {
    display: { xs: 'none', sm: 'none', md: 'flex', lg: 'flex', xl: 'flex' },
  },
});

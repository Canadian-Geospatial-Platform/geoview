export const getSxClasses = () => ({
  slider: {
    height: 300,
    padding: '1.5rem 0.5rem 1.5rem 1rem',
    '& .MuiSlider-markLabel': {
      left: '33px',
      '&:nth-of-type(1)': {
        bottom: '3%',
      },
      '&:last-of-type': {
        bottom: '98%',
        left: '30px',
      },
    },
  },
});

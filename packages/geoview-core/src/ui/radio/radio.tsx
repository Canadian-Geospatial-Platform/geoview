import React from 'react';

import { Radio, RadioProps } from '@mui/material';

/**
 * Custom MUI Radio properties
 */
interface MaterialRadioProps extends RadioProps {
  // eslint-disable-next-line react/require-default-props
  mapId?: string;
}

/**
 * Create a Material UI Radio component
 *
 * @param {MaterialRadioProps} props custom radio properties
 * @returns {JSX.Element} the radio element
 */
// eslint-disable-next-line react/display-name
export const MaterialUIRadio = React.forwardRef((props: MaterialRadioProps, ref): JSX.Element => {
  return <Radio ref={ref as React.RefObject<HTMLButtonElement>} {...props} />;
});

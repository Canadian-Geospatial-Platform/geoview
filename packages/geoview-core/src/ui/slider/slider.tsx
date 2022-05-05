import MaterialSlider from '@mui/material/Slider';

import { TypeSliderProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI Slider component
 *
 * @param {TypeSliderProps} props custom slider properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Slider(props: TypeSliderProps): JSX.Element {
  return <MaterialSlider {...props} />;
}

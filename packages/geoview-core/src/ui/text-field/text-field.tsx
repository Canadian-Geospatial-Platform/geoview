import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import MaterialTextField from '@mui/material/TextField';
import { TypeTextFieldProps } from '../panel/panel-types';

/**
 * Create a Material UI TextField component
 *
 * @param {TypeTextFieldProps} props custom textfield properties
 * @returns {JSX.Element} the text field ui component
 */
export function TextField(props: TypeTextFieldProps): JSX.Element {
  const { tooltip, tooltipPlacement } = props;

  const { t } = useTranslation<string>();

  const textRef = useRef<HTMLElement>(null);

  return (
    <Tooltip title={t((tooltip as string) || '') as string} placement={tooltipPlacement} TransitionComponent={Fade} ref={textRef}>
      <MaterialTextField {...props} />
    </Tooltip>
  );
}

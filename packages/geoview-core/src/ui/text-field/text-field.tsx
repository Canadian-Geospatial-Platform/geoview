import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { Fade, TextField as MaterialTextField, Tooltip } from '@mui/material';

import { TypeTextFieldProps } from '@/ui/panel/panel-types';

/**
 * Create a Material UI TextField component
 *
 * @param {TypeTextFieldProps} props custom textfield properties
 * @returns {JSX.Element} the text field ui component
 */
export function TextField(props: TypeTextFieldProps): JSX.Element {
  const { tooltip, tooltipPlacement, ...rest } = props;

  const { t } = useTranslation<string>();

  // internal state
  const textRef = useRef<HTMLElement>(null);

  return (
    <Tooltip title={t((tooltip as string) || '') as string} placement={tooltipPlacement} TransitionComponent={Fade} ref={textRef}>
      <MaterialTextField {...props} {...rest} />
    </Tooltip>
  );
}

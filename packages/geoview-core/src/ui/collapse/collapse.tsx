import { memo } from 'react';
import { Collapse as MaterialCollapse, CollapseProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Collapse component.
 * This is a simple wrapper around MaterialCollapse that maintains
 * full compatibility with Material-UI's Collapse props.
 *
 * @param {CollapseProps} props - All valid Material-UI Collapse props
 * @returns {JSX.Element} The Collapse component
 */
export const Collapse = memo(function Collapse(props: CollapseProps): JSX.Element {
  logger.logTraceRender('ui/collapse/collapse', props);

  // Get constant from props
  const { children, className, style, timeout, unmountOnExit, ...rest } = props;

  // eslint-disable-next-line react/destructuring-assignment
  const inProp = props.in;

  return (
    <MaterialCollapse
      className={className || ''}
      style={style || undefined}
      in={inProp}
      timeout={timeout}
      unmountOnExit={unmountOnExit}
      {...rest}
    >
      {children !== undefined && children}
    </MaterialCollapse>
  );
});

import MaterialCollapse from '@mui/material/Collapse';
import { CollapseProps } from '@mui/material';

/**
 * Create a customized Material UI Collapse
 *
 * @param {Collapse} props the properties passed to the Collapse element
 * @returns {JSX.Element} the created Collapse element
 */
export function Collapse(props: CollapseProps): JSX.Element {
  const { children, className, style, timeout, unmountOnExit } = props;
  // eslint-disable-next-line react/destructuring-assignment
  const inProp = props.in;

  return (
    <MaterialCollapse
      className={`${className || ''}`}
      style={style || undefined}
      in={inProp}
      timeout={timeout}
      unmountOnExit={unmountOnExit}
    >
      {children !== undefined && children}
    </MaterialCollapse>
  );
}

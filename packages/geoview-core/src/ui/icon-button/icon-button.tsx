import React from "react";

import { IconButton as MaterialIconButton, Tooltip, Fade } from "@mui/material";

import { TypeIconButtonProps } from "../../core/types/cgpv-types";

/**
 * Create a customized Material UI Icon Button
 *
 * @param {TypeIconButtonProps} props the properties passed to the Icon Button element
 * @returns {JSX.Element} the created Icon Button element
 */
export function IconButton(props: TypeIconButtonProps): JSX.Element {
  const { className, style, children, onClick, "aria-label": ariaLabel, tooltip, tooltipPlacement, id, tabIndex, iconRef, size } = props;

  return (
    <Tooltip title={tooltip || ""} placement={tooltipPlacement} TransitionComponent={Fade}>
      <MaterialIconButton
        id={id}
        aria-label={ariaLabel}
        style={style}
        className={className}
        onClick={onClick}
        tabIndex={tabIndex}
        size={size}
        ref={iconRef}
      >
        {children && children}
      </MaterialIconButton>
    </Tooltip>
  );
}

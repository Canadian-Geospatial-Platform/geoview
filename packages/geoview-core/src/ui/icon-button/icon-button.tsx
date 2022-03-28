import React, { CSSProperties } from "react";

import { IconButton as MaterialIconButton, Tooltip, TooltipProps, Fade } from "@mui/material";

import { TypeChildren, TypeFunction } from "../../core/types/cgpv-types";

/**
 * Properties for the icon button
 */
interface IconButtonProps {
  children?: TypeChildren;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  ariaLabel?: string;
  onClick?: TypeFunction;
  tooltip?: string;
  tooltipPlacement?: TooltipProps["placement"];
  id?: string | undefined;
  tabIndex?: number | undefined;
  iconRef?: React.RefObject<any> | null | undefined;
  size?: "small" | "medium" | "large";
}

/**
 * Create a customized Material UI Icon Button
 *
 * @param {IconButtonProps} props the properties passed to the Icon Button element
 * @returns {JSX.Element} the created Icon Button element
 */

export function IconButton(props: IconButtonProps): JSX.Element {
  const { className, style, children, onClick, ariaLabel, tooltip, tooltipPlacement, id, tabIndex, iconRef, size } = props;

  return (
    <Tooltip title={tooltip || ""} placement={tooltipPlacement || undefined} TransitionComponent={Fade}>
      <MaterialIconButton
        id={id || undefined}
        aria-label={ariaLabel || undefined}
        style={style || undefined}
        className={className || undefined}
        onClick={onClick || undefined}
        tabIndex={tabIndex || undefined}
        size={size || undefined}
        ref={iconRef || undefined}
      >
        {children && children}
      </MaterialIconButton>
    </Tooltip>
  );
}

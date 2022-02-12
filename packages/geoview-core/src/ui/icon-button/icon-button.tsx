import React, { CSSProperties } from "react";

import {
  IconButton as MaterialIconButton,
  Tooltip,
  TooltipProps,
  Fade,
} from "@mui/material";

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
  tabIndex?: string | number | undefined;
}

/**
 * Create a customized Material UI Icon Button
 *
 * @param {IconButtonProps} props the properties passed to the Icon Button element
 * @returns {JSX.Element} the created Icon Button element
 */

export const IconButton = (props: IconButtonProps): JSX.Element => {
    const {
      className,
      style,
      children,
      onClick,
      ariaLabel,
      tooltip,
      tooltipPlacement,
      id,
      tabIndex,
    } = props;

    return (
        <Tooltip
            title={tooltip ? tooltip : ""}
            placement={tooltipPlacement ? tooltipPlacement : undefined}
            TransitionComponent={Fade}
        >
            <MaterialIconButton
                id={id ? id : undefined}
                aria-label={ariaLabel ? ariaLabel : undefined}
                style={style ? style : undefined}
                className={className ? className : undefined}
                onClick={onClick ? onClick : undefined}
                tabIndex={tabIndex ? tabIndex : undefined}
            >
                {children && children}
        </MaterialIconButton>
      </Tooltip>
    );
}
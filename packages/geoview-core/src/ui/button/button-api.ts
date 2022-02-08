import { TooltipProps } from "@material-ui/core";
import { CSSProperties } from "react";

import {
  TypeChildren,
  TypeButtonProps,
  TypeFunction,
} from "../../core/types/cgpv-types";

/**
 * Class used to handle creating a new button
 *
 * @export
 * @class Button
 */
export class ButtonApi {
  // generated button id
  id?: string;

  // button tooltip
  tooltip?: string;

  // location of the tooltip (left, right,...)
  tooltipPlacement: TooltipProps["placement"];

  // type of button (text, textWithIcon, icon)
  type: "text" | "textWithIcon" | "icon";

  // state of the button (expanded, collapsed)
  state?: "expanded" | "collapsed";

  // style variant of the button (text, contained, outlined)
  variant?: "text" | "contained" | "outlined";

  // custom class names
  className?: string | undefined;

  // custom style properties
  style?: CSSProperties | undefined;

  // children for the button
  children?: TypeChildren;

  // autofocus used for accessibility to enable auto focus
  autoFocus?: boolean;

  // button icon
  icon?: TypeChildren;

  // optional callback function to run on button click
  callback?: TypeFunction;

  // on click function handeler
  onClick?: TypeFunction;

  // optional value used to check if the button will be visible on the appbar/navbar (default true)
  visible?: boolean = true;

  /**
   * Initialize a new button
   *
   * @param button the passed in button properties when button is created
   */
  constructor(button: TypeButtonProps) {
    this.id = button.id;
    this.icon = button.icon;
    this.tooltip = button.tooltip;
    this.tooltipPlacement = button.tooltipPlacement;
    this.callback = button.callback;
    this.autoFocus = button.autoFocus;
    this.onClick = button.onClick;
    this.children = button.children;
    this.className = button.className;
    this.style = button.style;
    this.variant = button.variant;
    this.type = button.type;
    this.state = button.state;
    this.visible = button.visible !== undefined ? button.visible : true;
  }
}

import { ReactNode } from 'react';
import { TooltipProps, ButtonProps, TextFieldProps } from '@mui/material';

import { TypeJsonValue } from '@/core/types/global-types';
import { TypeIconButtonProps } from '../icon-button/icon-button-types';
import { PanelApi } from './panel-api';

/** ******************************************************************************************************************************
 * Interface used to initialize a button panel.
 */
export type TypeButtonPanelProps = {
  /** Panel properties. */
  panel: TypePanelProps;
  /** Button properties. */
  button: TypeButtonProps;
};

/** ******************************************************************************************************************************
 * type for the panel properties used when creating a new panel.
 */
export type TypePanelProps = {
  /** Panel id. */
  panelId?: string;
  /** Panel type (app-bar, nav-bar). */
  type?: string;
  /** Panel open status (open/closed). */
  status?: boolean;
  /** Width of the panel. */
  width: string | number;
  /** Panel header icon. */
  icon: ReactNode;
  /** Panel header title. */
  title: string | TypeJsonValue;
  /** Panel body content. */
  content?: ReactNode;
  /** Custom panel styles */
  panelStyles?: PanelStyles;
  /** Handler callback triggered when a panel is fully opened */
  handlePanelOpened?: () => void;
};

export interface PanelStyles {
  /** Panel/Card Container style object */
  panelContainer?: { [key: string]: string };
  /** Panel/Card Wrapper style object */
  panelCard?: { [key: string]: string };
  /** Panel/Card header style object */
  panelCardHeader?: { [key: string]: string };
  /** Panel/Card content style object */
  panelCardContent?: { [key: string]: string };
}

/** ******************************************************************************************************************************
 * Interface for the button properties used when creating a new button.
 */
export interface TypeButtonProps extends Omit<ButtonProps, 'type'> {
  /** Button tooltip. */
  tooltip?: string;
  /** Location for tooltip. */
  tooltipPlacement?: TooltipProps['placement'];
  /** Button icon. */
  icon?: ReactNode;
  /** Optional class names */
  iconClassName?: string;
  /** Optional class names. */
  textClassName?: string;
  /** Button state. */
  state?: 'expanded' | 'collapsed';
  /** Button type. */
  type: 'text' | 'textWithIcon' | 'icon';
  /** Button visibility. */
  visible?: boolean;
}

/** ******************************************************************************************************************************
 * Interface for the text properties used when creating a new text field.
 */
export interface TypeTextFieldProps extends Omit<TextFieldProps, 'type'> {
  /** Text tooltip. */
  tooltip?: string;
  /** Location for tooltip. */
  tooltipPlacement?: TooltipProps['placement'];
}

// ! Check if it must be deleted.
// TODO: used in layer-panel packages... check if we can merge
/** ******************************************************************************************************************************
 * Interface for the button properties used when creating a new button.
 */
export interface ButtonPropsLayerPanel {
  isFirst?: boolean;
  isLast?: boolean;
  handleNext: () => void;
}

/** ******************************************************************************************************************************
 * Interface used when creating a new button panel.
 */
export type TypeButtonPanel = {
  /** Panel identifier. */
  buttonPanelId: string;
  /** Pasnel API. */
  panel?: PanelApi;
  /** Button used by the panel. */
  button: TypeIconButtonProps;
  /** Group name. */
  groupName?: string;
};

/** ******************************************************************************************************************************
 * constant that defines the panel types.
 */
export const CONST_PANEL_TYPES = {
  APPBAR: 'app-bar',
  NAVBAR: 'nav-bar',
};

export const TRANSITION_PERIOD = 300;

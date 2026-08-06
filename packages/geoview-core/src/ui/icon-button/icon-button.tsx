import type { ReactNode, RefObject } from 'react';
import type { TooltipProps, IconButtonProps } from '@mui/material';
import { Fade, IconButton as MaterialIconButton, Tooltip } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Custom properties for the IconButton component.
 *
 * Extends Material-UI's IconButtonProps with tooltip support and accessibility enhancements.
 *
 * @property children - The icon or content to display inside the button
 * @property aria-label - Accessible label for screen readers (pre-translated string)
 * @property aria-disabled - Optional ARIA attribute to mark button as disabled without disabling pointer events (accepts boolean or string values per React standard)
 * @property tooltip - Optional tooltip text (pre-translated string). Defaults to aria-label if omitted, set to null to disable
 * @property tooltipPlacement - Optional position of the tooltip (top, bottom, left, right, etc.)
 * @property tabIndex - Optional tab order for keyboard navigation
 * @property iconRef - Optional ref to access the button element
 * @property visible - Optional controls button visibility
 *
 * @see {@link IconButtonProps} for additional inherited props from Material-UI
 */
export interface IconButtonPropsExtend extends Omit<IconButtonProps, 'aria-label'> {
  children?: ReactNode;
  'aria-label': string;
  'aria-disabled'?: React.AriaAttributes['aria-disabled'];
  tooltip?: string | null;
  tooltipPlacement?: TooltipProps['placement'];
  tabIndex?: number;
  iconRef?: RefObject<HTMLButtonElement | null>;
  visible?: boolean;
}

/**
 * Creates a Material-UI IconButton component with optional tooltip support.
 *
 * Wraps Material-UI's IconButton to provide accessible icon-based button control
 * with built-in tooltip support. Requires aria-label for accessibility compliance.
 * Tooltip can either use the aria-label or be customized via tooltip prop.
 * All Material-UI IconButton props are supported and passed through directly.
 *
 * **IMPORTANT:** This component expects pre-translated strings for `aria-label` and `tooltip`.
 * Always call `t()` before passing values to this component.
 *
 * **Note on NavBar/AppBar configs:** When configuring buttons for NavBar/AppBar components,
 * those configs accept translation keys (e.g., `'mapnav.zoomIn'`), which the bar components
 * translate internally before passing to IconButton. This is a config-level pattern — the
 * IconButton component itself still receives pre-translated strings.
 *
 * @param props - IconButton configuration (see IconButtonPropsExtend interface)
 * @returns The icon button component
 *
 * @example
 * ```tsx
 * // Direct usage with translation (standard pattern)
 * const { t } = useTranslation();
 * <IconButton aria-label={t('general.delete')}>
 *   <DeleteIcon />
 * </IconButton>
 *
 * // With implicit tooltip (uses aria-label)
 * <IconButton
 *   aria-label={t('general.delete')}
 *   tooltipPlacement="top"
 * >
 *   <DeleteIcon />
 * </IconButton>
 *
 * // With explicit tooltip
 * <IconButton
 *   aria-label={t('general.delete')}
 *   tooltip={t('general.deleteItemPermanently')}
 *   tooltipPlacement="top"
 * >
 *   <DeleteIcon />
 * </IconButton>
 *
 * // Tooltip disabled (no tooltip on hover)
 * <IconButton
 *   aria-label={t('general.close')}
 *   tooltip={null}
 * >
 *   <CloseIcon />
 * </IconButton>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-button/#icon-button}
 */
function IconButtonUI(props: IconButtonPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/icon-button/icon-button');

  // Get constant from props
  const {
    sx,
    className,
    style,
    children,
    onClick,
    'aria-label': ariaLabel,
    'aria-disabled': ariaDisabled,
    tooltip,
    tooltipPlacement,
    id,
    tabIndex,
    iconRef,
    size,
    disabled,
    color,
    ...rest
  } = props;

  // Render button without tooltip wrapper if disabled or tooltip explicitly set to null
  // Otherwise wrap with Tooltip component (using tooltip prop or aria-label as fallback)
  function createIconButtonUI(): JSX.Element {
    return (
      <MaterialIconButton
        id={id}
        sx={sx}
        aria-label={ariaLabel}
        aria-disabled={ariaDisabled}
        style={style}
        className={className}
        onClick={onClick}
        tabIndex={tabIndex}
        size={size}
        ref={iconRef}
        disabled={disabled}
        color={color}
        {...rest}
      >
        {children}
      </MaterialIconButton>
    );
  }

  if (disabled || tooltip === null) {
    return createIconButtonUI();
  }

  return (
    <Tooltip title={tooltip || ariaLabel} placement={tooltipPlacement} slots={{ transition: Fade }}>
      {createIconButtonUI()}
    </Tooltip>
  );
}

export const IconButton = IconButtonUI;

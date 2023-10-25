import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/styles';

import { Button as MaterialButton, Fade, Tooltip, Box } from '@mui/material';

import { Cast } from '@/core/types/global-types';

import { HtmlToReact } from '@/core/containers/html-to-react';
import { TypeButtonProps } from '../panel/panel-types';
import { getSxClasses } from './button-style';

/**
 * Create a customized Material UI button
 *
 * @param {TypeButtonProps} props the properties of the Button UI element
 * @returns {JSX.Element} the new UI element
 */
export function Button(props: TypeButtonProps): JSX.Element {
  const [content, setContent] = useState<ReactNode>();

  const {
    sx,
    variant,
    tooltip,
    tooltipPlacement,
    onClick,
    icon,
    className,
    iconClassName,
    textClassName,
    style,
    children,
    type,
    state,
    autoFocus,
    disabled,
  } = props;

  const { t } = useTranslation<string>();

  const buttonRef = useRef<HTMLElement>(null);
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const sxProps = {
    ...sx,
    ...(theme.palette.mode === 'light' && {
      backgroundColor: 'primary.light',
      color: 'primary.dark',
      '&:hover': { backgroundColor: 'primary.main', color: 'white' },
    }),
  };

  const textStyle = {
    width: '100%',
    TextAlign: 'center',
    TextTransform: 'none',
    MarginLeft: 20,
    Display: 'flex',
    JustifyContent: 'center',
    '& $buttonClass': {
      JustifyContent: 'flex-start',
    },
  };
  /**
   * Get text container with provided text content
   *
   * @returns {ReactNode} return the text container
   */
  const getText = useCallback((): ReactNode => {
    let textContent: ReactNode;
    if (children === undefined) {
      textContent = <div />;
    } else if (typeof children === 'string') {
      textContent = (
        <HtmlToReact
          className={`${textClassName}`}
          style={{ ...textStyle, ...(type === 'text' ? { marginLeft: 'initial' } : {}) }}
          htmlContent={children}
        />
      );
    } else {
      textContent = (
        <Box sx={sxClasses.text} className={`${textClassName}`} style={type === 'text' ? { marginLeft: 'initial' } : {}}>
          {children}
        </Box>
      );
    }

    return textContent;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, sxClasses.text, textClassName, type]);

  /**
   * Get icon container with provided icon content
   *
   * @returns {ReactNode} returns icon container
   */
  const getIcon = useCallback((): ReactNode => {
    let iconContent: ReactNode;

    if (icon === undefined) {
      iconContent = <div />;
    } else if (typeof icon === 'string') {
      iconContent = <HtmlToReact className={`${sxClasses.icon} ${iconClassName}`} htmlContent={icon} />;
    } else {
      iconContent = <div className={`${sxClasses.icon} ${iconClassName}`}>{icon}</div>;
    }

    return iconContent;
  }, [sxClasses.icon, icon, iconClassName]);

  /**
   * Create a text only button
   *
   * @returns {ReactNode} return the created text button
   */
  const createTextButton = useCallback((): ReactNode => {
    return getText();
  }, [getText]);

  /**
   * Create an icon only button
   *
   * @returns {ReactNode} return the created icon button
   */
  const createIconButton = useCallback((): ReactNode => {
    return getIcon();
  }, [getIcon]);

  /**
   * Create a button with icon and text
   *
   * @returns {ReactNode} return a button with an icon and text
   */
  const createTextIconButton = useCallback((): ReactNode => {
    return (
      <Box sx={sxClasses.textIconContainer}>
        {getIcon()}
        {state !== undefined && state === 'expanded' && getText()}
      </Box>
    );
  }, [sxClasses.textIconContainer, getIcon, getText, state]);

  useEffect(() => {
    // disable events on container
    const newButtonChildrenHTMLElements = Cast<HTMLElement[]>(buttonRef.current?.children);
    if (newButtonChildrenHTMLElements.length > 0) {
      // TODO disable map events
    }

    // check button type
    if (type) {
      if (type === 'text') {
        setContent(createTextButton());
      } else if (type === 'textWithIcon') {
        setContent(createTextIconButton());
      } else if (type === 'icon') {
        setContent(createIconButton());
      }
    }
  }, [createIconButton, createTextButton, createTextIconButton, state, type]);

  return (
    <Tooltip title={t((tooltip as string) || '') as string} placement={tooltipPlacement} TransitionComponent={Fade} ref={buttonRef}>
      <MaterialButton
        sx={{ ...sxClasses.buttonClass, ...sxProps }}
        variant={variant || 'text'}
        className={`${className || ''}`}
        style={style}
        onClick={onClick}
        autoFocus={autoFocus}
        disabled={disabled}
      >
        {content}
      </MaterialButton>
    </Tooltip>
  );
}

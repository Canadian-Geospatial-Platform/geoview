import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';
import { useTheme } from '@mui/styles';

import { Button as MaterialButton, Fade, Tooltip } from '@mui/material';

import { Cast } from '@/core/types/global-types';

import { HtmlToReact } from '@/core/containers/html-to-react';
import { TypeButtonProps } from '../panel/panel-types';

const useStyles = makeStyles((theme) => ({
  textIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.primary.dark,
  },
  text: {
    width: '100%',
    textAlign: 'center',
    textTransform: 'none',
    marginLeft: 20,
    display: 'flex',
    justifyContent: 'center',
    '& $buttonClass': {
      justifyContent: 'flex-start',
    },
  },
  buttonClass: {
    display: 'flex',
    fontSize: theme.typography.fontSize,
    paddingLeft: 18,
    paddingRight: 20,
    justifyContent: 'center',
    width: '100%',
    height: 50,
  },
}));

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
  const classes = useStyles();
  const sxProps = {
    ...sx,
    ...(theme.palette.mode === 'light' && {
      backgroundColor: 'primary.light',
      color: 'primary.dark',
      '&:hover': { backgroundColor: 'primary.main', color: 'white' },
    }),
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
          className={`${classes.text} ${textClassName}`}
          style={type === 'text' ? { marginLeft: 'initial' } : {}}
          htmlContent={children}
        />
      );
    } else {
      textContent = (
        <div className={`${classes.text} ${textClassName}`} style={type === 'text' ? { marginLeft: 'initial' } : {}}>
          {children}
        </div>
      );
    }

    return textContent;
  }, [children, classes.text, textClassName, type]);

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
      iconContent = <HtmlToReact className={`${classes.icon} ${iconClassName}`} htmlContent={icon} />;
    } else {
      iconContent = <div className={`${classes.icon} ${iconClassName}`}>{icon}</div>;
    }

    return iconContent;
  }, [classes.icon, icon, iconClassName]);

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
      <div className={classes.textIconContainer}>
        {getIcon()}
        {state !== undefined && state === 'expanded' && getText()}
      </div>
    );
  }, [classes.textIconContainer, getIcon, getText, state]);

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
        sx={sxProps}
        variant={variant || 'text'}
        className={`${classes.buttonClass} ${className || ''}`}
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

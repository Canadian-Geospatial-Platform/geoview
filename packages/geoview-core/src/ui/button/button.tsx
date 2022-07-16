import { useRef, useState, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import MaterialButton from '@mui/material/Button';

import { Cast, TypeButtonProps } from '../../core/types/cgpv-types';

import { HtmlToReact } from '../../core/containers/html-to-react';

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
    '&:hover *': {
      fontSize: '1.6rem',
    },
  },
  text: {
    width: '100%',
    textAlign: 'center',
    textTransform: 'none',
    marginLeft: 20,
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
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.dark,
    },
  },
}));

/**
 * Create a customized Material UI button
 *
 * @param {TypeButtonProps} props the properties of the Button UI element
 * @returns {JSX.Element} the new UI element
 */
export function Button(props: TypeButtonProps): JSX.Element {
  const [content, setContent] = useState<React.ReactNode>();

  const {
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

  const classes = useStyles();

  /**
   * Get text container with provided text content
   *
   * @returns {React.ReactNode} return the text container
   */
  const getText = useCallback((): React.ReactNode => {
    let textContent: React.ReactNode;

    if (typeof children === 'undefined') {
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
   * @returns {React.ReactNode} returns icon container
   */
  const getIcon = useCallback((): React.ReactNode => {
    let iconContent: React.ReactNode;

    if (typeof icon === 'undefined') {
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
   * @returns {React.ReactNode} return the created text button
   */
  const createTextButton = useCallback((): React.ReactNode => {
    return getText();
  }, [getText]);

  /**
   * Create an icon only button
   *
   * @returns {React.ReactNode} return the created icon button
   */
  const createIconButton = useCallback((): React.ReactNode => {
    return getIcon();
  }, [getIcon]);

  /**
   * Create a button with icon and text
   *
   * @returns {React.ReactNode} return a button with an icon and text
   */
  const createTextIconButton = useCallback((): React.ReactNode => {
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

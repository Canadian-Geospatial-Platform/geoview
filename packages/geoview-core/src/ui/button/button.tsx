import { useRef, useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { DomEvent } from 'leaflet';

import makeStyles from '@mui/styles/makeStyles';
import { Tooltip, Fade, Button as MaterialButton } from '@mui/material';

import { Cast, TypeChildren, TypeButtonProps } from '../../core/types/cgpv-types';

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
  const [content, setContent] = useState<TypeChildren>();

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

  const getText = (): TypeChildren => {
    return typeof children === 'undefined' ? (
      <div />
    ) : typeof children === 'string' ? (
      <HtmlToReact
        className={`${classes.text} ${textClassName}`}
        style={type === 'text' ? { marginLeft: 'initial' } : {}}
        htmlContent={children}
      />
    ) : (
      <div className={`${classes.text} ${textClassName}`} style={type === 'text' ? { marginLeft: 'initial' } : {}}>
        {children}
      </div>
    );
  };

  const getIcon = (): TypeChildren => {
    return typeof icon === 'undefined' ? (
      <div />
    ) : typeof icon === 'string' ? (
      <HtmlToReact className={`${classes.icon} ${iconClassName}`} htmlContent={icon} />
    ) : (
      <div className={`${classes.icon} ${iconClassName}`}>{icon}</div>
    );
  };

  const createTextButton = (): TypeChildren => {
    return getText();
  };

  const createIconButton = (): TypeChildren => {
    return getIcon();
  };

  const createTextIconButton = (): TypeChildren => {
    return (
      <div className={classes.textIconContainer}>
        {getIcon()}
        {state !== undefined && state === 'expanded' && getText()}
      </div>
    );
  };

  useEffect(() => {
    // disable events on container
    const newButtonChildrenHTMLElements = Cast<HTMLElement[]>(buttonRef.current?.children);
    if (newButtonChildrenHTMLElements.length > 0) {
      DomEvent.disableClickPropagation(newButtonChildrenHTMLElements[0]);
      DomEvent.disableScrollPropagation(newButtonChildrenHTMLElements[0]);
    }

    if (type) {
      if (type === 'text') {
        setContent(createTextButton());
      } else if (type === 'textWithIcon') {
        setContent(createTextIconButton());
      } else if (type === 'icon') {
        setContent(createIconButton());
      }
    }
  }, [state]);

  return (
    <Tooltip title={Cast<string>(t(tooltip || ''))} placement={tooltipPlacement} TransitionComponent={Fade} ref={buttonRef}>
      <MaterialButton
        variant={variant || 'text'}
        className={`${classes.buttonClass} ${className || ''}`}
        style={style || undefined}
        onClick={onClick}
        autoFocus={autoFocus !== undefined && autoFocus ? autoFocus : undefined}
        disabled={disabled || undefined}
      >
        {content}
      </MaterialButton>
    </Tooltip>
  );
}

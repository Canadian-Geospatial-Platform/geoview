/* eslint-disable no-nested-ternary */
import React from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Tooltip, Fade, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';

import { HtmlToReact } from '../../common/containers/html-to-react';
import { styles } from '../../assests/style/theme';

const useStyles = makeStyles((theme) => ({
    listItem: {
        height: '40px',
    },
    listItemColor: {
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.dark,
        },
    },
}));

/**
 * Create a button with an icon and text
 * @param {ButtonAppProps} props Button properties
 */
export default function ButtonApp(props: ButtonAppProps): JSX.Element {
    const { id, tooltip, icon, onClickFunction, content } = props;
    const classes = useStyles();
    const { t } = useTranslation<string>();

    const Icon = (icon as React.ReactElement).type;

    return (
        <Tooltip title={t(tooltip)} placement="right" TransitionComponent={Fade}>
            <ListItem button id={id} onClick={onClickFunction} className={classes.listItem}>
                <ListItemIcon className={classes.listItemColor}>
                    {typeof icon === 'string' ? (
                        <HtmlToReact style={styles.buttonIcon} htmlContent={icon} />
                    ) : (
                        <Icon style={styles.buttonIcon} />
                    )}
                </ListItemIcon>
                {typeof content === 'undefined' ? (
                    <ListItemText className={classes.listItemColor} primary={t(tooltip)} />
                ) : typeof content === 'string' ? (
                    <HtmlToReact htmlContent={content} />
                ) : (
                    content
                )}
            </ListItem>
        </Tooltip>
    );
}

interface ButtonAppProps {
    id: string;
    tooltip: string;
    icon: React.ReactNode | Element;
    onClickFunction: () => void;
    // eslint-disable-next-line react/require-default-props
    content?: Element;
}

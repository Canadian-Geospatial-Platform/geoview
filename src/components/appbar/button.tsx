/* eslint-disable no-nested-ternary */
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Tooltip, Fade, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';

import { HtmlToReact } from '../../common/containers/html-to-react';

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
    const { tooltip, icon, onClickFunction, content } = props;
    const classes = useStyles();
    const { t } = useTranslation();

    return (
        <Tooltip title={t(tooltip)} placement="right" TransitionComponent={Fade}>
            <ListItem button onClick={onClickFunction} className={classes.listItem}>
                <ListItemIcon className={classes.listItemColor}>
                    {typeof icon === 'string' ? <HtmlToReact htmlContent={icon} /> : icon}
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
    tooltip: string;
    icon: React.ReactNode;
    onClickFunction: () => void;
    // eslint-disable-next-line react/require-default-props
    content?: Element;
}

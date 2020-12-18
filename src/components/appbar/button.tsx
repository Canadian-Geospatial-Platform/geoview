import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';
import { Tooltip, Fade, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    listItem: {
        height: '40px',
    },
    listItemColor: {
        color: '#666666',
        '&:hover': {
            backgroundColor: '#fff',
            color: '#000',
        },
    }
}));

export default function ButtonApp(props: ButtonAppProps): JSX.Element {
    const { tooltip, icon, onClickFunction, content } = props;
    const classes = useStyles();
    const { t } = useTranslation();

    return (
        <Tooltip title={t(tooltip)} placement="right" TransitionComponent={Fade}>
            <ListItem button onClick={onClickFunction} className={classes.listItem}>
                <ListItemIcon className={classes.listItemColor}>{icon}</ListItemIcon>
                {typeof content === 'undefined' ? <ListItemText className={classes.listItemColor} primary={t(tooltip)} /> : content}
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

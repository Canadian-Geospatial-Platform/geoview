import { makeStyles } from '@material-ui/core/styles';
import GitHubIcon from '@material-ui/icons/GitHub';

import ButtonApp from '../button';

import { GITUHUB_REPO } from '../../../common/constant';
import { Cast, TypeAppVersion } from '../../../types/cgpv-types';
// eslint-disable-next-line no-underscore-dangle
declare const __VERSION__: TypeAppVersion;

const useStyles = makeStyles((theme) => ({
    github: {
        textAlign: 'center',
        margin: theme.spacing(3),
        '& .cgp-version': {
            fontWeight: 'bold',
            display: 'block',
            fontSize: theme.typography.subtitle1,
            '& .cgp-hash': {
                display: 'inline',
                fontWeight: 'normal',
                fontSize: theme.typography.subtitle2,
            },
        },
        '& .cgp-timestamp': {
            fontWeight: 'normal',
            fontSize: theme.typography.subtitle2,
        },
    },
}));

export default function Version(): JSX.Element {
    const classes = useStyles();

    function getRepo(): void {
        window.open(GITUHUB_REPO, '_blank');
    }

    function getVersion(): string {
        return `v.${__VERSION__.major}.${__VERSION__.minor}.${__VERSION__.patch}`;
    }
    function getHash(): string {
        return `[#${__VERSION__.hash.slice(0, 6)}]`;
    }
    function getTimestamp(): string {
        return new Date(__VERSION__.timestamp).toLocaleDateString();
    }

    return (
        <ButtonApp
            id="version-button"
            tooltip="appbar.version"
            icon={<GitHubIcon />}
            onClickFunction={getRepo}
            content={Cast<Element>(
                <div className={classes.github}>
                    <span className="cgp-version">
                        {getVersion()}
                        <span className="cgp-hash">{`  ${getHash()}`}</span>
                    </span>
                    <span className="cgp-timestamp">{getTimestamp()}</span>
                </div>
            )}
        />
    );
}

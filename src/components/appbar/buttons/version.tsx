import { makeStyles } from '@material-ui/core/styles';
import GitHubIcon from '@material-ui/icons/GitHub';

import ButtonApp from '../button';

import { AppVersion, GITUHUB_REPO } from '../../../common/constant';
// eslint-disable-next-line no-underscore-dangle
declare const __VERSION__: AppVersion;

const useStyles = makeStyles(() => ({
    github: {
        textAlign: 'center',
        margin: '5px',
        '& .cgp-version': {
            fontWeight: 'bold',
            display: 'block',
            fontSize: '0.8rem',

            '& .cgp-hash': {
                display: 'inline',
                fontWeight: 'normal',
                fontSize: '0.7rem',
            },
        },
        '& .cgp-timestamp': {
            fontWeight: 'normal',
            fontSize: '0.7rem',
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
            tooltip="appbar.version"
            icon={<GitHubIcon />}
            onClickFunction={getRepo}
            content={
                ((
                    <div className={classes.github}>
                        <span className="cgp-version">
                            {getVersion()}
                            <span className="cgp-hash">{`  ${getHash()}`}</span>
                        </span>
                        <span className="cgp-timestamp">{getTimestamp()}</span>
                    </div>
                ) as unknown) as Element
            }
        />
    );
}

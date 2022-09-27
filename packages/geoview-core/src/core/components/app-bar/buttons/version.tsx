import makeStyles from '@mui/styles/makeStyles';

import { GITUHUB_REPO } from '../../../utils/constant';

import { Button, GitHubIcon } from '../../../../ui';

// eslint-disable-next-line no-underscore-dangle
declare const __VERSION__: TypeAppVersion;

/**
 * An object containing version information.
 *
 * @export
 * @interface TypeAppVersion
 */
export type TypeAppVersion = {
  hash: string;
  major: number;
  minor: number;
  patch: number;
  timestamp: string;
};

const useStyles = makeStyles((theme) => {
  return {
    github: {
      textAlign: 'center',
      lineHeight: theme.typography.subtitle1.lineHeight,
      '& .cgp-version': {
        fontWeight: 'bold',
        display: 'block',
        fontSize: theme.typography.subtitle1.fontSize,
      },
      '& .cgp-timestamp': {
        fontWeight: 'normal',
        fontSize: theme.typography.subtitle2.fontSize,
      },
    },
  };
});

interface VersionProps {
  drawerStatus: boolean;
}

export default function Version(props: VersionProps): JSX.Element {
  const { drawerStatus } = props;

  const classes = useStyles();

  function getRepo(): void {
    window.open(GITUHUB_REPO, '_blank');
  }

  function getVersion(): string {
    return `v.${__VERSION__.major}.${__VERSION__.minor}.${__VERSION__.patch}`;
  }

  function getTimestamp(): string {
    return new Date(__VERSION__.timestamp).toLocaleDateString();
  }

  return (
    <Button
      id="version-button"
      variant="text"
      tooltip="appbar.version"
      tooltipPlacement="right"
      type="textWithIcon"
      onClick={() => getRepo()}
      icon={<GitHubIcon />}
      className=""
      state={drawerStatus ? 'expanded' : 'collapsed'}
    >
      <div className={classes.github}>
        <span className="cgp-version">{getVersion()}</span>
        <span className="cgp-timestamp">{getTimestamp()}</span>
      </div>
    </Button>
  );
}

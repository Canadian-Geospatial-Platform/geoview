import { makeStyles } from "@material-ui/core/styles";
import GitHubIcon from "@material-ui/icons/GitHub";

import { GITUHUB_REPO } from "../../../utils/constant";
import { Cast, TypeAppVersion } from "../../../types/cgpv-types";

import { Button } from "../../../../ui";

// eslint-disable-next-line no-underscore-dangle
declare const __VERSION__: TypeAppVersion;

const useStyles = makeStyles((theme) => {
  return {
    github: {
      textAlign: "center",
      lineHeight: theme.typography.subtitle1.lineHeight,
      "& .cgp-version": {
        fontWeight: "bold",
        display: "block",
        fontSize: theme.typography.subtitle1.fontSize,
      },
      "& .cgp-timestamp": {
        fontWeight: "normal",
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
    window.open(GITUHUB_REPO, "_blank");
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
    <Button
      id="version-button"
      variant="text"
      tooltip="appbar.version"
      tooltipPlacement="right"
      type="textWithIcon"
      onClick={getRepo}
      icon={<GitHubIcon />}
      className=""
      children={Cast<Element>(
        <div className={classes.github}>
          <span className="cgp-version">{getVersion()}</span>
          <span className="cgp-timestamp">{getTimestamp()}</span>
        </div>
      )}
      state={drawerStatus ? "expanded" : "collapsed"}
    />
  );
}

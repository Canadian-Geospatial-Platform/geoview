import React from 'react';

import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
  attributionContainer: {
    display: 'flex',
    padding: theme.spacing(0, 4),
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    alignItems: 'center',
  },
  attributionText: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
}));

type AttributionProps = {
  attribution: string;
};

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 * @param {AttributionProps} props attribution properties to get the attribution text
 */
export function Attribution(props: AttributionProps): JSX.Element {
  const { attribution } = props;

  const classes = useStyles();

  return (
    <div className={classes.attributionContainer}>
      <span className={classes.attributionText}>{attribution}</span>
    </div>
  );
}

import { List as MaterialList } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  list: {
    padding: 0,
  },
}));

interface ListProps {
  children?: JSX.Element | (JSX.Element | null)[] | JSX.Element[];
}

export const List = (props: ListProps) => {
  const { children } = props;

  const classes = useStyles();

  return (
    <MaterialList className={classes.list}>
      {children !== undefined && children}
    </MaterialList>
  );
};

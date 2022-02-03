import { List as MaterialList } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  list: {
    padding: 0,
  },
}));

/**
 * Properties for the List UI
 */
interface ListProps {
  children?: JSX.Element | (JSX.Element | null)[] | JSX.Element[];
}

/**
 * Create a customized Material UI List
 *
 * @param {ListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export const List = (props: ListProps) => {
  const { children } = props;

  const classes = useStyles();

  return (
    <MaterialList className={classes.list}>
      {children !== undefined && children}
    </MaterialList>
  );
};

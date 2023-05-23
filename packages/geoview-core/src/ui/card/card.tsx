/* eslint-disable react/require-default-props */
import { CardProps } from '@mui/material';
import MaterialCard from '@mui/material/Card';
import MaterialCardHeader from '@mui/material/CardHeader';
import MaterialCardContent from '@mui/material/CardContent';

export interface TypeCardProps extends CardProps {
  title?: string;
  contentCard?: React.ReactNode | Element;
}

/**
 * Create a customized Material UI Card
 *
 * @param {TypeCardProps} props the properties passed to the Card element
 * @returns {JSX.Element} the created Card element
 */

// TODO - KenChase MaterialCardHeader component is hard-coded as h3. It should be passed as a prop
export function Card(props: TypeCardProps): JSX.Element {
  const { title, contentCard, ...rest } = props;
  return (
    <MaterialCard {...rest}>
      <MaterialCardHeader title={title} component="h3" disableTypography />
      <MaterialCardContent>{contentCard}</MaterialCardContent>
    </MaterialCard>
  );
}

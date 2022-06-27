import MaterialCard from '@mui/material/Card';
import MaterialCardHeader from '@mui/material/CardHeader';
import MaterialCardContent from '@mui/material/CardContent';

import { TypeCardProps } from '../../core/types/cgpv-types';

/**
 * Create a customized Material UI Card
 *
 * @param {TypeCardProps} props the properties passed to the Card element
 * @returns {JSX.Element} the created Card element
 */

// TODO - KenChase MaterialCardHeader component is hard-coded as h3. It should be passed as a prop
export function Card(props: TypeCardProps): JSX.Element {
  const { title, content, ...rest } = props;
  return (
    <MaterialCard {...rest}>
      <MaterialCardHeader title={title} component="h3" disableTypography />
      <MaterialCardContent>{content}</MaterialCardContent>
    </MaterialCard>
  );
}

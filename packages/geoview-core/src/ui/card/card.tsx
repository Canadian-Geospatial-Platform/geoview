import MaterialCard from '@mui/material/Card';

import { TypeCardProps } from '../../core/types/cgpv-types';

/**
 * Create a customized Material UI Card
 *
 * @param {TypeCardProps} props the properties passed to the Card element
 * @returns {JSX.Element} the created Card element
 */

export function Card(props: TypeCardProps): JSX.Element {
  return <MaterialCard {...props} />;
}

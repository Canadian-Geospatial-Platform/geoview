/* eslint-disable react/require-default-props */
import { ReactNode } from 'react';
import { Card as MaterialCard, CardContent as MaterialCardContent, CardHeader as MaterialCardHeader, CardProps } from '@mui/material';

export interface TypeCardProps extends CardProps {
  title?: string;
  contentCard?: ReactNode;
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

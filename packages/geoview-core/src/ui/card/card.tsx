import { memo, ReactNode } from 'react';
import { Card as MaterialCard, CardContent as MaterialCardContent, CardHeader as MaterialCardHeader, CardProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

// Define valid heading elements
type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TypeCardProps extends CardProps {
  title?: string;
  contentCard?: ReactNode;
  headerComponent?: HeadingElement;
}

/**
 * Create a customized Material UI Card
 *
 * @param {TypeCardProps} props the properties passed to the Card element
 * @returns {JSX.Element} the created Card element
 */
export const Card = memo(function Card(props: TypeCardProps): JSX.Element {
  logger.logTraceRender('ui/card/card');

  // Get constant from props
  const { title, contentCard, headerComponent = 'h3', ...rest } = props;

  return (
    <MaterialCard {...rest}>
      <MaterialCardHeader title={title} component={headerComponent} disableTypography />
      <MaterialCardContent>{contentCard}</MaterialCardContent>
    </MaterialCard>
  );
});

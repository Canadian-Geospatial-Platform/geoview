import type { CSSProperties, ReactNode } from 'react';
import parse from 'html-react-parser';
import { Box } from '@/ui/layout';
import { logger } from '@/core/utils/logger';

/**
 * Interface used for custom html elements
 */
interface HtmlToReactProps {
  htmlContent: string;
  className?: string;
  style?: CSSProperties;
  extraOptions?: Record<string, unknown>;
  itemOptions?: Record<string, unknown>;
}

/**
 * Convert an HTML string to a JSX component
 *
 * @param {HtmlToReactProps} props the properties to pass to the converted component
 * @returns {JSX.Element} returns the converted JSX component
 */
export function UseHtmlToReact({ htmlContent, className, style, extraOptions, itemOptions = {} }: HtmlToReactProps): JSX.Element {
  // Log
  logger.logTraceRenderDetailed('core/containers/use-html-to-react');

  // The html-react-parser can return a single item or an array, ensure we have an array
  const parsed = parse(htmlContent);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  // Loop through the array and create the elements with keys assigned
  const reactItems: ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    // Plain text strings need dangerouslySetInnerHTML, JSX elements can be rendered directly
    if (typeof items[i] === 'string') {
      reactItems.push(<Box key={i} {...itemOptions} dangerouslySetInnerHTML={{ __html: items[i] }} />);
    } else {
      reactItems.push(
        <Box key={i} {...itemOptions}>
          {items[i] as ReactNode}
        </Box>
      );
    }
  }

  return (
    <Box {...extraOptions} className={className} style={style}>
      {reactItems}
    </Box>
  );
}

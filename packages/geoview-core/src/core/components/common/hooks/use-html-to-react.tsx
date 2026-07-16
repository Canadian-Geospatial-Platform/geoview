import { isValidElement, type CSSProperties, type ReactNode } from 'react';
import parse from 'html-react-parser';
import { Box } from '@/ui/layout';
import { logger } from '@/core/utils/logger';

/** Properties for the HTML-to-React converter component. */
interface HtmlToReactProps {
  htmlContent: string;
  className?: string;
  style?: CSSProperties;
  extraOptions?: Record<string, unknown>;
  itemOptions?: Record<string, unknown>;
  /** When true and content is a single element with no wrapper-modifying props, wrapper Box elements are omitted. */
  omitWrappers?: boolean;
}

/**
 * Converts an HTML string to a JSX component.
 *
 * @param props - The properties for the HTML-to-React conversion
 * @returns The converted JSX component
 */
export function UseHtmlToReact({ htmlContent, className, style, extraOptions, itemOptions = {}, omitWrappers = false }: HtmlToReactProps): JSX.Element {
  // Log
  logger.logTraceRenderDetailed('components/common/hooks/use-html-to-react');

  // The html-react-parser can return a single item or an array, ensure we have an array
  const parsed = parse(htmlContent);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  // When omitWrappers is true and we have a single element with no wrapper-modifying props, return it directly
  if (
    omitWrappers &&
    items.length === 1 &&
    !className &&
    !style &&
    Object.keys(extraOptions ?? {}).length === 0 &&
    Object.keys(itemOptions).length === 0
  ) {
    // For single valid React elements, return directly (skips both wrapper Boxes)
    if (isValidElement(items[0])) {
      return items[0];
    }
    // For single string items, still need a wrapper for dangerouslySetInnerHTML
    if (typeof items[0] === 'string') {
      return <Box dangerouslySetInnerHTML={{ __html: items[0] }} />;
    }
    // For anything else (null, undefined, number, etc.), fall through to standard wrapping
  }

  // Standard path: wrap items as before (preserves existing behavior)
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

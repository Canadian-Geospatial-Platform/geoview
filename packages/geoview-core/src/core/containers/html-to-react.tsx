import { CSSProperties, ReactNode } from 'react';
import parse from 'html-react-parser';
import { Box } from '@/ui/layout';

/**
 * Interface used for custom html elements
 */
interface HtmlToReactProps {
  htmlContent: string;
  // eslint-disable-next-line react/require-default-props
  className?: string;
  // eslint-disable-next-line react/require-default-props
  style?: CSSProperties;
  // eslint-disable-next-line react/require-default-props
  extraOptions?: Record<string, unknown>;
}

/**
 * Convert an HTML string to a JSX component
 *
 * @param {HtmlToReactProps} props the properties to pass to the converted component
 * @returns {JSX.Element} returns the converted JSX component
 */
export function HtmlToReact(props: HtmlToReactProps): JSX.Element {
  const { htmlContent, className, style, extraOptions } = props;

  // the html-react-parser can return 2 type in an array or not, make sure we have an array
  const parsed = parse(htmlContent) as string | Array<string | TrustedHTML>;
  const items = typeof parsed === 'string' || typeof parsed === 'object' ? [parsed] : parsed;

  // loop trought the array and set the elements
  const reactItems: Array<TrustedHTML> = [];
  for (let i = 0; i < items.length; i++) {
    // eslint-disable-next-line react/no-danger
    if (typeof items[i] === 'string') reactItems.push(<div dangerouslySetInnerHTML={{ __html: items[i] }} />);
    else reactItems.push(items[i]);
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <Box {...extraOptions} className={className} style={style}>
      {reactItems.map((item: TrustedHTML, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={index}>{item as ReactNode}</Box>
      ))}
    </Box>
  );
}

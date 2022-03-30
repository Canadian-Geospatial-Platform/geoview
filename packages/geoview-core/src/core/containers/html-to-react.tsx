/* eslint-disable react/require-default-props */
import React, { CSSProperties } from 'react';

import { TypeJSONObject } from '../types/cgpv-types';

/**
 * Interface used for custom html elements
 */
interface HtmlToReactProps {
  htmlContent: string;
  className?: string;
  style?: CSSProperties;
  extraOptions?: TypeJSONObject;
}

/**
 * Convert an HTML string to a JSX component
 *
 * @param {HtmlToReactProps} props the properties to pass to the converted component
 * @returns {JSX.Element} returns the converted JSX component
 */
export function HtmlToReact(props: HtmlToReactProps): JSX.Element {
  const { htmlContent, className, style, extraOptions } = props;

  // eslint-disable-next-line react/jsx-props-no-spreading, react/no-danger
  return <div {...extraOptions} className={className} style={style} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

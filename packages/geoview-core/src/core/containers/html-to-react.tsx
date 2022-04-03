/* eslint-disable react/require-default-props */
<<<<<<< HEAD
import React, { CSSProperties } from 'react';

import { TypeJSONValue } from '../types/cgpv-types';
=======
/* eslint-disable react/no-danger */
import React, { CSSProperties } from 'react';

import { TypeJSONObject } from '../types/cgpv-types';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d

/**
 * Interface used for custom html elements
 */
interface HtmlToReactProps {
  htmlContent: string;
  className?: string;
  style?: CSSProperties;
  extraOptions?: TypeJSONValue;
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

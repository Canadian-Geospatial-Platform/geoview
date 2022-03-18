/* eslint-disable react/require-default-props */
/* eslint-disable react/no-danger */
import React, { CSSProperties } from "react";
import { TypeJSONObject } from "../types/cgpv-types";

interface HtmlToReactProps {
  htmlContent: string;
  className?: string;
  style?: CSSProperties;
  extraOptions?: TypeJSONObject;
}

export const HtmlToReact = (props: HtmlToReactProps): JSX.Element => {
  const { htmlContent, className, style, extraOptions } = props;

  return (
    <div
      {...extraOptions}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

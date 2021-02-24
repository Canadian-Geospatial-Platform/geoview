/* eslint-disable react/require-default-props */
/* eslint-disable react/no-danger */
import React, { CSSProperties } from 'react';

interface HtmlToReactProps {
    htmlContent: string;
    className?: string | undefined;
    style?: CSSProperties | undefined;
}

export const HtmlToReact = (props: HtmlToReactProps): JSX.Element => {
    const { htmlContent, className, style } = props;

    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

/* eslint-disable react/no-danger */
import React from 'react';

interface HtmlToReactProps {
    htmlContent: string;
}

export const HtmlToReact = (props: HtmlToReactProps): JSX.Element => {
    const { htmlContent } = props;

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

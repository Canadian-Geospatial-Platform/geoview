/* eslint-disable react/function-component-definition */
import React from 'react';
import { LegendSection, StyleOptions } from './types/legend';

interface InfoSectionProps {
  infoType: 'legend' | 'title' | 'description';
  section: LegendSection;
  styleOptions?: StyleOptions;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ infoType, section, styleOptions = {} }) => {
  return (
    <div>
      <h3>{infoType}</h3>
      <p>{section.content}</p>
    </div>
  );
};

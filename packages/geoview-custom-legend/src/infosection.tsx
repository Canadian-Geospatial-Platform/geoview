/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/function-component-definition */
import { LegendSection, StyleOptions } from './types/legend';

interface InfoSectionProps {
  infoType: 'legend' | 'title' | 'description';
  section: LegendSection;
  styleOptions?: StyleOptions;
}

export function InfoSection(props: InfoSectionProps): JSX.Element {
  const { infoType, section } = props;

  const { cgpv } = window;
  const { react } = cgpv;
  const { Fragment } = react;

  return (
    <Fragment>
      {infoType === 'legend' && (
        <div className="info-section">
          <h3>{section.title}</h3>
          {/* Render symbols if any */}
        </div>
      )}
      {infoType === 'description' && (
        <div className="info-section">
          <p>{section.content}</p>
        </div>
      )}
    </Fragment>
  );
}

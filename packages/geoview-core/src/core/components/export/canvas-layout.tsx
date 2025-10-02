import React from 'react';
import ReactDOMServer from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import { DateMgt } from '@/core/utils/date-mgt';
import { FileExportProps } from './export-modal';
import { PAGE_CONFIGS, FlattenedLegendItem, getMapInfo, TypeValidPageSizes } from './utilities';

interface CanvasDocumentProps {
  mapDataUrl: string;
  exportTitle: string;
  scaleText: string;
  scaleLineWidth: string;
  northArrowSvg: Array<{
    d: string | null;
    fill: string | null;
    stroke: string | null;
    strokeWidth: string | null;
  }> | null;
  northArrowRotation: number;
  disclaimer: string;
  attributions: string[];
  date: string;
  fittedColumns: FlattenedLegendItem[][];
  pageSize: TypeValidPageSizes;
}

/**
 * Render legend columns for canvas (HTML)
 */
const renderCanvasLegendColumns = (columns: FlattenedLegendItem[][]) => {
  const actualColumnCount = columns.filter((column) => column.length > 0).length;

  return columns
    .filter((column) => column.length > 0)
    .map((columnItems, columnIndex) => (
      // eslint-disable-next-line react/no-array-index-key
      <div key={columnIndex} style={{ width: `${100 / actualColumnCount}%` }}>
        {columnItems.map((item, index) => {
          const indentLevel = Math.min(item.depth, 3);

          if (item.type === 'layer') {
            return (
              <div
                key={`layer-${item.data.layerPath}`}
                style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '3px', marginTop: index > 0 ? '8px' : '0' }}
              >
                {item.data.layerName}
              </div>
            );
          } else if (item.type === 'wms') {
            return (
              <div key={`wms-${item.data.layerPath}`} style={{ marginLeft: `${indentLevel + 3}px`, marginBottom: '2px' }}>
                <img src={item.data.icons?.[0]?.iconImage || ''} style={{ width: '60px', maxHeight: '100px', objectFit: 'contain' }} />
              </div>
            );
          } else if (item.type === 'time') {
            const timeText = item.timeInfo?.singleHandle
              ? DateMgt.formatDate(
                  new Date(item.timeInfo.values[0]),
                  item.timeInfo.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
                )
              : `${DateMgt.formatDate(
                  new Date(item.timeInfo?.values[0] || 0),
                  item.timeInfo?.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
                )} - ${DateMgt.formatDate(
                  new Date(item.timeInfo?.values[1] || 0),
                  item.timeInfo?.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
                )}`;

            return (
              <div
                key={`time-${item.data.layerPath}`}
                style={{ fontSize: '7px', fontStyle: 'italic', marginLeft: `${indentLevel}px`, marginBottom: '2px' }}
              >
                {timeText}
              </div>
            );
          } else if (item.type === 'child') {
            return (
              <div
                key={`child-${item.data.layerPath}`}
                style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px', marginLeft: `${indentLevel}px`, marginTop: '3px' }}
              >
                {item.data.layerName || 'Unnamed Layer'}
              </div>
            );
          } else {
            const legendItem = item.data.items[0];
            return (
              <div
                key={`item-${item.parentName}-${legendItem?.name}`}
                style={{ display: 'flex', alignItems: 'center', marginLeft: `${indentLevel + 3}px`, marginBottom: '1px' }}
              >
                {legendItem?.icon && <img src={legendItem.icon} style={{ width: '8px', height: '8px', marginRight: '2px' }} />}
                <span style={{ fontSize: '7px' }}>{legendItem?.name || 'Unnamed Item'}</span>
              </div>
            );
          }
        })}
      </div>
    ));
};

export function CanvasDocument({
  mapDataUrl,
  exportTitle,
  scaleText,
  scaleLineWidth,
  northArrowSvg,
  northArrowRotation,
  fittedColumns,
  disclaimer,
  attributions,
  date,
  pageSize,
}: CanvasDocumentProps): JSX.Element {
  const config = PAGE_CONFIGS[pageSize];

  return (
    <div
      style={{
        width: `${config.canvasWidth}px`,
        height: `${config.canvasHeight}px`,
        padding: '36px',
        fontFamily: 'Arial',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      {exportTitle && exportTitle.trim() && (
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px', margin: '0 0 20px 0' }}>
          {exportTitle.trim()}
        </h1>
      )}

      {/* Map */}
      <img
        src={mapDataUrl}
        style={{
          width: '100%',
          maxHeight: `${config.mapHeight}px`,
          objectFit: 'contain',
          marginBottom: '10px',
          borderWidth: 1,
          borderColor: 'black',
          borderStyle: 'solid',
        }}
      />

      {/* Scale and North Arrow */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        {/* Scale bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: scaleLineWidth, height: '1px', backgroundColor: 'black', marginBottom: '2px' }}>
            {/* Left tick */}
            <div style={{ position: 'absolute', left: '-0.5px', top: '-3px', width: '1px', height: '6px', backgroundColor: 'black' }} />
            {/* Right tick */}
            <div style={{ position: 'absolute', right: '-0.5px', top: '-3px', width: '1px', height: '6px', backgroundColor: 'black' }} />
          </div>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>{scaleText}</span>
        </div>

        {/* North Arrow */}
        {northArrowSvg && (
          <div style={{ width: '40px', height: '40px', transform: `rotate(${northArrowRotation - 180}deg)` }}>
            <svg viewBox="285 142 24 24" style={{ width: '40px', height: '40px' }}>
              {northArrowSvg.map((pathData, index) => (
                <path
                  // eslint-disable-next-line react/no-array-index-key
                  key={`path-${index}`}
                  d={pathData.d || ''}
                  fill={pathData.fill || 'black'}
                  stroke={pathData.stroke || 'none'}
                  strokeWidth={pathData.strokeWidth || '0'}
                />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      {fittedColumns.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '10px',
            paddingLeft: '2px',
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          {renderCanvasLegendColumns(fittedColumns)}
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: '8px', textAlign: 'center', marginTop: 'auto', paddingTop: '20px' }}>
        <div style={{ marginBottom: '5px' }}>{disclaimer || ''}</div>
        {attributions.map((attr) => (
          <div key={`${attr.slice(0, 5)}`} style={{ marginBottom: '2px' }}>
            {attr || ''}
          </div>
        ))}
        <div>{date || ''}</div>
      </div>
    </div>
  );
}

export async function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string[]> {
  const results = [];
  const { exportTitle, disclaimer, pageSize, dpi, jpegQuality, format } = props;

  // Get map info
  const mapInfo = await getMapInfo(mapId, pageSize, disclaimer);
  const { fittedOverflowItems } = mapInfo;

  // Create main page HTML
  const mainPageHtml = ReactDOMServer.renderToString(
    <CanvasDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
      pageSize={pageSize}
    />
  );
  const mainElement = document.createElement('div');
  mainElement.innerHTML = mainPageHtml;
  document.body.appendChild(mainElement);

  // Convert to canvas
  const quality = jpegQuality ?? 1;
  const mainCanvas = await html2canvas.default(mainElement.firstChild as HTMLElement, { scale: dpi / 96, logging: false });
  results.push(mainCanvas.toDataURL(`image/${format}`, quality));
  document.body.removeChild(mainElement);

  if (fittedOverflowItems && fittedOverflowItems.length > 0) {
    // Create overflow page (just legend)
    const overflowHtml = ReactDOMServer.renderToString(
      <div style={{ width: '612px', height: '792px', padding: '36px', fontFamily: 'Arial', backgroundColor: 'white' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '10px',
            paddingLeft: '2px',
            marginTop: '20px',
          }}
        >
          {renderCanvasLegendColumns(fittedOverflowItems)}
        </div>
      </div>
    );

    const overflowElement = document.createElement('div');
    overflowElement.innerHTML = overflowHtml;
    document.body.appendChild(overflowElement);

    const overflowCanvas = await html2canvas.default(overflowElement.firstChild as HTMLElement, { scale: dpi / 96, logging: false });
    results.push(overflowCanvas.toDataURL(`image/${format}`, quality));
    document.body.removeChild(overflowElement);
  }

  return results;
}

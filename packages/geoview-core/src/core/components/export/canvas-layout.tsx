import { renderToString } from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import { DateMgt } from '@/core/utils/date-mgt';
import type { FileExportProps } from './export-modal';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { PAGE_CONFIGS, getMapInfo } from './utilities';
import { CANVAS_STYLES } from './layout-styles';

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
 * @param {FlattenedLegendItem[][]} columns - The flattened columns to be placed into the legend
 * @returns {JSX.Element[]} - The rendered legend columns
 */
const renderCanvasLegendColumns = (columns: FlattenedLegendItem[][]): JSX.Element[] => {
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
              <div key={`layer-${item.data.layerPath}`} style={CANVAS_STYLES.layerText(index > 0 ? '8px' : '0')}>
                {item.data.layerName}
              </div>
            );
          } else if (item.type === 'wms') {
            return (
              <div key={`wms-${item.data.layerPath}`} style={CANVAS_STYLES.wmsContainer(indentLevel)}>
                <img src={item.data.icons?.[0]?.iconImage || ''} style={CANVAS_STYLES.wmsImage} />
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
              <div key={`time-${item.data.layerPath}`} style={CANVAS_STYLES.timeText(indentLevel)}>
                {timeText}
              </div>
            );
          } else if (item.type === 'child') {
            return (
              <div key={`child-${item.data.layerPath}`} style={CANVAS_STYLES.childText(indentLevel)}>
                {item.data.layerName || 'Unnamed Layer'}
              </div>
            );
          } else {
            const legendItem = item.data.items[0];
            return (
              <div key={`item-${item.parentName}-${legendItem?.name}`} style={CANVAS_STYLES.itemContainer(indentLevel)}>
                {legendItem?.icon && <img src={legendItem.icon} style={CANVAS_STYLES.itemIcon} />}
                <span style={CANVAS_STYLES.itemText}>{legendItem?.name || 'Unnamed Item'}</span>
              </div>
            );
          }
        })}
      </div>
    ));
};

/**
 * The Canvas that is created for the map export
 * @param {CanvasDocumentProps} props - The Canvas Document properties
 * @returns {JSX.Element} The resulting html map
 */
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
  const { canvasWidth, canvasHeight } = PAGE_CONFIGS[pageSize];

  return (
    <div style={CANVAS_STYLES.page(canvasWidth, canvasHeight)}>
      {/* Title */}
      {exportTitle && exportTitle.trim() && <h1 style={CANVAS_STYLES.title}>{exportTitle.trim()}</h1>}

      {/* Map */}
      <img src={mapDataUrl} style={CANVAS_STYLES.mapImage} />

      {/* Scale and North Arrow */}
      <div style={CANVAS_STYLES.scaleContainer}>
        {/* Scale bar */}
        <div style={CANVAS_STYLES.scaleBarContainer}>
          <div style={{ ...CANVAS_STYLES.scaleLine, width: scaleLineWidth }}>
            {/* Left tick */}
            <div style={{ ...CANVAS_STYLES.scaleTick, ...CANVAS_STYLES.scaleTickLeft }} />
            {/* Right tick */}
            <div style={{ ...CANVAS_STYLES.scaleTick, ...CANVAS_STYLES.scaleTickRight }} />
          </div>
          <span style={CANVAS_STYLES.scaleText}>{scaleText}</span>
        </div>

        {/* North Arrow */}
        {northArrowSvg && (
          <div style={{ ...CANVAS_STYLES.northArrow, transform: `rotate(${northArrowRotation - 180}deg)` }}>
            <svg viewBox="285 142 24 24" style={CANVAS_STYLES.northArrowSvg}>
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
      {fittedColumns.length > 0 && <div style={CANVAS_STYLES.legendContainer}>{renderCanvasLegendColumns(fittedColumns)}</div>}

      {/* Footer */}
      <div style={CANVAS_STYLES.footer}>
        <div style={CANVAS_STYLES.footerDisclaimer}>{disclaimer || ''}</div>
        {attributions.map((attr) => (
          <div key={`${attr.slice(0, 5)}`} style={CANVAS_STYLES.footerAttribution}>
            {attr || ''}
          </div>
        ))}
        <div style={CANVAS_STYLES.footerDate}>{date || ''}</div>
      </div>
    </div>
  );
}

/**
 * Creates the HTML map and converts to canvas and then image for the export
 * @param {string} mapId - The map ID
 * @param {FileExportProps} props - The file export props
 * @returns {Promise<string[]>} A string of URLs for the images (Map and overflow pages)
 */
export async function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string[]> {
  const results = [];
  const { exportTitle, disclaimer, pageSize, dpi, jpegQuality, format } = props;

  // Get map info
  const mapInfo = await getMapInfo(mapId, pageSize, disclaimer, exportTitle);
  const { fittedOverflowItems } = mapInfo;

  // Create main page HTML
  const mainPageHtml = renderToString(
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

  if (fittedOverflowItems && fittedOverflowItems.filter((column) => column.length > 0).length > 0) {
    const { canvasWidth, canvasHeight } = PAGE_CONFIGS[pageSize];
    // Create overflow page (just legend)
    const overflowHtml = renderToString(
      <div style={CANVAS_STYLES.overflowPage(canvasWidth, canvasHeight)}>
        <div style={CANVAS_STYLES.overflowContainer}>{renderCanvasLegendColumns(fittedOverflowItems)}</div>
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

import { renderToString } from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import { DateMgt } from '@/core/utils/date-mgt';
import type { FileExportProps } from './export-modal';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { PAGE_CONFIGS, getMapInfo } from './utilities';
import { CANVAS_STYLES, getScaledCanvasStyles } from './layout-styles';

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
 * Render legend items directly from columns without re-grouping
 */
const renderCanvasLegendInRows = (columns: FlattenedLegendItem[][], pageSize: TypeValidPageSizes, canvasWidth: number): JSX.Element => {
  const scaledStyles = getScaledCanvasStyles(canvasWidth);

  /**
   * Renders a single legend item
   */
  const renderSingleItem = (item: FlattenedLegendItem, itemIndex: number, indentLevel: number): JSX.Element => {
    if (item.type === 'layer') {
      return (
        <div key={`layer-${item.data.layerPath}-${itemIndex}`} style={scaledStyles.layerText(itemIndex > 0 ? '8px' : '0')}>
          {item.data.layerName}
        </div>
      );
    }
    if (item.type === 'wms') {
      return (
        <div key={`wms-${item.data.layerPath}-${itemIndex}`} style={CANVAS_STYLES.wmsContainer(indentLevel)}>
          <img src={item.data.icons?.[0]?.iconImage || ''} style={CANVAS_STYLES.wmsImage} />
        </div>
      );
    }
    if (item.type === 'time') {
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
        <div key={`time-${item.data.layerPath}-${itemIndex}`} style={scaledStyles.timeText(indentLevel)}>
          {timeText}
        </div>
      );
    }
    if (item.type === 'child') {
      return (
        <div key={`child-${item.data.layerPath}-${itemIndex}`} style={scaledStyles.childText(indentLevel)}>
          {item.data.layerName || '...'}
        </div>
      );
    }
    const legendItem = item.data.items[0];
    return (
      <div key={`item-${item.parentName}-${legendItem?.name}-${itemIndex}`} style={CANVAS_STYLES.itemContainer(indentLevel)}>
        {legendItem?.icon && <img src={legendItem.icon} style={scaledStyles.itemIcon} />}
        <span style={scaledStyles.itemText}>{legendItem?.name}</span>
      </div>
    );
  };

  /**
   * Groups items into containers - wraps content (not header) in red border
   */
  const renderColumnItems = (column: FlattenedLegendItem[]): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < column.length) {
      const item = column[i];
      const indentLevel = Math.min(item.depth, 3);

      // Check if this is a layer (depth 0) or child layer (any depth >= 1)
      if (item.type === 'layer' || item.type === 'child') {
        // First render the layer/child header WITHOUT the border
        elements.push(renderSingleItem(item, i, indentLevel));

        const currentDepth = item.depth;
        const contentStart = i + 1;
        let contentEnd = i + 1;

        // Find all immediate children (depth = currentDepth + 1)
        // Stop when we hit an item at same or lower depth (sibling or higher level)
        while (contentEnd < column.length && column[contentEnd].depth > currentDepth) {
          // Only collect items at the immediate next level for wrapping
          if (column[contentEnd].depth === currentDepth + 1) {
            contentEnd++;
          } else {
            // This is a deeper nested item, skip to find where this group ends
            break;
          }
        }

        // If we have direct children, check if they are content items (not child layers)
        if (contentEnd > contentStart) {
          const hasContentItems = column
            .slice(contentStart, contentEnd)
            .some((childItem) => childItem.type === 'wms' || childItem.type === 'item' || childItem.type === 'time');

          if (hasContentItems) {
            // Wrap content items with grey border
            const contentItems: JSX.Element[] = [];
            for (let j = contentStart; j < contentEnd; j++) {
              const contentItem = column[j];
              const contentIndentLevel = Math.min(contentItem.depth, 3);

              contentItems.push(renderSingleItem(contentItem, j, contentIndentLevel));
            }

            elements.push(
              <div
                key={`content-${i}`}
                style={{ borderLeft: '4px solid #9e9e9e', paddingLeft: '8px', marginLeft: '8px', marginBottom: '4px' }}
              >
                {contentItems}
              </div>
            );

            i = contentEnd;
          } else {
            // Only child layers, no content to wrap - will be handled in next iteration
            i++;
          }
        } else {
          // No content, just move to next item
          i++;
        }
      } else {
        elements.push(renderSingleItem(item, i, indentLevel));
        i++;
      }
    }

    return elements;
  };

  // Render columns directly as they were distributed
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', width: '100%' }}>
      {columns.map((column, colIndex) => {
        const columnKey = column.length > 0 ? `col-${column[0].data.layerPath}-${colIndex}` : `col-empty-${colIndex}`;
        return (
          <div
            key={columnKey}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0,
            }}
          >
            {renderColumnItems(column)}
          </div>
        );
      })}
    </div>
  );
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
  const scaledStyles = getScaledCanvasStyles(canvasWidth);

  return (
    <div style={CANVAS_STYLES.page(canvasWidth, canvasHeight)}>
      {/* Title */}
      {exportTitle && exportTitle.trim() && <h1 style={scaledStyles.title}>{exportTitle.trim()}</h1>}

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
          <span style={scaledStyles.scaleText}>{scaleText}</span>
        </div>

        {/* North Arrow */}
        {northArrowSvg && (
          <div style={{ ...scaledStyles.northArrow, transform: `rotate(${northArrowRotation - 180}deg)` }}>
            <svg viewBox="285 142 24 24" style={scaledStyles.northArrow}>
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

      {/* Divider between scale and legend */}
      <div style={CANVAS_STYLES.divider} />

      {/* Legend */}
      {fittedColumns.length > 0 && (
        <div style={CANVAS_STYLES.legendContainer}>{renderCanvasLegendInRows(fittedColumns, pageSize, canvasWidth)}</div>
      )}

      {/* Footer */}
      <div style={CANVAS_STYLES.footer}>
        <div style={scaledStyles.footerDisclaimer}>{disclaimer || ''}</div>
        {attributions.map((attr) => (
          <div key={`${attr.slice(0, 5)}`} style={scaledStyles.footerAttribution}>
            {attr || ''}
          </div>
        ))}
        <div style={scaledStyles.footerDate}>{date || ''}</div>
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
  const renderedElement = mainElement.firstChild as HTMLElement;
  const quality = jpegQuality ?? 1;
  const mainCanvas = await html2canvas.default(renderedElement, { scale: dpi / 96, logging: false });
  results.push(mainCanvas.toDataURL(`image/${format}`, quality));
  document.body.removeChild(mainElement);

  if (fittedOverflowItems && fittedOverflowItems.filter((column) => column.length > 0).length > 0) {
    const { canvasWidth, canvasHeight } = PAGE_CONFIGS[pageSize];
    // Create overflow page (just legend)
    const overflowHtml = renderToString(
      <div style={CANVAS_STYLES.overflowPage(canvasWidth, canvasHeight)}>
        <div style={CANVAS_STYLES.overflowContainer}>{renderCanvasLegendInRows(fittedOverflowItems, pageSize, canvasWidth)}</div>
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

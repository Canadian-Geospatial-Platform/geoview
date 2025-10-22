import { renderToString } from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import { DateMgt } from '@/core/utils/date-mgt';
import type { FileExportProps } from './export-modal';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { PAGE_CONFIGS, getMapInfo } from './utilities';
import { CANVAS_STYLES } from './layout-styles';

/**
 * Get scaled styles for AUTO mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getScaledCanvasStyles = (pageSize: TypeValidPageSizes, docWidth: number): any => {
  if (pageSize !== 'AUTO') return CANVAS_STYLES;

  // Match PDF scaling approach exactly
  const scale = docWidth / 612;
  return {
    ...CANVAS_STYLES,
    layerText: (marginTop: string) => ({
      ...CANVAS_STYLES.layerText(marginTop),
      fontSize: `${parseInt(CANVAS_STYLES.layerText('0').fontSize) * scale}px`,
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
    childText: (indentLevel: number) => ({
      ...CANVAS_STYLES.childText(indentLevel),
      fontSize: `${parseInt(CANVAS_STYLES.childText(0).fontSize) * scale}px`,
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
    timeText: (indentLevel: number) => ({
      ...CANVAS_STYLES.timeText(indentLevel),
      fontSize: `${parseInt(CANVAS_STYLES.timeText(0).fontSize) * scale}px`,
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
    itemText: {
      ...CANVAS_STYLES.itemText,
      fontSize: `${parseInt(CANVAS_STYLES.itemText.fontSize) * scale}px`,
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    },
    title: {
      ...CANVAS_STYLES.title,
      fontSize: `${parseInt(CANVAS_STYLES.title.fontSize) * scale}px`,
    },
    scaleText: {
      ...CANVAS_STYLES.scaleText,
      fontSize: `${parseInt(CANVAS_STYLES.scaleText.fontSize) * scale}px`,
    },
    footerDisclaimer: {
      ...CANVAS_STYLES.footerDisclaimer,
      fontSize: `${CANVAS_STYLES.footerDisclaimer.fontSize * scale}px`,
    },
    footerAttribution: {
      ...CANVAS_STYLES.footerAttribution,
      fontSize: `${CANVAS_STYLES.footerAttribution.fontSize * scale}px`,
    },
    footerDate: {
      ...CANVAS_STYLES.footerDate,
      fontSize: `${CANVAS_STYLES.footerDate.fontSize * scale}px`,
    },
    northArrow: {
      ...CANVAS_STYLES.northArrow,
      width: `${parseInt(CANVAS_STYLES.northArrow.width) * scale}px`,
      height: `${parseInt(CANVAS_STYLES.northArrow.height) * scale}px`,
    },
    northArrowSvg: {
      ...CANVAS_STYLES.northArrowSvg,
      width: `${parseInt(CANVAS_STYLES.northArrowSvg.width) * scale}px`,
      height: `${parseInt(CANVAS_STYLES.northArrowSvg.height) * scale}px`,
    },
    itemIcon: {
      ...CANVAS_STYLES.itemIcon,
      width: `${parseInt(CANVAS_STYLES.itemIcon.width) * scale}px`,
      height: `${parseInt(CANVAS_STYLES.itemIcon.height) * scale}px`,
    },
    wmsImage: {
      ...CANVAS_STYLES.wmsImage,
      maxWidth: '100%',
      width: 'auto',
      objectFit: 'contain',
    },
  };
};

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
 * Render legend items in rows with proper alignment and dividers
 */
const renderCanvasLegendInRows = (columns: FlattenedLegendItem[][], pageSize: TypeValidPageSizes, canvasWidth: number): JSX.Element => {
  const scaledStyles = getScaledCanvasStyles(pageSize, canvasWidth);
  const allItems: FlattenedLegendItem[] = [];

  // Flatten all columns into single array
  columns.forEach((column) => {
    allItems.push(...column);
  });

  // Group by root layers
  const layerGroups: FlattenedLegendItem[][] = [];
  let currentGroup: FlattenedLegendItem[] = [];

  allItems.forEach((item) => {
    if (item.isRoot && currentGroup.length > 0) {
      layerGroups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(item);
  });

  if (currentGroup.length > 0) {
    layerGroups.push(currentGroup);
  }

  // Create rows with max 3 layer groups per row
  const rows: FlattenedLegendItem[][][] = [];
  for (let i = 0; i < layerGroups.length; i += 3) {
    rows.push(layerGroups.slice(i, i + 3));
  }

  return (
    <div>
      {rows.map((rowGroups, rowIndex) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`row-${rowIndex}`}
          style={{
            ...CANVAS_STYLES.rowContainer,
            ...(rowIndex === 0 ? { borderTop: 'none', paddingTop: '0px' } : {}),
          }}
        >
          {rowGroups.map((group, groupIndex) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={`group-${groupIndex}`}
              style={{
                width: `${100 / rowGroups.length}%`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                alignSelf: 'flex-start',
              }}
            >
              {group.map((item, index) => {
                const indentLevel = Math.min(item.depth, 3);

                if (item.type === 'layer') {
                  return (
                    <div key={`layer-${item.data.layerPath}`} style={scaledStyles.layerText(index > 0 ? '8px' : '0')}>
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
                    <div key={`time-${item.data.layerPath}`} style={scaledStyles.timeText(indentLevel)}>
                      {timeText}
                    </div>
                  );
                } else if (item.type === 'child') {
                  return (
                    <div key={`child-${item.data.layerPath}`} style={scaledStyles.childText(indentLevel)}>
                      {item.data.layerName || '...'}
                    </div>
                  );
                } else {
                  const legendItem = item.data.items[0];
                  return (
                    <div key={`item-${item.parentName}-${legendItem?.name}`} style={CANVAS_STYLES.itemContainer(indentLevel)}>
                      {legendItem?.icon && <img src={legendItem.icon} style={scaledStyles.itemIcon} />}
                      <span style={scaledStyles.itemText}>{legendItem?.name}</span>
                    </div>
                  );
                }
              })}
            </div>
          ))}
        </div>
      ))}
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
  const scaledStyles = getScaledCanvasStyles(pageSize, canvasWidth);

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
  const quality = jpegQuality ?? 1;
  const mainCanvas = await html2canvas.default(mainElement.firstChild as HTMLElement, { scale: dpi / 96, logging: false });
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

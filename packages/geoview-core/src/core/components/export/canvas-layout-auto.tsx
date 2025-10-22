// import { createRoot } from 'react-dom/client';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { getMapInfo, PAGE_CONFIGS } from './utilities';
import type { FileExportProps } from './export-modal';
import { CANVAS_STYLES } from './layout-styles';

interface CanvasLayoutProps {
  mapDataUrl: string;
  exportTitle: string;
  scaleText: string;
  scaleLineWidth: string;
  northArrowSvg: string;
  northArrowRotation: number;
  disclaimer: string;
  attributions: string[];
  date: string;
  fittedColumns: FlattenedLegendItem[][];
  fittedOverflowItems?: FlattenedLegendItem[][];
  pageSize: TypeValidPageSizes;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Render legend items in rows with proper alignment and dividers
 */
const renderLegendInRows = (columns: FlattenedLegendItem[][]): HTMLElement => {
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

  const container = document.createElement('div');
  Object.assign(container.style, CANVAS_STYLES.legendContainer);

  rows.forEach((rowGroups, rowIndex) => {
    const rowDiv = document.createElement('div');
    Object.assign(rowDiv.style, {
      ...CANVAS_STYLES.rowContainer,
      ...(rowIndex === 0 ? { borderTop: 'none', paddingTop: '0px' } : {}),
    });

    rowGroups.forEach((group) => {
      const groupDiv = document.createElement('div');
      Object.assign(groupDiv.style, {
        width: `${100 / rowGroups.length}%`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      });

      group.forEach((item, index) => {
        const indentLevel = Math.min(item.depth, 3);

        if (item.type === 'layer') {
          const layerText = document.createElement('div');
          Object.assign(layerText.style, CANVAS_STYLES.layerText(index > 0 ? '8px' : '0px'));
          layerText.textContent = item.data.layerName || '';
          groupDiv.appendChild(layerText);
        } else if (item.type === 'wms') {
          const wmsContainer = document.createElement('div');
          Object.assign(wmsContainer.style, CANVAS_STYLES.wmsContainer(indentLevel));

          const wmsImg = document.createElement('img');
          Object.assign(wmsImg.style, CANVAS_STYLES.wmsImage);
          wmsImg.src = item.data.icons?.[0]?.iconImage || '';
          wmsContainer.appendChild(wmsImg);
          groupDiv.appendChild(wmsContainer);
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

          const timeDiv = document.createElement('div');
          Object.assign(timeDiv.style, CANVAS_STYLES.timeText(indentLevel));
          timeDiv.textContent = timeText;
          groupDiv.appendChild(timeDiv);
        } else if (item.type === 'child') {
          const childText = document.createElement('div');
          Object.assign(childText.style, CANVAS_STYLES.childText(indentLevel));
          childText.textContent = item.data.layerName || '...';
          groupDiv.appendChild(childText);
        } else {
          const legendItem = item.data.items[0];
          const itemContainer = document.createElement('div');
          Object.assign(itemContainer.style, CANVAS_STYLES.itemContainer(indentLevel));

          if (legendItem?.icon) {
            const iconImg = document.createElement('img');
            Object.assign(iconImg.style, CANVAS_STYLES.itemIcon);
            iconImg.src = legendItem.icon;
            itemContainer.appendChild(iconImg);
          }

          const itemText = document.createElement('span');
          Object.assign(itemText.style, CANVAS_STYLES.itemText);
          itemText.textContent = legendItem?.name || '';
          itemContainer.appendChild(itemText);

          groupDiv.appendChild(itemContainer);
        }
      });

      rowDiv.appendChild(groupDiv);
    });

    container.appendChild(rowDiv);
  });

  return container;
};

function CanvasLayout({
  mapDataUrl,
  exportTitle,
  scaleText,
  scaleLineWidth,
  northArrowSvg,
  northArrowRotation,
  disclaimer,
  attributions,
  date,
  fittedColumns,
  canvasWidth,
  canvasHeight,
}: CanvasLayoutProps): HTMLElement {
  const container = document.createElement('div');
  Object.assign(container.style, CANVAS_STYLES.page(canvasWidth, canvasHeight));

  // Title
  if (exportTitle && exportTitle.trim()) {
    const title = document.createElement('h1');
    Object.assign(title.style, CANVAS_STYLES.title);
    title.textContent = exportTitle.trim();
    container.appendChild(title);
  }

  // Map
  const mapImg = document.createElement('img');
  Object.assign(mapImg.style, CANVAS_STYLES.mapImage);
  mapImg.src = mapDataUrl;
  container.appendChild(mapImg);

  // Scale and North Arrow
  const scaleContainer = document.createElement('div');
  Object.assign(scaleContainer.style, CANVAS_STYLES.scaleContainer);

  const scaleBarContainer = document.createElement('div');
  Object.assign(scaleBarContainer.style, CANVAS_STYLES.scaleBarContainer);

  const scaleLine = document.createElement('div');
  Object.assign(scaleLine.style, { ...CANVAS_STYLES.scaleLine, width: scaleLineWidth });

  const leftTick = document.createElement('div');
  Object.assign(leftTick.style, { ...CANVAS_STYLES.scaleTick, ...CANVAS_STYLES.scaleTickLeft });
  scaleLine.appendChild(leftTick);

  const rightTick = document.createElement('div');
  Object.assign(rightTick.style, { ...CANVAS_STYLES.scaleTick, ...CANVAS_STYLES.scaleTickRight });
  scaleLine.appendChild(rightTick);

  scaleBarContainer.appendChild(scaleLine);

  const scaleTextDiv = document.createElement('div');
  Object.assign(scaleTextDiv.style, CANVAS_STYLES.scaleText);
  scaleTextDiv.textContent = scaleText;
  scaleBarContainer.appendChild(scaleTextDiv);

  scaleContainer.appendChild(scaleBarContainer);

  if (northArrowSvg) {
    const northArrowDiv = document.createElement('div');
    Object.assign(northArrowDiv.style, {
      ...CANVAS_STYLES.northArrow,
      transform: `rotate(${northArrowRotation - 180}deg)`,
    });
    northArrowDiv.innerHTML = northArrowSvg;
    scaleContainer.appendChild(northArrowDiv);
  }

  container.appendChild(scaleContainer);

  // Legend
  if (fittedColumns && fittedColumns.length > 0) {
    const legendElement = renderLegendInRows(fittedColumns);
    container.appendChild(legendElement);
  }

  // Footer
  const footer = document.createElement('div');
  Object.assign(footer.style, CANVAS_STYLES.footer);

  const disclaimerDiv = document.createElement('div');
  Object.assign(disclaimerDiv.style, CANVAS_STYLES.footerDisclaimer);
  disclaimerDiv.textContent = disclaimer || '';
  footer.appendChild(disclaimerDiv);

  attributions.forEach((attr) => {
    const attrDiv = document.createElement('div');
    Object.assign(attrDiv.style, CANVAS_STYLES.footerAttribution);
    attrDiv.textContent = attr || '';
    footer.appendChild(attrDiv);
  });

  const dateDiv = document.createElement('div');
  Object.assign(dateDiv.style, CANVAS_STYLES.footerDate);
  dateDiv.textContent = date || '';
  footer.appendChild(dateDiv);

  container.appendChild(footer);

  return container;
}

export async function createCanvasMapUrls(mapId: string, params: FileExportProps): Promise<string[]> {
  const { exportTitle, disclaimer, pageSize, dpi, jpegQuality, format } = params;
  const mapInfo = await getMapInfo(mapId, pageSize, disclaimer, exportTitle);
  const config = PAGE_CONFIGS[pageSize];

  const urls: string[] = [];

  // Main page
  const mainLayout = CanvasLayout({
    ...mapInfo,
    exportTitle,
    disclaimer,
    date: DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A'),
    pageSize,
    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = config.canvasWidth * (dpi / 96);
  canvas.height = config.canvasHeight * (dpi / 96);
  ctx.scale(dpi / 96, dpi / 96);

  document.body.appendChild(mainLayout);

  const { default: html2canvas } = await import('html2canvas');
  await html2canvas(mainLayout, {
    canvas,
    width: config.canvasWidth,
    height: config.canvasHeight,
    scale: dpi / 96,
  });

  document.body.removeChild(mainLayout);
  const quality = format === 'jpeg' ? jpegQuality! / 100 : 1;
  urls.push(canvas.toDataURL(`image/${format}`, quality));

  return urls;
}

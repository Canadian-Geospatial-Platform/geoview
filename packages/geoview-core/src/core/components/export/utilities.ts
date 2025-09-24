import { createElement, ReactElement } from 'react';
import { Buffer } from 'buffer';
import * as pdfjsLib from 'pdfjs-dist';
import { pdf, DocumentProps } from '@react-pdf/renderer';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { ExportDocument } from '@/core/components/export/pdf-layout';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { exportFile } from '@/core/utils/utilities';

// GV Buffer polyfill for react-pdf
if (typeof window !== 'undefined') {
  (window as typeof globalThis).Buffer = Buffer;
}

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface exportPDFMapParams {
  exportTitle: string;
  disclaimer: string;
  size: 'LETTER' | 'TABLOID' | 'LEGAL';
}

// Export dimension constants at 300DPI
const MAP_IMAGE_DIMENSIONS = {
  LETTER: {
    // 8.5" X 11" => 612 X 792 @ 72dpi
    width: 2250,
    height: 1500,
  },
  TABLOID: {
    // 11" X 17" => 792 X 1224 @ 72dpi
    width: 2900,
    height: 2300,
  },
  LEGAL: {
    // 8.5" X 14" => 612 X 1008 @ 72 dpi
    width: 2250,
    height: 1900,
  },
};

/**
 * Generate PDF export preview for a map by pulling data from store state
 */
export async function exportPDFMap(mapId: string, params: exportPDFMapParams): Promise<string> {
  const store = getGeoViewStore(mapId);
  const state = store.getState();

  const { exportTitle, disclaimer, size } = params;

  // Get all needed data from store state
  const mapElement = state.appState.geoviewHTMLElement;
  const mapViewer = MapEventProcessor.getMapViewer(mapId);
  const { northArrow, scale } = state.mapState;
  const mapAttributions = state.mapState.attribution;
  const rotationAngle = state.mapState.northArrowElement.degreeRotation || 0;
  const legendLayers = state.layerState.legendLayers.filter(
    (layer) => layer.layerStatus === 'loaded' && (layer.items.length === 0 || layer.items.some((item) => item.isVisible))
  );

  if (!mapViewer?.map) throw new Error('Map not available');

  const { map } = mapViewer;
  const mapSize = map.getSize();
  if (!mapSize) throw new Error('Map size not available');

  // Adjust map to correct aspect ratio for PDF map
  const mapImageWidth = MAP_IMAGE_DIMENSIONS[size].width;
  const mapImageHeight = MAP_IMAGE_DIMENSIONS[size].height;
  const aspectRatio = mapImageWidth / mapImageHeight;

  // Adjust the map size to correct aspect ratio to avoid stretching the map
  let newMapWidth, newMapHeight;
  if (mapSize[0] / mapSize[1] < aspectRatio) {
    // Width is increased to meet aspect ratio
    newMapWidth = mapSize[1] * aspectRatio;
    newMapHeight = mapSize[1];
  } else {
    // Height is increased to meet aspect ratio
    newMapWidth = mapSize[0];
    newMapHeight = mapSize[0] / aspectRatio;
  }

  // Temporarily resize the map for export
  map.setSize([newMapWidth, newMapHeight]);

  // Wait for map to re-render
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = mapImageWidth;
  resultCanvas.height = mapImageHeight;
  const resultContext = resultCanvas.getContext('2d');

  if (!resultContext) throw new Error('Canvas context not available');

  const viewport = mapElement.getElementsByClassName('ol-viewport')[0];
  Array.prototype.forEach.call(viewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
    const isOverviewCanvas = canvas.closest('.ol-overviewmap');
    if (!isOverviewCanvas && canvas.width > 0) {
      const { opacity } = (canvas.parentNode as HTMLElement).style;
      resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
      resultContext.drawImage(canvas, 0, 0, mapImageWidth, mapImageHeight);
    }
  });

  // Restore original map size
  map.setSize(mapSize);

  const mapDataUrl = resultCanvas.toDataURL('image/jpeg', 0.9);

  if (!mapDataUrl || mapDataUrl === 'data:,') {
    throw new Error('Failed to capture map image');
  }

  // Generate north arrow SVG
  let northArrowSvgPaths = null;
  if (northArrow) {
    try {
      const ReactDOMServer = await import('react-dom/server');
      const { NorthArrowIcon } = await import('@/core/components/north-arrow/north-arrow-icon');

      const iconString = ReactDOMServer.renderToString(createElement(NorthArrowIcon, { width: 24, height: 24 }));
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(iconString, 'image/svg+xml');
      const paths = svgDoc.querySelectorAll('path');

      if (paths.length > 0) {
        northArrowSvgPaths = Array.from(paths).map((path) => ({
          d: path.getAttribute('d'),
          fill: path.getAttribute('fill'),
          stroke: path.getAttribute('stroke'),
          strokeWidth: path.getAttribute('stroke-width'),
          transform: `rotate(${rotationAngle} 12 12)`,
        }));
      }
    } catch (error) {
      logger.logError(error);
      northArrowSvgPaths = null;
    }
  }

  // Clean legend data
  const cleanLegendLayers = legendLayers.map((layer) => ({
    ...layer,
    layerName: layer.layerName || 'Unnamed Layer',
    items: layer.items
      .filter((item) => item && item.name)
      .map((item) => ({
        ...item,
        name: item.name || 'Unnamed Item',
        icon: item.icon || null,
      })),
  }));

  try {
    const blob = await pdf(
      createElement(ExportDocument, {
        mapDataUrl,
        exportTitle: exportTitle,
        scaleText: `${scale.labelGraphicMetric} (approx)`,
        scaleLineWidth: scale.lineWidthMetric,
        northArrowSvg: northArrowSvgPaths,
        legendLayers: cleanLegendLayers,
        disclaimer: disclaimer,
        attributions: mapAttributions.slice(0, 2),
        date: DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A'),
        mapId,
        timeSliderLayers: undefined,
        pageSize: size,
      }) as ReactElement<DocumentProps>
    ).toBlob();

    return URL.createObjectURL(blob);
  } catch (error) {
    logger.logError(error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
}

/**
 * Converts a PDF URL to PNG using PDF.js and canvas rendering
 */
export async function convertPdfUrlToImage(
  pdfUrl: string,
  filename?: string,
  dpi: number = 300,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1
): Promise<string | void> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdfFile = await loadingTask.promise;

    // Get the first page
    const page = await pdfFile.getPage(1);

    // Set scale for good quality (1 = 100% of original size)
    const scale = Math.max((dpi / 300) * 3, 1); // 300 is the DPI of the PDF, minimum of scale = 1
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Render PDF page into canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: 'print',
      renderInteractiveForms: false,
    };

    await page.render(renderContext).promise;

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL(`image/${format}`, quality);

    if (filename) {
      // Download the image
      exportFile(dataUrl, filename, format);
    } else {
      // Return data URL for preview
      return dataUrl;
    }
  } catch (error) {
    logger.logError('PDF to PNG conversion failed:', error);
    throw new Error(`Failed to convert PDF to PNG: ${error}`);
  }
}

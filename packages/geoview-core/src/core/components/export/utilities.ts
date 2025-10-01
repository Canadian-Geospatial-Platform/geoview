import { createElement, ReactElement } from 'react';
import { Buffer } from 'buffer';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { pdf, DocumentProps } from '@react-pdf/renderer';

import { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { ExportDocument } from '@/core/components/export/pdf-layout';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { exportFile } from '@/core/utils/utilities';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';

// GV Buffer polyfill for react-pdf
if (typeof window !== 'undefined') {
  (window as typeof globalThis).Buffer = Buffer;
}

// Set worker path for PDF.js
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

interface exportPDFMapParams {
  exportTitle: string;
  disclaimer: string;
  size: 'LETTER' | 'TABLOID' | 'LEGAL';
}

export type TypeMapStateForExportLayout = {
  attribution: string[];
  northArrow: boolean;
  northArrowElement: TypeNorthArrow;
  scale: TypeScaleInfo;
  mapRotation: number;
};

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
 * Generate the PDF export for the map
 * @param {string} mapId - The map ID
 * @param {exportPDFMapParams} params - The export params being passed
 * @returns {Promise<string>} The PDF blob url
 */
export async function createPDFMapUrl(mapId: string, params: exportPDFMapParams): Promise<string> {
  const { exportTitle, disclaimer, size } = params;

  // Get all needed data from store state
  const mapElement = AppEventProcessor.getGeoviewHTMLElement(mapId);
  const mapState = MapEventProcessor.getMapStateForExportLayout(mapId);
  const { northArrow, scale, attribution, northArrowElement, mapRotation } = mapState;
  const currentRotation = (mapRotation * 180) / Math.PI;
  const rotationAngle = parseFloat(northArrowElement.degreeRotation) + currentRotation;
  const legendLayers = LegendEventProcessor.getLegendLayers(mapId).filter(
    (layer) => layer.layerStatus === 'loaded' && (layer.items.length === 0 || layer.items.some((item) => item.isVisible))
  );
  const orderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(mapId);
  let timeSliderLayers = undefined;
  if (TimeSliderEventProcessor.isTimeSliderInitialized(mapId)) {
    timeSliderLayers = TimeSliderEventProcessor.getTimeSliderLayers(mapId);
  }

  // Adjust map to correct aspect ratio for PDF map
  const mapImageWidth = MAP_IMAGE_DIMENSIONS[size].width;
  const mapImageHeight = MAP_IMAGE_DIMENSIONS[size].height;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = mapImageWidth;
  resultCanvas.height = mapImageHeight;
  const resultContext = resultCanvas.getContext('2d');

  if (!resultContext) throw new Error('Canvas context not available');

  const viewport = mapElement.getElementsByClassName('ol-viewport')[0];

  // Apply rotation if needed
  if (mapRotation !== 0) {
    resultContext.save();
    resultContext.translate(mapImageWidth / 2, mapImageHeight / 2);
    resultContext.rotate(mapRotation);
  }

  // To be used later for calculating the scale bar width
  let browserMapWidth;

  // GV This tries it's best to fit the map image into the canvas. However;
  // GV.Cont at close to 45 degrees, there will be unfetched tiles in the corners
  Array.prototype.forEach.call(viewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
    const isOverviewCanvas = canvas.closest('.ol-overviewmap');
    if (!isOverviewCanvas && canvas.width > 0) {
      const { opacity } = (canvas.parentNode as HTMLElement).style;
      resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

      // Calculate scaling for the map
      browserMapWidth = canvas.width;
      const scaleX = mapImageWidth / canvas.width;
      const scaleY = mapImageHeight / canvas.height;
      const canvasScale = Math.max(scaleX, scaleY); // Fill completely, may crop edges

      const scaledWidth = canvas.width * canvasScale;
      const scaledHeight = canvas.height * canvasScale;

      if (mapRotation !== 0) {
        // Rotated: draw centered at origin (coordinate system already translated)
        resultContext.drawImage(canvas, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      } else {
        // Not rotated: calculate offset to center in canvas
        const offsetX = (mapImageWidth - scaledWidth) / 2;
        const offsetY = (mapImageHeight - scaledHeight) / 2;
        resultContext.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
      }
    }
  });

  // Calculate scale line width for pdf
  const pdfScaleFactor = browserMapWidth! / mapImageWidth; // Normalize to a base width
  const pdfScaleWidth = Math.round(parseFloat(scale.lineWidthMetric) * pdfScaleFactor);
  const pdfScaleLineWidth = `${pdfScaleWidth}px`;

  // Restore context if rotated
  if (currentRotation !== 0) {
    resultContext.restore();
  }

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
        scaleLineWidth: pdfScaleLineWidth,
        northArrowSvg: northArrowSvgPaths,
        northArrowRotation: rotationAngle,
        legendLayers: cleanLegendLayers,
        orderedLayerInfo: orderedLayerInfo,
        disclaimer: disclaimer,
        attributions: attribution,
        date: DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A'),
        timeSliderLayers: timeSliderLayers,
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
 * @param {string} pdfUrl - The pdf url to convert
 * @param {string} filename - The filename to save the image as
 * @param {number} dpi - The dpi of the resulting image
 * @param {string} format - The format of the image (jpeg or png)
 * @param {number} quality - The quality of the JPEG image (e.g. 0.95)
 * @returns {Promise<string | void>} The resulting image blob url or void if filename is provided (which triggers the export instead of preview)
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
    const loadingTask = getDocument(pdfUrl);
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
      canvas: canvas,
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

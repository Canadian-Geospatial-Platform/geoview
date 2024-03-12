/* eslint-disable @typescript-eslint/no-unused-vars */
import { MouseEventHandler, RefObject, useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';

import { useTranslation } from 'react-i18next';

import html2Canvas from 'html2canvas';
import { Button, Dialog, DialogActions, DialogTitle, DialogContent } from '@/ui';
import { exportPNG } from '@/core/utils/utilities';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  NorthArrow,
  api,
  useGeoViewMapId,
  useMapLoaded,
  useMapNorthArrow,
  NorthArrowIcon,
  useMapNorthArrowElement,
  useMapScale,
  useLayerLegendLayers,
} from '@/app';
/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const mapId = useGeoViewMapId();
  const { map } = api.maps[mapId];

  const { t } = useTranslation();

  // export template variables
  const exportCanvasRef = useRef(null) as RefObject<HTMLCanvasElement>;
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;

  const northArrow = useMapNorthArrow();
  const scale = useMapScale();

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

  const exportMap = ((): void => {
    if (exportCanvasRef.current) {
      exportPNG(exportCanvasRef.current, mapId);
    }
    closeModal();
  }) as MouseEventHandler<HTMLButtonElement>;

  // Get the markup of the component
  const staticNorthArrowIcon = ReactDOMServer.renderToStaticMarkup(<NorthArrowIcon width={44} height={44} />);

  /**
   * Calculate the width of the canvas based on dialog box container width.
   * @param {HTMLDivElement} dialogBox container where canvas will be rendered.
   * @returns number
   */
  const getCanvasWidth = (dialogBox: HTMLDivElement) => {
    const dialogBoxCompStyles = window.getComputedStyle(dialogBox);

    const paddingLeft = Number(dialogBoxCompStyles.getPropertyValue('padding-left').match(/\d+/)![0]);
    const paddingRight = Number(dialogBoxCompStyles.getPropertyValue('padding-left').match(/\d+/)![0]);

    return dialogBox.clientWidth - paddingLeft - paddingRight;
  };

  /**
   * Set the title of the canvas
   * @param {CanvasRenderingContext2D} context canvas context
   * @param {HTMLCanvasElement} canvas canvas where title will be set.
   */
  const setTitle = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    context.font = "1.25rem 'Roboto','Helvetica','Arial',sans-serif";
    context.textAlign = 'center';
    context.fillStyle = '#000000';
    context.fillText('Export the Map', canvas.width / 2, 30);
  };

  /**
   * Draw map on the convas
   * @param {CanvasRenderingContext2D} context context of the canvas.
   */
  const drawMap = (context: CanvasRenderingContext2D) => {
    Array.prototype.forEach.call(map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'), (canvas) => {
      if (canvas.width > 0) {
        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
        context!.globalAlpha = opacity === '' ? 1 : Number(opacity);
        let matrix;
        const { transform } = canvas.style;

        if (transform) {
          // Get the transform parameters from the style's transform matrix
          matrix = transform
            .match(/^matrix\(([^(]*)\)$/)[1]
            .split(',')
            .map(Number);
        } else {
          matrix = [parseFloat(canvas.style.width) / canvas.width, 0, 0, parseFloat(canvas.style.height) / canvas.height, 0, 0];
        }

        // Apply the transform to the export map context
        CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix);
        const { backgroundColor } = canvas.parentNode.style;
        if (backgroundColor) {
          context!.fillStyle = backgroundColor;
          context!.fillRect(0, 0, canvas.width, canvas.height);
        }
        context!.drawImage(canvas, 0, 100);
      }
      context!.globalAlpha = 1;
      context!.setTransform(1, 0, 0, 1, 0, 0);
    });
  };

  /**
   * Draw north arrow icon on the cavas
   * @param {CanvasRenderingContext2D} context context of the canvas.
   * @param {HTMLCanvasElement} canvas html5 canvas
   * @param {number} height height of the canvas
   */
  const drawNorthIcon = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, height: number) => {
    const northArrowIconImage = new Image();

    northArrowIconImage.onload = () => {
      // TODO: rotate the image here, before rendering on the screen.
      context.drawImage(northArrowIconImage, canvas.width - 60, height);
    };

    const svgNorthIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" style="transform: rotate(185deg 50 50)"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${staticNorthArrowIcon}</div></foreignObject></svg>`;
    northArrowIconImage.src = `data:image/svg+xml;base64,${btoa(svgNorthIcon)}`;
  };

  /**
   * Draw scale on the canvas
   * @param {CanvasRenderingContext2D} context the context of the canvas
   * @param {number} height height of the canvas
   */
  const drawScale = (context: CanvasRenderingContext2D, height: number) => {
    context.font = "1rem 'Roboto','Helvetica','Arial',sans-serif";
    context.textAlign = 'left';
    context.fillStyle = '#000000';
    context.fillText(`${scale.labelGraphic} approx`, 0, height + 100);
    // TODO: Add miles from label graphic if needed.

    // add stroke/line below scale
    context.beginPath();
    context.moveTo(0, height + 110);
    context.lineTo(100, height + 110);
    context.strokeStyle = '#000000';
    context.stroke();
  };

  /**
   * Draw list of legends on the canvas
   * @param {CanvasRenderingContext2D} context the context of the canvas
   * @param {number} height the height of the canvas
   * @param {HTMLElement} legendContainer the container where legend is rendered in the footerTabs.
   */
  const drawLegend = (context: CanvasRenderingContext2D, height: number, legendContainer: HTMLElement) => {
    const styleObj = legendContainer.getAttribute('style')!;
    legendContainer.removeAttribute('style');
    // https://html2canvas.hertzen.com/configuration/
    html2Canvas(legendContainer, {
      backgroundColor: 'inherit',
      width: window.innerWidth - 10,
      scale: 0.85,
      height: legendContainer.scrollHeight,
      windowHeight: legendContainer.scrollHeight,
    }).then((canvas) => {
      context.drawImage(canvas, 0, height + 120);
    });
    legendContainer.setAttribute('style', styleObj);
  };

  /**
   * Draw timestamp on the canvas
   * @param {CanvasRenderingContext2D} context the context of the canvas
   * @param {legendContainer} legendContainer he container where legend is rendered in the footerTabs.
   * @param {number} height the height of the canvas
   * @param {HTMLCanvasElement} canvas html5 canvas
   */
  const drawTimestamp = (
    context: CanvasRenderingContext2D,
    legendContainer: HTMLElement | null,
    height: number,
    canvas: HTMLCanvasElement
  ) => {
    let timeStampHeight = height;
    // Redraw the export template with updated height when legend container is not available,
    // so that their will less white space at the bottom of export modal.
    if (!legendContainer) {
      // eslint-disable-next-line no-param-reassign
      canvas.height = height + 100;
      setTitle(context, canvas);
      drawMap(context);
      // Set the north icon
      if (northArrow) {
        drawNorthIcon(context, canvas, height + 60);
      }
      // Set the scale
      if (scale?.labelGraphic?.length) {
        drawScale(context, height);
      }
    } else {
      timeStampHeight = height + legendContainer.scrollHeight;
    }

    context.font = "1rem 'Roboto','Helvetica','Arial',sans-serif";
    context.textAlign = 'left';
    context.fillStyle = '#000000';
    context.fillText(api.dateUtilities.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A'), 0, timeStampHeight);
  };

  /**
   * Draw canvas on the dialog box.
   * @param {HTMLCanvasElement} _exportCanvas the canvas to be drawn onto dialog box.
   * @param {HTMLDivElement} _dialogBox container where canvas will be drawn
   * @param {number} height the height of the canvas.
   */
  const drawCanvas = (_exportCanvas: HTMLCanvasElement, _dialogBox: HTMLDivElement, height: number) => {
    const exportCanvas = _exportCanvas;
    const dialogBox = _dialogBox;
    const mapSize = map.getSize();
    const mapHeight = mapSize![1];
    const context = exportCanvas.getContext('2d');

    exportCanvas.width = getCanvasWidth(dialogBox);
    exportCanvas.height = height;

    if (context) {
      // Draw background color or image
      context.fillStyle = '#FFFFFF'; // Set background color to white
      context.fillRect(0, 0, exportCanvas.width, exportCanvas.height); // Fill canvas with background color
      //  Set the heading of the canvas
      setTitle(context, exportCanvas);

      // Set the Map.
      drawMap(context);

      // Set the north icon
      if (northArrow) {
        drawNorthIcon(context, exportCanvas, mapHeight + 60);
      }

      // Set the scale
      if (scale?.labelGraphic?.length) {
        drawScale(context, mapHeight);
      }

      // add legend
      const legendContainer = document.getElementById('legendContainer');
      if (legendContainer) {
        drawLegend(context, mapHeight, legendContainer);
      }

      // add timestamp
      drawTimestamp(context, legendContainer, mapHeight, exportCanvas);
    }
  };

  useEffect(() => {
    if (activeModalId === 'export' && exportCanvasRef.current && dialogRef.current) {
      const exportCanvas = exportCanvasRef.current;
      const dialogBox = dialogRef.current;

      drawCanvas(exportCanvas, dialogBox, 1900);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModalId]);

  return (
    <Dialog open={activeModalId === 'export'} onClose={closeModal} fullWidth maxWidth="lg" disablePortal>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogContent dividers ref={dialogRef} sx={{ overflowX: 'hidden' }}>
        <canvas id="exportCanvasTemplate" width="550" height="500" ref={exportCanvasRef} />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('exportModal.cancelBtn')}
        </Button>
        <Button type="text" onClick={exportMap} size="small">
          {t('exportModal.exportBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

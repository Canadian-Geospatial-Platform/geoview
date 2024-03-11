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

  const { t } = useTranslation();

  // export template variables
  const exportCanvasRef = useRef(null) as RefObject<HTMLCanvasElement>;
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;

  const northArrow = useMapNorthArrow();
  const northArrowElement = useMapNorthArrowElement();
  const scale = useMapScale();
  const legendLayers = useLayerLegendLayers();

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

  const exportMap = ((): void => {
    exportPNG(mapId);
    closeModal();
  }) as MouseEventHandler<HTMLButtonElement>;

  // Get the markup of the component
  const staticNorthArrowIcon = ReactDOMServer.renderToStaticMarkup(<NorthArrowIcon width={44} height={44} />);

  useEffect(() => {
    if (activeModalId === 'export' && exportCanvasRef.current && dialogRef.current) {
      const exportCanvas = exportCanvasRef.current;
      const dialogBox = dialogRef.current;
      const { map } = api.maps[mapId];
      const mapSize = map.getSize();
      const context = exportCanvas.getContext('2d');

      const dialogBoxCompStyles = window.getComputedStyle(dialogBox);

      const paddingLeft = Number(dialogBoxCompStyles.getPropertyValue('padding-left').match(/\d+/)![0]);
      const paddingRight = Number(dialogBoxCompStyles.getPropertyValue('padding-left').match(/\d+/)![0]);
      const exportCanvasWidth = dialogBox.clientWidth - paddingLeft - paddingRight;
      const exportCanvasHeight = 3500;

      exportCanvas.width = exportCanvasWidth;
      exportCanvas.height = exportCanvasHeight;

      if (context) {
        // Clear the canvas
        context.clearRect(0, 0, dialogBox.clientWidth - paddingLeft - paddingRight, 1500);

        //  Set the heading of the canvas
        context.font = "1.25rem 'Roboto','Helvetica','Arial',sans-serif";
        context.textAlign = 'center';
        context.fillText('Export the Map', exportCanvas.width / 2, 30);

        // Set the Map.
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
        });

        context!.globalAlpha = 1;
        context!.setTransform(1, 0, 0, 1, 0, 0);

        // Set the north icon
        const northArrowIconImage = new Image();

        northArrowIconImage.onload = () => {
          // TODO: rotate the image here, before rendering on the screen.
          context.drawImage(northArrowIconImage, exportCanvas.width - 40, mapSize![1] + 60);
        };

        const svgNorthIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" style="transform: rotate(185deg 50 50)"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${staticNorthArrowIcon}</div></foreignObject></svg>`;
        northArrowIconImage.src = `data:image/svg+xml;base64,${btoa(svgNorthIcon)}`;

        // Set the scale
        if (scale?.labelGraphic?.length) {
          context.font = "1rem 'Roboto','Helvetica','Arial',sans-serif";
          context.textAlign = 'left';
          context.fillText(`${scale.labelGraphic} approx`, 0, mapSize![1] + 100);
          // TODO: Add miles from label graphic if needed.

          // add stroke/line below scale
          context.beginPath();
          context.moveTo(0, mapSize![1] + 110);
          context.lineTo(100, mapSize![1] + 110);
          context.stroke();
        }

        // add legend
        const legendContainer = document.getElementById('legendContainer')!;
        const styleObj = legendContainer.getAttribute('style')!;
        legendContainer.removeAttribute('style');
        html2Canvas(legendContainer, {
          backgroundColor: 'inherit',
          width: window.innerWidth - 10,
          scale: 0.85,
          height: legendContainer.scrollHeight,
          windowHeight: legendContainer.scrollHeight,
        }).then((canvas) => {
          context.drawImage(canvas, 0, mapSize![1] + 120);
        });
        legendContainer.setAttribute('style', styleObj);
      }
    }
  }, [activeModalId, legendLayers, mapId, northArrowElement.degreeRotation, scale.labelGraphic, staticNorthArrowIcon]);

  return (
    <Dialog open={activeModalId === 'export'} onClose={closeModal} fullWidth maxWidth="lg" disablePortal>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogContent dividers ref={dialogRef}>
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

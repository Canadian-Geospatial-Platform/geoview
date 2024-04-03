/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
// cgpv is not define, it is part of window object, we escape the no-undef globally...
// Many functions name needs the eslint escape no-unused-vars.
// It is an utilities file for demo purpose. It is the reason why we keep it global...
// ==========================================================================================================================
function getMapElement(mapId) {
  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements
  for (let i = 0; i < mapElements.length; i += 1) if (mapElements[i].getAttribute('id') === mapId) return mapElements[i];

  return undefined;
}

// ==========================================================================================================================
function listenToLegendLayerSetChanges(elementId, handlerName) {
  const mapId = handlerName.split('/')[0];
  cgpv.api.maps[mapId].layer.legendsLayerSet.onLayerSetUpdated((sender, payload) => {
    const { resultSet } = payload;
    const outputHeader = '<table class="state"><tr class="state"><th class="state">Name</th><th class="state">Status</th></tr>';
    const displayField = document.getElementById(elementId);
    const output = Object.keys(resultSet).reduce((outputValue, layerPath) => {
      const layerName = resultSet[layerPath]?.layerName || '';
      const { layerStatus } = resultSet[layerPath];
      return `${outputValue}<tr class="state"><td class="state">${layerName}</td><td class="state">${layerStatus}</td></tr>`;
    }, outputHeader);
    displayField.innerHTML = output && output !== outputHeader ? `${output}</table>` : '';
  });
}

// ==========================================================================================================================
const addBoundsPolygon = (mapId, bbox) => {
  const newBbox = cgpv.api.projection.transformAndDensifyExtent(
    bbox,
    `EPSG:${cgpv.api.maps[mapId].getMapState().currentProjection}`,
    `EPSG:4326`
  );

  const { geometry } = cgpv.api.maps[mapId].layer;
  geometry.setActiveGeometryGroup();
  geometry.deleteGeometriesFromGroup(0);

  const polygon = cgpv.api.maps[mapId].layer.geometry.addPolygon([newBbox], {
    style: {
      strokeColor: '#000',
      strokeWidth: 5,
      strokeOpacity: 0.8,
    },
  });
};

// ==========================================================================================================================
const createInfoTable = (mapId, resultSetId, resultSet, eventType) => {
  if (!['click', 'all-features'].includes(eventType)) return;
  const infoTable = document.getElementById(`${resultSetId}-${eventType}`);
  infoTable.textContent = '';
  const oldContent = document.getElementById(`layer${mapId.slice(-1)}-${eventType}-info`);
  if (oldContent) oldContent.remove();
  const content = document.createElement('div');
  content.id = `layer${mapId.slice(-1)}-${eventType}-info`;
  infoTable.appendChild(content);
  Object.keys(resultSet).forEach((layerPath) => {
    const activeResultSet = resultSet[layerPath];
    const layerData = activeResultSet.data.features;

    // Header of the layer
    const infoH1 = document.createElement('h1');
    // eslint-disable-next-line no-nested-ternary
    infoH1.innerText = !layerData ? `${layerPath} (error)` : layerData?.length ? layerPath : `${layerPath} (empty)`;
    content.appendChild(infoH1);

    if (layerData?.length) {
      let infoH2 = document.createElement('h2');
      infoH2.innerText = 'Aliases and types';
      content.appendChild(infoH2);

      // Header of the layer table that describe the aliases and the types
      let tableElement = document.createElement('table');
      tableElement.classList.add('info');
      content.appendChild(tableElement);

      let tableRow = document.createElement('tr');
      tableRow.classList.add('info');
      tableElement.appendChild(tableRow);
      let tableData = document.createElement('th');
      tableData.classList.add('infoCol1');
      tableRow.appendChild(tableData);
      Object.keys(layerData[0].fieldInfo).forEach((fieldName) => {
        tableData = document.createElement('th');
        tableData.classList.add('info');
        tableData.innerText = fieldName;
        tableRow.appendChild(tableData);
      });

      // Row describing the aliases
      tableRow = document.createElement('tr');
      tableRow.classList.add('info');
      tableElement.appendChild(tableRow);
      tableData = document.createElement('td');
      tableData.classList.add('infoCol1');
      tableData.innerText = 'Aliases =>';
      tableRow.appendChild(tableData);
      Object.keys(layerData[0].fieldInfo).forEach((fieldName) => {
        tableData = document.createElement('td');
        tableData.classList.add('info');
        tableData.innerText = layerData[0].fieldInfo[fieldName].alias;
        tableRow.appendChild(tableData);
      });

      // Row describing the types
      tableRow = document.createElement('tr');
      tableRow.classList.add('infoCol1');
      tableElement.appendChild(tableRow);
      tableData = document.createElement('td');
      tableData.classList.add('infoCol1');
      tableData.innerText = 'Types =>';
      tableRow.appendChild(tableData);
      Object.keys(layerData[0].fieldInfo).forEach((fieldName) => {
        tableData = document.createElement('td');
        tableData.classList.add('info');
        tableData.innerText = layerData[0].fieldInfo[fieldName].dataType;
        tableRow.appendChild(tableData);
      });

      // Header of the data section
      infoH2 = document.createElement('h2');
      infoH2.innerText = 'Data';
      content.appendChild(infoH2);

      tableElement = document.createElement('table');
      tableElement.classList.add('info');
      content.appendChild(tableElement);
      let createHeaders = true;

      layerData.forEach((row) => {
        // Header of the data table
        if (createHeaders) {
          tableRow = document.createElement('tr');
          tableRow.classList.add('info');
          tableElement.appendChild(tableRow);

          tableData = document.createElement('th');
          tableData.classList.add('infoCol1');
          tableData.innerText = 'Symbology';
          tableRow.appendChild(tableData);

          tableData = document.createElement('th');
          tableData.classList.add('infoCol1');
          tableData.innerText = 'Zoom To';
          tableRow.appendChild(tableData);

          Object.keys(row.fieldInfo).forEach((fieldName) => {
            tableData = document.createElement('th');
            tableData.classList.add('info');
            tableData.innerText = fieldName;
            tableRow.appendChild(tableData);
          });
          createHeaders = false;
        }

        // Data row (feature information)
        tableRow = document.createElement('tr');
        tableRow.classList.add('info');
        tableElement.appendChild(tableRow);

        // Feature icon
        tableData = document.createElement('td');
        tableData.classList.add('info');
        tableData.appendChild(row.featureIcon);
        tableRow.appendChild(tableData);

        // Zoom to button
        tableData = document.createElement('td');
        tableData.classList.add('info');
        tableRow.appendChild(tableData);
        const tableZoomTo = document.createElement('button');
        tableZoomTo.innerText = 'Zoom To Feature';
        tableZoomTo.addEventListener('click', (e) => {
          // eslint-disable-next-line no-undef
          cgpv.api.maps[mapId].zoomToExtent(row.extent);
          addBoundsPolygon(mapId, row.extent);
        });
        tableData.appendChild(tableZoomTo);

        // feature fields
        Object.keys(row.fieldInfo).forEach((fieldName) => {
          tableData = document.createElement('td');
          tableData.classList.add('info');
          if (row.fieldInfo[fieldName].dataType === 'date') {
            const { dateUtilities } = cgpv.api;
            tableData.innerText = row.fieldInfo[fieldName].value;
          } else tableData.innerText = row.fieldInfo[fieldName].value;
          tableRow.appendChild(tableData);
        });
      });
    }
    content.appendChild(document.createElement('br'));
    content.appendChild(document.createElement('hr'));
  });
};

// ==========================================================================================================================
const createTableOfFilter = (mapId) => {
  let mapButtonsDiv = document.getElementById(`layer${mapId.slice(-1)}-buttons-pre`);
  const oldTable = document.getElementById(`layer${mapId.slice(-1)}-buttons-table`);
  if (oldTable) oldTable.remove();
  const tableElement = document.createElement('table');
  tableElement.id = `layer${mapId.slice(-1)}-buttons-table`;
  tableElement.style.width = '100%';
  tableElement.border = '1px solid black';
  mapButtonsDiv.appendChild(tableElement);
  if (!cgpv.api.maps?.[mapId]?.layer?.geoviewLayers) return;
  Object.keys(cgpv.api.maps[mapId].layer.geoviewLayers).forEach((geoviewLayerId) => {
    const geoviewLayer = cgpv.api.maps[mapId].layer.geoviewLayers[geoviewLayerId];
    Object.keys(cgpv.api.maps[mapId].layer.registeredLayers).forEach((layerPath) => {
      if (layerPath.startsWith(geoviewLayerId)) {
        const layerConfig = cgpv.api.maps[mapId].layer.registeredLayers[layerPath];
        const { geoviewRenderer } = cgpv.api.maps[mapId];
        geoviewRenderer.getLegendStyles(layerConfig).then((legendStyle) => {
          mapButtonsDiv = document.createElement('td');
          // mapButtonsDiv.style.width = '16.66%';
          mapButtonsDiv.border = '1px solid black';
          tableElement.appendChild(mapButtonsDiv);

          const geoviewLayerH1 = document.createElement('h1');
          geoviewLayerH1.innerText = geoviewLayer.geoviewLayerName.en;
          mapButtonsDiv.appendChild(geoviewLayerH1);

          const layerConfigH2 = document.createElement('h2');
          layerConfigH2.innerText = `${layerConfig?.layerName?.en}`;
          layerConfigH2.style.height = '15px';
          mapButtonsDiv.appendChild(layerConfigH2);

          const toggleLayerVisibility = document.createElement('button');
          let visibilityFlag = geoviewLayer.getVisible(layerPath);
          if (visibilityFlag)
            toggleLayerVisibility.innerText = layerConfig?.source?.style === undefined ? 'Hide' : `Hide style ${layerConfig.source.style}`;
          else
            toggleLayerVisibility.innerText = layerConfig?.source?.style === undefined ? 'Show' : `Show style ${layerConfig.source.style}`;
          toggleLayerVisibility.addEventListener('click', (e) => {
            visibilityFlag = !geoviewLayer.getVisible(layerPath);
            if (visibilityFlag)
              toggleLayerVisibility.innerText =
                layerConfig?.source?.style === undefined ? 'Hide' : `Hide style ${layerConfig.source.style}`;
            else
              toggleLayerVisibility.innerText =
                layerConfig?.source?.style === undefined ? 'Show' : `Show style ${layerConfig.source.style}`;
            geoviewLayer.setVisible(visibilityFlag, layerPath);
          });
          layerConfigH2.appendChild(toggleLayerVisibility);

          if (layerConfig.style) {
            Object.keys(layerConfig.style).forEach((geometry) => {
              const geometryText = document.createElement('p');
              geometryText.innerText = `Geometry = ${geometry}`;
              geometryText.style.height = '15px';
              mapButtonsDiv.appendChild(geometryText);
              if (layerConfig.style[geometry].styleType === 'uniqueValue') {
                if (layerConfig.style[geometry].defaultSettings) {
                  const toggleUniqueValueDefault = document.createElement('button');
                  if (layerConfig.style[geometry].defaultVisible === true)
                    toggleUniqueValueDefault.innerText = `Hide ${layerConfig.style[geometry].defaultLabel}`;
                  else if (layerConfig.style[geometry].defaultVisible === false)
                    toggleUniqueValueDefault.innerText = `Show ${layerConfig.style[geometry].defaultLabel}`;
                  toggleUniqueValueDefault.addEventListener('click', (e) => {
                    if (layerConfig.style[geometry].defaultVisible === true) {
                      layerConfig.style[geometry].defaultVisible = false;
                      toggleUniqueValueDefault.innerText = `Show ${layerConfig.style[geometry].defaultLabel}`;
                    } else if (layerConfig.style[geometry].defaultVisible === false) {
                      layerConfig.style[geometry].defaultVisible = true;
                      toggleUniqueValueDefault.innerText = `Hide ${layerConfig.style[geometry].defaultLabel}`;
                    }
                    const checkbox = document.getElementById(`checkbox-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filterInput = document.getElementById(`filter-input-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filter = checkbox.value === 'true' ? filterInput.value : geoviewLayer.getLayerFilter(layerPath);
                    geoviewLayer.applyViewFilter(layerPath, filter, checkbox.value !== 'true');
                  });
                  mapButtonsDiv.appendChild(toggleUniqueValueDefault);
                  mapButtonsDiv.appendChild(legendStyle[geometry].defaultCanvas);
                  const br = document.createElement('br');
                  br.style.height = '1px';
                  mapButtonsDiv.appendChild(br);
                }
                for (let i = 0; i < layerConfig.style[geometry].uniqueValueStyleInfo.length; i++) {
                  const toggleUniqueValueFeature = document.createElement('button');
                  if (layerConfig.style[geometry].uniqueValueStyleInfo[i].visible === true)
                    toggleUniqueValueFeature.innerText = `Hide ${layerConfig.style[geometry].uniqueValueStyleInfo[i].label}`;
                  else if (layerConfig.style[geometry].uniqueValueStyleInfo[i].visible === false)
                    toggleUniqueValueFeature.innerText = `Show ${layerConfig.style[geometry].uniqueValueStyleInfo[i].label}`;
                  toggleUniqueValueFeature.addEventListener('click', (e) => {
                    const uniqueValueStyleInfoEntry = layerConfig.style[geometry].uniqueValueStyleInfo[i];
                    if (uniqueValueStyleInfoEntry.visible === true) {
                      uniqueValueStyleInfoEntry.visible = false;
                      toggleUniqueValueFeature.innerText = `Show ${uniqueValueStyleInfoEntry.label}`;
                    } else if (uniqueValueStyleInfoEntry.visible === false) {
                      uniqueValueStyleInfoEntry.visible = true;
                      toggleUniqueValueFeature.innerText = `Hide ${uniqueValueStyleInfoEntry.label}`;
                    }
                    const checkbox = document.getElementById(`checkbox-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filterInput = document.getElementById(`filter-input-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filter = checkbox.value === 'true' ? filterInput.value : geoviewLayer.getLayerFilter(layerPath);
                    geoviewLayer.applyViewFilter(layerPath, filter, checkbox.value !== 'true');
                  });
                  mapButtonsDiv.appendChild(toggleUniqueValueFeature);
                  mapButtonsDiv.appendChild(legendStyle[geometry].arrayOfCanvas[i]);

                  const br = document.createElement('br');
                  br.style.height = '1px';
                  mapButtonsDiv.appendChild(br);
                }
              } else if (layerConfig.style[geometry].styleType === 'classBreaks') {
                if (layerConfig.style[geometry].defaultSettings) {
                  const toggleClassBreakDefault = document.createElement('button');
                  if (layerConfig.style[geometry].defaultVisible === true)
                    toggleClassBreakDefault.innerText = `Hide ${layerConfig.style[geometry].defaultLabel}`;
                  else if (layerConfig.style[geometry].defaultVisible === false)
                    toggleClassBreakDefault.innerText = `Show ${layerConfig.style[geometry].defaultLabel}`;
                  toggleClassBreakDefault.addEventListener('click', (e) => {
                    if (layerConfig.style[geometry].defaultVisible === true) {
                      layerConfig.style[geometry].defaultVisible = false;
                      toggleClassBreakDefault.innerText = `Show ${layerConfig.style[geometry].defaultLabel}`;
                    } else if (layerConfig.style[geometry].defaultVisible === false) {
                      layerConfig.style[geometry].defaultVisible = true;
                      toggleClassBreakDefault.innerText = `Hide ${layerConfig.style[geometry].defaultLabel}`;
                    }
                    const checkbox = document.getElementById(`checkbox-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filterInput = document.getElementById(`filter-input-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filter = checkbox.value === 'true' ? filterInput.value : geoviewLayer.getLayerFilter(layerPath);
                    geoviewLayer.applyViewFilter(layerPath, filter, checkbox.value !== 'true');
                  });
                  mapButtonsDiv.appendChild(toggleClassBreakDefault);
                  const br = document.createElement('br');
                  br.style.height = '1px';
                  mapButtonsDiv.appendChild(br);
                }
                for (let i = 0; i < layerConfig.style[geometry].classBreakStyleInfo.length; i++) {
                  const toggleClassBreakFeature = document.createElement('button');
                  if (layerConfig.style[geometry].classBreakStyleInfo[i].visible === true)
                    toggleClassBreakFeature.innerText = `Hide ${layerConfig.style[geometry].classBreakStyleInfo[i].label}`;
                  else if (layerConfig.style[geometry].classBreakStyleInfo[i].visible === false)
                    toggleClassBreakFeature.innerText = `Show ${layerConfig.style[geometry].classBreakStyleInfo[i].label}`;
                  toggleClassBreakFeature.addEventListener('click', (e) => {
                    const classBreakStyleInfoEntry = layerConfig.style[geometry].classBreakStyleInfo[i];
                    if (classBreakStyleInfoEntry.visible === true) {
                      classBreakStyleInfoEntry.visible = false;
                      toggleClassBreakFeature.innerText = `Show ${classBreakStyleInfoEntry.label}`;
                    } else if (classBreakStyleInfoEntry.visible === false) {
                      classBreakStyleInfoEntry.visible = true;
                      toggleClassBreakFeature.innerText = `Hide ${classBreakStyleInfoEntry.label}`;
                    }
                    const checkbox = document.getElementById(`checkbox-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filterInput = document.getElementById(`filter-input-${mapId}-${geoviewLayer.geoviewLayerId}`);
                    const filter = checkbox.value === 'true' ? filterInput.value : geoviewLayer.getLayerFilter(layerPath);
                    geoviewLayer.applyViewFilter(layerPath, filter, checkbox.value !== 'true');
                  });
                  mapButtonsDiv.appendChild(toggleClassBreakFeature);
                  mapButtonsDiv.appendChild(legendStyle[geometry].arrayOfCanvas[i]);

                  const br = document.createElement('br');
                  br.style.height = '1px';
                  mapButtonsDiv.appendChild(br);
                }
              }
              if (geoviewLayer.getLayerFilter(layerPath)) {
                const layerFilterText = document.createElement('p');
                layerFilterText.innerText = `Extra filter: `;
                mapButtonsDiv.appendChild(layerFilterText);
                const layerFilterInput = document.createElement('input');
                layerFilterInput.id = `filter-input-${mapId}-${geoviewLayer.geoviewLayerId}`;
                layerFilterInput.style.width = '50%';
                layerFilterText.appendChild(layerFilterInput);
                layerFilterInput.value = geoviewLayer.getLayerFilter(layerPath) || '';
                const layerFilterButton = document.createElement('button');
                layerFilterButton.addEventListener('click', (e) => {
                  const checkbox = document.getElementById(`checkbox-${mapId}-${geoviewLayer.geoviewLayerId}`);
                  geoviewLayer.applyViewFilter(layerPath, layerFilterInput.value, checkbox.value !== 'true');
                });
                layerFilterButton.innerText = 'Apply';
                layerFilterText.style.width = 'max-content';
                layerFilterText.appendChild(layerFilterButton);

                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.value = 'false';
                checkboxInput.id = `checkbox-${mapId}-${geoviewLayer.geoviewLayerId}`;
                checkboxInput.addEventListener('click', (e) => {
                  checkboxInput.value = checkboxInput.value === 'true' ? 'false' : 'true';
                  geoviewLayer.applyViewFilter(layerPath, layerFilterInput.value, checkboxInput.value !== 'true');
                });
                mapButtonsDiv.appendChild(checkboxInput);
                const checkboxText = document.createElement('label');
                checkboxText.innerText = `apply only the extra filter`;
                mapButtonsDiv.appendChild(checkboxText);
              }
            });
          }
        });
      }
    });
  });
};

// ==========================================================================================================================
function displayLegend(layerSetId, resultSet) {
  const addHeader = (title, container) => {
    const tableHeader = document.createElement('th');
    tableHeader.style = 'text-align: center; vertical-align: middle;';
    tableHeader.innerHTML = title;
    container.appendChild(tableHeader);
  };
  const addData = (data, container) => {
    const tableData = document.createElement('td');
    tableData.style.verticalAlign = 'middle';
    tableData.style.textAlign = 'center';
    if (data)
      if (typeof data === 'string') tableData.innerHTML = data.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      else tableData.appendChild(data);
    else tableData.innerHTML = 'NO LEGEND';
    container.appendChild(tableData);
  };
  const oldTable = document.getElementById(`${layerSetId}-table`);
  if (oldTable) oldTable.parentNode.removeChild(oldTable);
  const legendTable = document.getElementById(`${layerSetId}-table-pre`);
  const table = document.createElement('table');
  table.id = `${layerSetId}-table`;
  table.border = '1';
  table.style = 'width:50%';
  legendTable.appendChild(table);
  let createHeader = true;
  Object.keys(resultSet).forEach((layerPath) => {
    const activeResultSet = resultSet[layerPath];
    if (createHeader) {
      createHeader = false;
      const tableRow1 = document.createElement('tr');
      table.appendChild(tableRow1);
      addHeader('Layer Path', tableRow1);
      addHeader('Status/Label', tableRow1);
      addHeader('Symbology', tableRow1);
    }
    if (!activeResultSet?.data?.legend) {
      const tableRow = document.createElement('tr');
      addData(layerPath, tableRow);
      let legendValue = '';
      if (activeResultSet.data === undefined) legendValue = '(waiting for legend)';
      if (activeResultSet.data === null) legendValue = '(legend fetch error)';
      if (activeResultSet.data && !activeResultSet.data.legend && activeResultSet.layerStatus === 'loaded') legendValue = '(no legend)';
      addData(activeResultSet.layerStatus, tableRow);
      addData(legendValue, tableRow);
      table.appendChild(tableRow);
    } else if (activeResultSet.data?.type === 'ogcWms' || activeResultSet.data?.type === 'imageStatic') {
      const tableRow = document.createElement('tr');
      addData(activeResultSet.data.layerPath, tableRow);
      addData(activeResultSet.layerStatus, tableRow);
      addData(activeResultSet.data.legend, tableRow);
      table.appendChild(tableRow);
    } else {
      const addRow = (layerPathToUse, label, canvas) => {
        const tableRow = document.createElement('tr');
        addData(layerPathToUse, tableRow);
        addData(label, tableRow); // canvas.style = "border: 1px solid black;"
        addData(canvas, tableRow);
        table.appendChild(tableRow);
      };
      if (activeResultSet.data?.legend) {
        Object.keys(activeResultSet.data.legend).forEach((geometryKey) => {
          if (geometryKey) {
            if (activeResultSet.data.styleConfig[geometryKey].styleType === 'uniqueValue') {
              if (activeResultSet.data.legend[geometryKey].defaultCanvas)
                addRow(
                  layerPath,
                  activeResultSet.data.styleConfig[geometryKey].defaultLabel,
                  activeResultSet.data.legend[geometryKey].defaultCanvas
                );
              for (let i = 0; i < activeResultSet.data.legend[geometryKey].arrayOfCanvas.length; i++) {
                addRow(
                  layerPath,
                  activeResultSet.data.styleConfig[geometryKey].uniqueValueStyleInfo[i].label,
                  activeResultSet.data.legend[geometryKey].arrayOfCanvas[i]
                );
              }
            } else if (activeResultSet.data.styleConfig[geometryKey].styleType === 'classBreaks') {
              if (activeResultSet.data.legend[geometryKey].defaultCanvas)
                addRow(
                  layerPath,
                  activeResultSet.data.styleConfig[geometryKey].defaultLabel,
                  activeResultSet.data.legend[geometryKey].defaultCanvas
                );
              for (let i = 0; i < activeResultSet.data.legend[geometryKey].arrayOfCanvas.length; i++) {
                addRow(
                  layerPath,
                  activeResultSet.data.styleConfig[geometryKey].classBreakStyleInfo[i].label,
                  activeResultSet.data.legend[geometryKey].arrayOfCanvas[i]
                );
              }
            } else if (activeResultSet.data.styleConfig[geometryKey].styleType === 'simple') {
              addRow(
                layerPath,
                activeResultSet.data.styleConfig[geometryKey].label,
                activeResultSet.data.legend[geometryKey].defaultCanvas
              );
            }
          }
        });
      }
    }
  });
}

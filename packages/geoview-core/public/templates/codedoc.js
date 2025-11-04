/* eslint-disable @typescript-eslint/no-unused-vars */
// Many functions name needs the eslint escape no-unused-vars.
// It is an utilities file for demo purpose. It is the reason why we keep it global...
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function createCodeSnippet() {
  sleep(500);

  const scripts = Array.prototype.filter.call(document.getElementsByTagName('script'), (obj) => {
    return obj.getAttribute('id') === null;
  });

  const script = scripts[scripts.length - 1];
  for (let i = 0, loop = true; loop; i++) {
    const el = document.getElementById(`codeSnippet${i || ''}`);
    if (el !== null) {
      el.innerHTML = `<pre>${script.textContent
        .replace('//create snippets\n', '')
        .replace('createConfigSnippet();\n', '')
        .replace('createCodeSnippet();\n', '')}</pre>`;
    } else loop = false;
  }
}

function createCodeSnippetUsingIDs() {
  sleep(500);

  // Enhanced code snippet generator which allows to associate a script id with a code snippet script (og function is using indexes)
  // and write down different code snippet spreaded in the dom tree (og function always reuses 'script' variable which is the last script tag found in the dom)
  // Get all scripts on page which has an id
  const scripts = Array.prototype.filter.call(document.getElementsByTagName('script'), (obj) => {
    return obj.getAttribute('id') !== null;
  });

  // Loop on each script
  for (let i = 0; i < scripts.length; i++) {
    // Try to find a codeSnippet flag interested in that script
    const script = scripts[i];
    document.querySelectorAll(`[id-script="${script.id}"]`).forEach((el) => {
      el.innerHTML = `<pre>${script.textContent}</pre>`;
    });
  }
}

function createConfigSnippet() {
  sleep(500);

  let j = 0;
  // inject configuration snippet inside panel
  for (j = 0; j < document.getElementsByClassName('geoview-map').length; j++) {
    let configSnippet = '';
    const mapID = document.getElementsByClassName('geoview-map')[j].id;
    configSnippet = document.getElementById(mapID).attributes['data-config'];
    const el = document.getElementById(`${mapID}CS`);

    // check if JSON can be parsed, if not do nothing
    try {
      if (configSnippet !== undefined && el !== null) {
        // Erase comments in the configSnippet.
        const uncommentedConfigSnippet = configSnippet.value
          .split(/(?<!\\)'/gm)
          .map((fragment, index) => {
            if (index % 2) return fragment.replaceAll(/\/\*/gm, String.fromCharCode(1)).replaceAll(/\*\//gm, String.fromCharCode(2));
            return fragment; // .replaceAll(/\/\*(?<=\/\*)((?:.|\n|\r)*?)(?=\*\/)\*\//gm, '');
          })
          .join("'")
          .replaceAll(/\/\*(?<=\/\*)((?:.|\n|\r)*?)(?=\*\/)\*\//gm, '')
          .replaceAll(String.fromCharCode(1), '/*')
          .replaceAll(String.fromCharCode(2), '*/');

        el.textContent = JSON.stringify(
          JSON.parse(
            uncommentedConfigSnippet
              // remove CR and LF from the map config
              .replace(/(\r\n|\n|\r)/gm, '')
              // replace apostrophes not preceded by a backslash with quotes
              .replace(/(?<!\\)'/gm, '"')
              // replace apostrophes preceded by a backslash with a single apostrophe
              .replace(/\\'/gm, "'")
          ),
          undefined,
          2
        );
      }
    } catch (error) {
      console.log('Error trapped in createConfigSnippet');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  createCollapsible();
}

function createCollapsible() {
  const coll = document.getElementsByClassName('collapsible');
  let i;

  for (i = 0; i < coll.length; i++) {
    const content = coll[i].nextElementSibling;
    if (coll[i].classList.contains('active')) content.style.display = 'block';
    else content.style.display = 'none';

    coll[i].addEventListener('click', function () {
      this.classList.toggle('active');
      if (this.classList.contains('active')) content.style.display = 'block';
      else content.style.display = 'none';
    });
  }
}

function addLog(logId, msg) {
  const logs = document.getElementById(logId);
  logs.innerText += `${msg}\n`;
  logs.scrollTop = logs.scrollHeight;
}

function addDefaultShapes(map, groupKey) {
  // Set active geometry group
  map.layer.geometry.setActiveGeometryGroup(groupKey);

  // Add dummy shapes
  map.layer.geometry.addCircle([-98.94, 57.94], { style: { strokeColor: 'purple', strokeWidth: 2 } });

  // Add dummy shapes
  map.layer.geometry.addMarkerIcon([-105.78, 57.52]);

  // Add dummy shapes
  map.layer.geometry.addPolyline(
    [
      [-106.17, 63.99],
      [-104.46, 62.55],
      [-102.26, 56.44],
    ],
    { style: { strokeColor: 'blue', strokeWidth: 2 } }
  );

  // Add dummy shapes
  map.layer.geometry.addPolygon(
    [
      [
        [-96.71, 64.41],
        [-93.1, 62.86],
        [-94.36, 56.67],
        [-96.71, 64.41],
      ],
    ],
    { style: { strokeColor: 'green', strokeWidth: 2 } }
  );
}

function addSpecialShapes(map, groupKey) {
  // Set active geometry group
  map.layer.geometry.setActiveGeometryGroup(groupKey);

  // Add dummy shapes
  map.layer.geometry.addPolygon(
    [
      [
        [-86.06, 62.59],
        [-78.29, 62.59],
        [-80.43, 55.73],
        [-86.06, 62.59],
      ],
    ],
    { style: { strokeColor: 'red', strokeWidth: 2 } }
  );
}

function addRectangle(map, groupKey) {
  // Set active geometry group
  map.layer.geometry.setActiveGeometryGroup(groupKey);

  // Add dummy shapes
  map.layer.geometry.addPolygon(
    [
      [
        [-100, 60],
        [-100, 70],
        [-70, 70],
        [-70, 60],
        [-100, 60],
      ],
    ],
    { style: { strokeColor: 'Indigo', strokeWidth: 2, fillColor: 'Indigo', fillOpacity: 0.25 } },
    'rectangle-outline'
  );
}

function listenToLegendLayerSetChanges(elementId, mapViewer) {
  mapViewer.layer.legendsLayerSet.onLayerSetUpdated((sender, payload) => {
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

async function onConfigChange(mapId, e) {
  // create new map in a new dom node
  let mapDiv = document.getElementById(mapId);
  if (mapDiv === null) {
    mapDiv = document.createElement('div');
    mapDiv.setAttribute('id', mapId);
    document.getElementById('mapSection').appendChild(mapDiv);
  }

  // Set the language to the switchLang value, always
  mapDiv.setAttribute('data-lang', switchLang.value);

  // Delete previous map if existing
  if (cgpv.api.hasMapViewer(mapId)) {
    await cgpv.api.deleteMapViewer(mapId);
  }

  // create map
  try {
    const mapViewer = await cgpv.api.createMapFromConfig(mapId, e.target.value, 800);
    listenToLegendLayerSetChanges('sandboxMap-state', mapViewer);
  } catch (error) {
    console.error('Failed to create map from config', error);
  }

  try {
    // Fetch the data
    const res = await fetch(e.target.value);
    const data = await res.json();

    // fetch JSON config file to show in the text are section
    document.getElementById('configGeoview').textContent = JSON.stringify(data, null, 4);

    // set default number of lines
    const textarea = document.querySelector('textarea');
    const lineNumbers = document.querySelector('.line-numbers');
    const numberOfLines = textarea.value.split('\n').length;
    lineNumbers.innerHTML = Array(numberOfLines).fill('<span></span>').join('');

    // pre-select theme and projection from config file
    document.getElementById('switchTheme').value = data.theme;
    document.getElementById('switchProjection').value = data.map.viewSettings.projection;

    // update url to include selected file
    const element = document.getElementById('configLoader');
    window.history.replaceState(null, null, `?config=${element.value}`);
  } catch (error) {
    console.error('Unable to fetch data:', error);
  }
}

function cleanURL(url) {
  // Split the protocol and the rest
  const [protocolPart, rest] = url.split('://');

  // Split domain and path
  const firstSlashIndex = rest.indexOf('/');
  const domain = firstSlashIndex === -1 ? rest : rest.substring(0, firstSlashIndex);
  let path = firstSlashIndex === -1 ? '' : rest.substring(firstSlashIndex);

  // Replace multiple slashes with one in path
  path = path.replace(/\/+/g, '/');

  // Remove trailing slash if it's not the root "/"
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Reconstruct the cleaned URL
  return `${protocolPart}://${domain}${path}`;
}

function testSuiteCreateTable(plugin) {
  // The map id
  const mapId = plugin.mapViewer.mapId;
  const description = plugin.getDescriptionAsHtml();
  const wrapper = document.createElement('div');

  wrapper.innerHTML = `
    <div style="white-space: pre-line;">${description}</div>
    <div style="text-align:right;">
      <span id="suitesCheck-${mapId}"></span>
    </div>
    <div style="text-align:right;">
      Suites: <span id="suitesCompleted-${mapId}">0</span>/<span id="suitesTotal-${mapId}">0</span>
    </div>
    <div style="text-align:right;">
      Running: <span id="testsRunning-${mapId}">0</span> | Done success: <span id="testsDoneSuccess-${mapId}" style="color:green;">0</span> | Done failed: <span id="testsDoneFailed-${mapId}" style="color:red;">0</span> | Done: <span id="testsDone-${mapId}">0</span>/<span id="testsTotal-${mapId}">0</span>
    </div>
    <button class="btnLaunchTests" onclick="launchTests('${mapId}')">LAUNCH TESTS ${mapId} !</button>
    <br/><br/>
    <table id="tableResults-${mapId}" class="tableResults">
      <colgroup>
        <col>
        <col style="width: 80px;">
        <col>
      </colgroup>
      <thead>
        <tr><td>TEST</td><td>RESULT</td><td>DETAILS</td></tr>
      </thead>
      <tbody id="tableBody-${mapId}"></tbody>
    </table>
  `;

  return wrapper;
}

function testSuiteUpdateTotals(plugin, idPrefix = '') {
  const prefix = idPrefix ? idPrefix + '-' : '';
  const suitesCompleted = document.getElementById(prefix + 'suitesCompleted-' + plugin.mapViewer.mapId);
  if (suitesCompleted) suitesCompleted.textContent = plugin.getSuitesCompleted();
  const suitesTotal = document.getElementById(prefix + 'suitesTotal-' + plugin.mapViewer.mapId);
  if (suitesTotal) suitesTotal.textContent = plugin.getSuitesTotal();
  const suitesCheck = document.getElementById(prefix + 'suitesCheck-' + plugin.mapViewer.mapId);
  if (suitesCheck) {
    const suiteRunning = plugin.getTestsRunning() > 0;
    const completedFully = plugin.getTestsDoneAllAndSuiteDone();
    const allSuccess = plugin.getTestsDoneAllSuccessAndSuiteDone();
    suitesCheck.textContent = completedFully ? (allSuccess ? '✔' : '✘') : suiteRunning ? '⏳' : '';
    suitesCheck.style.color = completedFully ? (allSuccess ? 'green' : 'red') : 'black';
  }
  const testsRunning = document.getElementById(prefix + 'testsRunning-' + plugin.mapViewer.mapId);
  if (testsRunning) testsRunning.textContent = plugin.getTestsRunning();
  const testsDoneSuccess = document.getElementById(prefix + 'testsDoneSuccess-' + plugin.mapViewer.mapId);
  if (testsDoneSuccess) testsDoneSuccess.textContent = plugin.getTestsDoneSuccess();
  const testsDoneFailed = document.getElementById(prefix + 'testsDoneFailed-' + plugin.mapViewer.mapId);
  if (testsDoneFailed) testsDoneFailed.textContent = plugin.getTestsDoneFailed();
  const testsDone = document.getElementById(prefix + 'testsDone-' + plugin.mapViewer.mapId);
  if (testsDone) testsDone.textContent = plugin.getTestsDone();
  const testsTotal = document.getElementById(prefix + 'testsTotal-' + plugin.mapViewer.mapId);
  if (testsTotal) testsTotal.textContent = plugin.getTestsTotal();
}

function testSuiteUpdateGrandTotal(plugins) {
  let totalSuitesCompleted = 0;
  let totalSuitesTotal = 0;
  let totalTestsRunning = 0;
  let totalTestsDoneSuccess = 0;
  let totalTestsDoneFailed = 0;
  let totalTestsDone = 0;
  let totalTestsTotal = 0;
  const thePlugins = Object.values(plugins);
  thePlugins.forEach((plugin) => {
    totalSuitesCompleted += plugin.getSuitesCompleted();
    totalSuitesTotal += plugin.getSuitesTotal();
    totalTestsRunning += plugin.getTestsRunning();
    totalTestsDoneSuccess += plugin.getTestsDoneSuccess();
    totalTestsDoneFailed += plugin.getTestsDoneFailed();
    totalTestsDone += plugin.getTestsDone();
    totalTestsTotal += plugin.getTestsTotal();
  });
  const suitesCompleted = document.getElementById('allSuitesCompleted');
  suitesCompleted.textContent = totalSuitesCompleted;
  const suitesTotal = document.getElementById('allSuitesTotal');
  suitesTotal.textContent = totalSuitesTotal;
  const suitesCheck = document.getElementById('allSuitesCheck');
  const suiteRunning = totalTestsRunning > 0;
  const completedFully = thePlugins.every((plugin) => plugin.getTestsDoneAllAndSuiteDone());
  const allSuccess = thePlugins.every((plugin) => plugin.getTestsDoneAllSuccessAndSuiteDone());
  suitesCheck.textContent = completedFully ? (allSuccess ? '✔' : '✘') : suiteRunning ? '⏳' : '';
  suitesCheck.style.color = completedFully ? (allSuccess ? 'green' : 'red') : 'black';
  const testsRunning = document.getElementById('allSuitesTestsRunning');
  testsRunning.textContent = totalTestsRunning;
  const testsDoneSuccess = document.getElementById('allSuitesTestsDoneSuccess');
  testsDoneSuccess.textContent = totalTestsDoneSuccess;
  const testsDoneFailed = document.getElementById('allSuitesTestsDoneFailed');
  testsDoneFailed.textContent = totalTestsDoneFailed;
  const testsDone = document.getElementById('allSuitesTestsDone');
  testsDone.textContent = totalTestsDone;
  const testsTotal = document.getElementById('allSuitesTestsTotal');
  testsTotal.textContent = totalTestsTotal;
}

function testSuiteAddOrUpdateTestResultRow(plugin, testSuite, testTester, test, details, idPrefix = '') {
  let passed = null;
  if (test.getStatus() === 'success') passed = true;
  else if (test.getStatus() === 'failed') passed = false;

  const prefix = idPrefix ? idPrefix + '-' : '';

  // Find the table for the map id
  const tableBody = document.getElementById(prefix + 'tableBody-' + plugin.mapViewer.mapId);
  if (!tableBody) {
    return;
  }

  // Try to find an existing row by ID
  let row = document.getElementById(prefix + test.id);

  if (!row) {
    // If it doesn't exist, create a new row
    row = document.createElement('tr');
    row.id = prefix + test.id;
    row.classList.add('expanded');

    // Create and append the three cells
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));

    tableBody.appendChild(row);
  }

  // Update result cells
  const testCell = row.cells?.[0];
  let color = '#515ba5';
  if (test.getType() === 'true-negative') {
    color = '#b778e4ff';
  }

  // Title
  let testMessage =
    '<font class="test-title" style="color:' +
    color +
    ';" onclick="' +
    `this.closest('tr').classList.toggle('expanded'); this.closest('tr').classList.toggle('collapsed');">` +
    test.getTitle() +
    '</font><br/>';

  // Collapsible content
  testMessage += '<div class="collapsible-content" style="margin-top: 5px;">';
  testMessage += '<font style="font-size: x-small;">' + '<i>[' + testSuite.getName() + ' | ' + testTester.getName() + ']' + '</i></font>';
  testMessage += test.getStepsAsHtml();
  testCell.innerHTML = testMessage;

  const resultCell = row.cells?.[1];
  const detailsCell = row.cells?.[2];

  if (resultCell) {
    resultCell.style.textAlign = 'center';
    if (passed === true) {
      row.classList.add('collapsed');
      row.classList.remove('expanded');
      resultCell.style.color = 'green';
      resultCell.textContent = '✔';
    } else if (passed === false) {
      // Expand the row
      row.classList.add('expanded');
      row.classList.remove('collapsed');
      resultCell.style.color = 'red';
      resultCell.textContent = '✘';
      detailsCell.textContent = details;
      detailsCell.style.whiteSpace = 'pre-line';
    } else {
      resultCell.style.color = 'black';
      resultCell.textContent = '⏳';
    }
  }
  testMessage += '</div>';
}

function testSuiteEmptyTestResults(plugin) {
  // Empty the table
  const tableBody = document.getElementById('tableBody-' + plugin.mapViewer.mapId);
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

/**
 * Insert the standard page header with logo and titles
 * Call this function at the beginning of the body tag with an empty div: <div id="page-header"></div>
 */
function insertPageHeader() {
  const headerHTML = `
    <div class="page-header">
      <img class="header-logo" alt="logo" src="./img/Logo.png" />
      <div class="page-header-titles">
        <h1 class="index-header-title"><strong>Plateforme Géospatiale Canadienne (PGC) - Projet GeoView -</strong></h1>
        <h1 class="index-header-title"><strong>Canadian Geospatial Platform (CGP) - GeoView Project -</strong></h1>
      </div>
    </div>
    <div style="border-bottom: 3px solid #515ba5; margin: 20px 0;"></div>
  `;

  const headerElement = document.getElementById('page-header');
  if (headerElement) {
    headerElement.innerHTML = headerHTML;
  }
}

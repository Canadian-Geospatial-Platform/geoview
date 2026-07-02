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

  const maps = document.getElementsByClassName('geoview-map');
  const fetchPromises = [];

  // inject configuration snippet inside panel
  for (let j = 0; j < maps.length; j++) {
    const mapElement = maps[j];
    const mapID = mapElement.id;
    const el = document.getElementById(`${mapID}CS`);
    if (el === null) continue;

    const configSnippet = mapElement.attributes['data-config'];
    const configUrl = mapElement.attributes['data-config-url'];

    // check if JSON can be parsed, if not do nothing
    try {
      if (configSnippet !== undefined) {
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
      } else if (configUrl !== undefined) {
        // Fetch the config from the URL and display it
        fetchPromises.push(
          fetch(configUrl.value)
            .then(function (response) {
              return response.json();
            })
            .then(function (json) {
              el.textContent = JSON.stringify(json, undefined, 2);
            })
            .catch(function (error) {
              console.log(`Error fetching config from ${configUrl.value}`, error);
            })
        );
      }
    } catch (error) {
      console.log('Error trapped in createConfigSnippet');
    }
  }

  // Wait for all fetches to complete before creating collapsibles
  if (fetchPromises.length > 0) {
    Promise.all(fetchPromises).then(function () {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      createCollapsible();
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    createCollapsible();
  }
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

/**
 * Builds a map navigation bar and back-to-top links for release testing pages.
 * Call after createConfigModals() so config buttons can be placed in the heading bar.
 * Scans for all h5 elements whose text starts with "Map", builds an anchor-based
 * navigation list, and wraps each heading in a bar with: ↑ Back | { } Config | Title.
 */
function createMapNavigation() {
  // Find all map headings (h5 starting with "Map")
  const headings = Array.from(document.querySelectorAll('h5')).filter(function (h) {
    return /^Map\s/i.test(h.textContent.trim());
  });
  if (headings.length === 0) return;

  // Add an anchor id at the top of the page
  var topAnchor = document.getElementById('rt-top');
  if (!topAnchor) {
    topAnchor = document.createElement('a');
    topAnchor.id = 'rt-top';
    document.body.insertBefore(topAnchor, document.body.firstChild);
  }

  // Build the nav list (only if 2+ maps)
  if (headings.length >= 2) {
    var nav = document.createElement('div');
    nav.className = 'rt-map-nav';
    nav.innerHTML = '<strong>Jump to:</strong> ';
    var links = [];
    headings.forEach(function (h, idx) {
      if (!h.id) h.id = 'rt-map-' + (idx + 1);
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/\s*—.*/, '').trim();
      links.push(a.outerHTML);
    });
    nav.innerHTML += links.join(' · ');

    var demoSection = document.querySelector('.demo-section');
    if (demoSection && demoSection.nextSibling) {
      demoSection.parentNode.insertBefore(nav, demoSection.nextSibling);
    }
  }

  // Wrap each heading in a bar: [↑ Back] [{ } Config] [Title]
  headings.forEach(function (h, idx) {
    if (!h.id) h.id = 'rt-map-' + (idx + 1);

    // Find the map div associated with this heading (next .geoview-map sibling)
    var mapDiv = h.nextElementSibling;
    while (mapDiv && !mapDiv.classList.contains('geoview-map')) {
      mapDiv = mapDiv.nextElementSibling;
    }
    var mapId = mapDiv ? mapDiv.id : '';

    // Create the heading bar wrapper
    var bar = document.createElement('div');
    bar.className = 'rt-heading-bar';

    // Back to top link
    var backLink = document.createElement('a');
    backLink.href = '#rt-top';
    backLink.className = 'rt-back-link';
    backLink.textContent = '↑ Back';
    backLink.title = 'Back to top';
    bar.appendChild(backLink);

    // Find and move the config modal button for this map by data-map-id
    if (mapId) {
      var configBtn = document.querySelector('.rt-config-btn[data-map-id="' + mapId + '"]');
      if (configBtn) {
        bar.appendChild(configBtn);
      }
    }

    // Move the heading text into the bar
    var titleSpan = document.createElement('h5');
    titleSpan.id = h.id;
    titleSpan.innerHTML = h.innerHTML;
    titleSpan.style.margin = '0';
    bar.appendChild(titleSpan);

    // Replace the original h5 with the bar
    h.parentNode.insertBefore(bar, h);
    h.style.display = 'none';
  });

  // Inject minimal styles
  if (!document.getElementById('rt-nav-styles')) {
    var style = document.createElement('style');
    style.id = 'rt-nav-styles';
    style.textContent =
      '.rt-map-nav { margin: 12px 0 16px; padding: 10px 14px; background: #f5f5f5; border-radius: 6px; font-size: 13px; line-height: 2; }' +
      '.rt-map-nav a { color: #515ba5; text-decoration: none; white-space: nowrap; }' +
      '.rt-map-nav a:hover { text-decoration: underline; }' +
      '.rt-heading-bar { display: flex; align-items: center; gap: 10px; margin: 20px 0 6px; flex-wrap: wrap; }' +
      '.rt-back-link { font-size: 12px; color: #666; text-decoration: none; padding: 3px 8px; border: 1px solid #ddd; border-radius: 4px; white-space: nowrap; }' +
      '.rt-back-link:hover { color: #515ba5; border-color: #515ba5; }';
    document.head.appendChild(style);
  }
}

/**
 * Converts collapsible config snippet panels into modal dialog buttons.
 * Call AFTER createConfigSnippet() so the pre elements are already populated.
 * Each collapsible button + pre pair is replaced by a compact button that opens a modal.
 */
function createConfigModals() {
  // Inject modal styles and overlay if not already present
  if (!document.getElementById('rt-modal-styles')) {
    var style = document.createElement('style');
    style.id = 'rt-modal-styles';
    style.textContent =
      '.rt-modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:999999; justify-content:center; align-items:center; }' +
      '.rt-modal-overlay.active { display:flex; }' +
      '.rt-modal { background:#fff; border-radius:8px; width:80vw; max-height:80vh; display:flex; flex-direction:column; padding:0; box-shadow:0 8px 32px rgba(0,0,0,0.5); }' +
      '.rt-modal-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #e0e0e0; background:#fff; border-radius:8px 8px 0 0; flex-shrink:0; }' +
      '.rt-modal-header h5 { margin:0; color:#515ba5; }' +
      '.rt-modal-close { background:none; border:none; font-size:24px; cursor:pointer; color:#666; padding:4px 8px; }' +
      '.rt-modal-close:hover { color:#333; }' +
      '.rt-modal-body { flex:1; overflow:auto; }' +
      '.rt-modal-body pre { margin:0; white-space:pre-wrap; word-break:break-all; font-size:14px; line-height:1.5; max-height:none; background:#1e1e1e; color:#d4d4d4; padding:16px; border-radius:0 0 8px 8px; }' +
      '.rt-config-btn { display:inline-block; padding:4px 10px; background:#f5f5f5; border:1px solid #ccc; border-radius:4px; font-size:12px; cursor:pointer; color:#515ba5; margin:4px 4px 4px 0; }' +
      '.rt-config-btn:hover { background:#e8e8e8; border-color:#515ba5; }';
    document.head.appendChild(style);
  }

  // Create the modal overlay (shared singleton)
  var overlay = document.getElementById('rt-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rt-modal-overlay';
    overlay.className = 'rt-modal-overlay';
    overlay.innerHTML =
      '<div class="rt-modal">' +
      '<div class="rt-modal-header"><h5 id="rt-modal-title"></h5><button class="rt-modal-close" title="Close">&times;</button></div>' +
      '<div class="rt-modal-body"><pre id="rt-modal-content"></pre></div>' +
      '</div>';
    document.body.appendChild(overlay);

    // Close on X button
    overlay.querySelector('.rt-modal-close').addEventListener('click', function () {
      overlay.classList.remove('active');
    });
    // Close on overlay click (outside modal)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });
    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') overlay.classList.remove('active');
    });
  }

  // Replace each collapsible button + pre pair with a compact modal button
  var buttons = Array.from(document.querySelectorAll('button.collapsible'));
  buttons.forEach(function (btn) {
    var pre = btn.nextElementSibling;
    if (!pre || pre.tagName !== 'PRE') return;

    var title = btn.textContent.trim();

    // Extract the map ID from the pre element's id (e.g., "map7CS" → "map7")
    var mapId = pre.id ? pre.id.replace(/CS$/, '') : '';

    // Create a small button with a data-map-id for reliable matching
    var configBtn = document.createElement('button');
    configBtn.className = 'rt-config-btn';
    if (mapId) configBtn.setAttribute('data-map-id', mapId);
    configBtn.textContent = '{ } ' + title.replace(' — Configuration Snippet', '').replace('Configuration Snippet', 'Config');
    configBtn.title = 'View ' + title;
    // Read pre content lazily at click time (data-config-url maps load async)
    configBtn.addEventListener('click', function () {
      document.getElementById('rt-modal-title').textContent = title;
      document.getElementById('rt-modal-content').textContent = pre.textContent || '(loading...)';
      overlay.classList.add('active');
    });

    // Replace the collapsible button + pre with the compact button
    btn.parentNode.insertBefore(configBtn, btn);
    btn.style.display = 'none';
    pre.style.display = 'none';
  });
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
  const displayField = document.getElementById(elementId);

  // Listen on the layer status changes
  const allResults = {};
  displayField.innerHTML = '';
  mapViewer.layer.onLayerStatusChanged((sender, payload) => {
    const layerPath = payload.config.layerPath;
    const layerStatus = payload.status;
    allResults[layerPath] = layerStatus;

    const outputHeader = '<table class="state"><tr class="state"><th class="state">Name</th><th class="state">Status</th></tr>';
    const output = Object.keys(allResults).reduce((outputValue, layerPath) => {
      return `${outputValue}<tr class="state"><td class="state">${layerPath}</td><td class="state">${allResults[layerPath]}</td></tr>`;
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
    const mapViewer = await cgpv.api.createMapFromConfigFast(mapId, e.target.value, 800);
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

    // update description from configMeta if available
    const descriptionElem = document.getElementById('configDescription');
    if (descriptionElem) {
      descriptionElem.textContent =
        data.configMeta?.description || 'This map loads its configuration from the selected configuration file.';
    }

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
      Running: <span id="testsRunning-${mapId}">0</span> | Done success: <span id="testsDoneSuccess-${mapId}" style="color:green;">0</span> | Done failed: <span id="testsDoneFailed-${mapId}" style="color:green;">0</span> | Done: <span id="testsDone-${mapId}">0</span>/<span id="testsTotal-${mapId}">0</span>
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
  if (testsDoneFailed) {
    testsDoneFailed.textContent = plugin.getTestsDoneFailed();
    testsDoneFailed.style.color = 'green';
    if (plugin.getTestsDoneFailed() > 0) {
      testsDoneFailed.style.color = 'red';
    }
  }
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
    color = '#97a0e5';
  }

  // Title
  let testMessage =
    '<font class="test-title" style="color:' +
    color +
    ';" onclick="' +
    `event.stopPropagation(); this.closest('tr').classList.toggle('expanded'); this.closest('tr').classList.toggle('collapsed');">` +
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

//#region ------------------ CONFIG EDITOR UTILITIES -----------------------------------------
/**
 * Returns the regex pattern to match single quotes not preceded by backslash
 * Used to convert single quotes to double quotes for JSON parsing
 * @returns The regex pattern
 */
function getSingleQuoteRegex() {
  return /(?<!\\)'/g;
}

/**
 * Parse config text by replacing single quotes with double quotes
 * @param configText - The config text to parse
 * @returns The parsed JSON object
 * @throws {Error} If JSON is invalid
 */
function parseConfigJSON(configText) {
  const regexExp = getSingleQuoteRegex();
  return JSON.parse(configText.replace(regexExp, '"'));
}

/**
 * Initialize line numbers for a textarea editor
 * Updates line numbers when user types or initially loads
 * @param {string} textareaSelector - CSS selector for the textarea element
 * @param {string} lineNumbersSelector - CSS selector for the line numbers container
 */
function initializeLineNumbers(textareaSelector = '#mapConfig', lineNumbersSelector = '.line-numbers') {
  const textarea = document.querySelector(textareaSelector);
  const lineNumbers = document.querySelector(lineNumbersSelector);

  if (!textarea || !lineNumbers) {
    console.warn('Textarea or line numbers container not found');
    return;
  }

  // Set default number of lines
  const numberOfLines = textarea.value.split('\n').length;
  lineNumbers.innerHTML = Array(numberOfLines).fill('<span></span>').join('');

  // Update line numbers on keyup
  textarea.addEventListener('keyup', (event) => {
    const numberOfLines = event.target.value.split('\n').length;
    lineNumbers.innerHTML = Array(numberOfLines).fill('<span></span>').join('');
  });
}

/**
 * Setup validation functionality for config textarea
 * Validates JSON syntax and optionally validates against GeoView schema
 * @param {string} textareaSelector - CSS selector for the textarea element
 * @param {string} validationMessageSelector - CSS selector for validation message element
 * @param {string} reloadButtonSelector - CSS selector for reload button (optional)
 * @param {function} onValidationChange - Callback when validation message changes (optional)
 */
function setupConfigValidation(
  textareaSelector = '#mapConfig',
  validationMessageSelector = '#validationMessage',
  reloadButtonSelector = null,
  onValidationChange = null
) {
  const textarea = document.querySelector(textareaSelector);
  const validationMessage = document.querySelector(validationMessageSelector);
  const validateBtn = document.getElementById('validateConfig');
  const reloadBtn = reloadButtonSelector ? document.querySelector(reloadButtonSelector) : null;

  if (!textarea || !validationMessage) {
    console.warn('Textarea or validation message element not found');
    return;
  }

  // Validate config button handler
  if (validateBtn) {
    validateBtn.addEventListener('click', async function (e) {
      try {
        const configJSON = parseConfigJSON(textarea.value);

        // Check if validation API exists (newer versions only)
        if (window.cgpv && cgpv.api.config && cgpv.api.config.validateMapConfig) {
          const validConfig = cgpv.api.config.validateMapConfig(configJSON, 'en');
          validationMessage.classList.add('config-json-valid');
          validationMessage.classList.remove('config-error');
          validationMessage.textContent = 'File seems valid, see console for details...';
        } else {
          // Fallback for older versions or when cgpv not loaded - just check JSON is valid
          validationMessage.classList.add('config-json-valid');
          validationMessage.classList.remove('config-error');
          validationMessage.textContent = window.cgpv
            ? 'JSON syntax is valid (validation API not available in this version)...'
            : 'JSON syntax is valid (cgpv not loaded yet)...';
        }

        if (reloadBtn) reloadBtn.disabled = false;
        if (onValidationChange) onValidationChange(true, null);
      } catch (error) {
        validationMessage.classList.add('config-error');
        validationMessage.classList.remove('config-json-valid');
        validationMessage.textContent = error.message;

        if (reloadBtn) reloadBtn.disabled = false; // Still allow reload even if validation fails
        if (onValidationChange) onValidationChange(false, error.message);
      }
    });
  }

  // Reset validation message when config is modified
  textarea.addEventListener('input', (event) => {
    validationMessage.classList.remove('config-json-valid', 'config-error');
    validationMessage.textContent = 'File not validated...';
    if (onValidationChange) onValidationChange(null, null);
  });
}

/**
 * Initialize all config editor utilities in one call
 * Sets up line numbers, validation, and returns utility functions
 * @param options - Configuration options
 * @param options.textareaSelector - CSS selector for textarea
 * @param options.lineNumbersSelector - CSS selector for line numbers container
 * @param options.validationMessageSelector - CSS selector for validation message
 * @param options.reloadButtonSelector - CSS selector for reload button (optional)
 * @param options.onValidationChange - Callback for validation changes (optional)
 * @returns Object with utility functions (parseConfigJSON, getSingleQuoteRegex)
 */
function initializeConfigEditor(options = {}) {
  const {
    textareaSelector = '#mapConfig',
    lineNumbersSelector = '.line-numbers',
    validationMessageSelector = '#validationMessage',
    reloadButtonSelector = null,
    onValidationChange = null,
  } = options;

  // Initialize line numbers
  initializeLineNumbers(textareaSelector, lineNumbersSelector);

  // Setup validation
  setupConfigValidation(textareaSelector, validationMessageSelector, reloadButtonSelector, onValidationChange);

  // Return utility functions for parsing
  return {
    parseConfigJSON,
    getSingleQuoteRegex,
  };
}
//#endregion ------------------ CONFIG EDITOR UTILITIES END -----------------------------------------

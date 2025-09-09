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
      // eslint-disable-next-line no-param-reassign
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
      // eslint-disable-next-line no-console
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
    // eslint-disable-next-line func-names
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
    const [protocolPart, rest] = url.split("://");

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

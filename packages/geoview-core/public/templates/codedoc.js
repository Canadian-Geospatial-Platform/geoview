/* eslint-disable @typescript-eslint/no-unused-vars */
function createCodeSnippet() {
  const scripts = Array.prototype.filter.call(document.getElementsByTagName('script'), (obj) => {
    return obj.getAttribute('id') === null;
  });

  const script = scripts[scripts.length - 1];
  const el = document.getElementById('codeSnippet');
  if (el !== null) {
    el.innerHTML = `<pre>${script.textContent
      .replace('//create snippets\n', '')
      .replace('createConfigSnippet();\n', '')
      .replace('createCodeSnippet();\n', '')}</pre>`;
  }
}

function createConfigSnippet() {
  let j = 0;
  // inject configuration snippet inside panel
  for (j = 0; j < document.getElementsByClassName('llwp-map').length; j++) {
    let configSnippet = '';
    const mapID = document.getElementsByClassName('llwp-map')[j].id;
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
    // eslint-disable-next-line func-names
    coll[i].addEventListener('click', function () {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (content.style.display === 'block') {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    });
  }
}

/**
 * Get all interaction based events to log in the API EVENTS LOGS across all maps
 * @param {*} eventNames The CGPV API EVENT_NAMES
 */
function getAllInteractionEvents(api) {
  return [
    api.eventNames.INTERACTION.EVENT_SELECTED,
    api.eventNames.INTERACTION.EVENT_DRAW_STARTED,
    api.eventNames.INTERACTION.EVENT_DRAW_ENDED,
    api.eventNames.INTERACTION.EVENT_MODIFY_STARTED,
    api.eventNames.INTERACTION.EVENT_MODIFY_ENDED,
    api.eventNames.INTERACTION.EVENT_TRANSLATE_STARTED,
    api.eventNames.INTERACTION.EVENT_TRANSLATE_ENDED,
  ];
}

function addLog(logId, msg) {
  const logs = document.getElementById(logId);
  logs.innerText += `${msg}\n`;
  logs.scrollTop = logs.scrollHeight;
}

function wireLogs(api, mapId, logsDomId) {
  getAllInteractionEvents(api).forEach((eventName) => {
    // Listen to the event
    api.event.on(
      eventName,
      (payload) => {
        // Log the event
        addLog(logsDomId, payload.event);
        console.log(payload);
      },
      mapId
    );
  });
}

function addDefaultShapes(map, groupKey) {
  // Set active geometry group
  map.layer.vector.setActiveGeometryGroup(groupKey);

  // Add dummy shapes
  map.layer.vector.addCircleMarker([-227383, 988630], 40000, { style: { strokeColor: 'purple', strokeWidth: 2 } });

  // Add dummy shapes
  map.layer.vector.addMarkerIcon([-627383, 988630]);

  // Add dummy shapes
  map.layer.vector.addPolyline(
    [
      [-527383, 1683064],
      [-470383, 1516108],
      [-437383, 843494],
    ],
    { style: { strokeColor: 'blue', strokeWidth: 2 } }
  );

  // Add dummy shapes
  map.layer.vector.addPolygon(
    [
      [
        [-80002, 1683064],
        [93658, 1516108],
        [38123, 843494],
        [-80002, 1683064],
      ],
    ],
    { style: { strokeColor: 'green', strokeWidth: 2 } }
  );
}

function addSpecialShapes(map, groupKey) {
  // Set active geometry group
  map.layer.vector.setActiveGeometryGroup(groupKey);

  // Add dummy shapes
  map.layer.vector.addPolygon(
    [
      [
        [443658, 1516108],
        [843658, 1516108],
        [888123, 843494],
        [443658, 1516108],
      ],
    ],
    { style: { strokeColor: 'red', strokeWidth: 2 } }
  );
}

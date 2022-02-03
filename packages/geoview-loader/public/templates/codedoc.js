/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-plusplus */
function createCodeSnippet() {
    const scripts = document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];
    document.getElementById('codeSnippet').innerHTML = `<pre>${scripts.textContent
        .replace('//create snippets\n', '')
        .replace('createConfigSnippet();\n', '')
        .replace('createCodeSnippet();\n', '')}</pre>`;
}

function createConfigSnippet() {
    let j = 0;
    let i = 0;
    // inject configuration snippet inside panel
    for (j = 0; j < document.getElementsByClassName('llwp-map').length; j++) {
        let configSnippet = '';
        const mapID = document.getElementsByClassName('llwp-map')[j].id;
        for (i = 0; i < document.getElementById(mapID).attributes.length; i++) {
            configSnippet += `${document.getElementById(mapID).attributes[i].nodeName}: "${
                document.getElementById(mapID).attributes[i].nodeValue
            }" `;
        }
        document.getElementById(`${mapID}CS`).innerHTML = configSnippet;
    }
}

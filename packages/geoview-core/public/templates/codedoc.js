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
        el.textContent = JSON.stringify(JSON.parse(configSnippet.value.replace(/(\r\n|\n|\r)/gm, "").replace(/'/gm, '"')), undefined, 2);
      }
    } catch (error) { }
    
  }

  createCollapsible();
}

function createCollapsible() {
  var coll = document.getElementsByClassName("collapsible");
      var i;

      for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
          this.classList.toggle("active");
          var content = this.nextElementSibling;
          if (content.style.display === "block") {
            content.style.display = "none";
          } else {
            content.style.display = "block";
          }
        });
      }
}

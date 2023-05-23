const addBoundsPolygon=(e,t)=>{const l=cgpv.api.map(e).transformAndDensifyExtent(t,`EPSG:${cgpv.api.map(e).currentProjection}`,"EPSG:4326"),{vector:n}=cgpv.api.map(e).layer;n.setActiveGeometryGroup(),n.deleteGeometriesFromGroup(0);cgpv.api.map(e).layer.vector.addPolygon([l],{style:{strokeColor:"#000",strokeWidth:5,strokeOpacity:.8}})},createInfoTable=(e,t,l)=>{const n=document.getElementById(t);n.textContent="";const a=document.getElementById(`layer${e.slice(-1)}-info`);a&&a.remove();const i=document.createElement("div");i.id=`layer${e.slice(-1)}-info`,n.appendChild(i),Object.keys(l).forEach((t=>{const n=l[t],a=document.createElement("h1");if(a.innerText=n.length?t:`${t} (empty)`,i.appendChild(a),n.length){let t=document.createElement("h2");t.innerText="Aliases and types",i.appendChild(t);let l=document.createElement("table");l.classList.add("info"),i.appendChild(l);let a=document.createElement("tr");a.classList.add("info"),l.appendChild(a);let d=document.createElement("th");d.classList.add("infoCol1"),a.appendChild(d),Object.keys(n[0].fieldInfo).forEach((e=>{d=document.createElement("th"),d.classList.add("info"),d.innerText=e,a.appendChild(d)})),a=document.createElement("tr"),a.classList.add("info"),l.appendChild(a),d=document.createElement("td"),d.classList.add("infoCol1"),d.innerText="Aliases =>",a.appendChild(d),Object.keys(n[0].fieldInfo).forEach((e=>{d=document.createElement("td"),d.classList.add("info"),d.innerText=n[0].fieldInfo[e].alias,a.appendChild(d)})),a=document.createElement("tr"),a.classList.add("infoCol1"),l.appendChild(a),d=document.createElement("td"),d.classList.add("infoCol1"),d.innerText="Types =>",a.appendChild(d),Object.keys(n[0].fieldInfo).forEach((e=>{d=document.createElement("td"),d.classList.add("info"),d.innerText=n[0].fieldInfo[e].dataType,a.appendChild(d)})),t=document.createElement("h2"),t.innerText="Data",i.appendChild(t),l=document.createElement("table"),l.classList.add("info"),i.appendChild(l);let s=!0;n.forEach((t=>{s&&(a=document.createElement("tr"),a.classList.add("info"),l.appendChild(a),d=document.createElement("th"),d.classList.add("infoCol1"),d.innerText="Symbology",a.appendChild(d),d=document.createElement("th"),d.classList.add("infoCol1"),d.innerText="Zoom To",a.appendChild(d),Object.keys(t.fieldInfo).forEach((e=>{d=document.createElement("th"),d.classList.add("info"),d.innerText=e,a.appendChild(d)})),s=!1),a=document.createElement("tr"),a.classList.add("info"),l.appendChild(a),d=document.createElement("td"),d.classList.add("info"),d.appendChild(t.featureIcon),a.appendChild(d),d=document.createElement("td"),d.classList.add("info"),a.appendChild(d);const n=document.createElement("button");n.innerText="Zoom To Feature",n.addEventListener("click",(l=>{cgpv.api.map(e).zoomToExtent(t.extent),addBoundsPolygon(e,t.extent)})),d.appendChild(n),Object.keys(t.fieldInfo).forEach((e=>{if(d=document.createElement("td"),d.classList.add("info"),"date"===t.fieldInfo[e].dataType){const{dateUtilities:l}=cgpv.api;d.innerText=t.fieldInfo[e].value}else d.innerText=t.fieldInfo[e].value;a.appendChild(d)}))}))}else i.appendChild(document.createElement("hr"))}))},createTableOfFilter=e=>{let t=document.getElementById(`layer${e.slice(-1)}-buttons-pre`);const l=document.getElementById(`layer${e.slice(-1)}-buttons-table`);l&&l.remove();const n=document.createElement("table");n.id=`layer${e.slice(-1)}-buttons-table`,n.style.width="100%",n.border="1px solid black",t.appendChild(n),Object.keys(cgpv.api.maps[e].layer.geoviewLayers).forEach((l=>{const a=cgpv.api.maps[e].layer.geoviewLayers[l];Object.keys(cgpv.api.maps[e].layer.registeredLayers).forEach((i=>{if(i.startsWith(l)){const l=cgpv.api.maps[e].layer.registeredLayers[i],{geoviewRenderer:d}=cgpv.api.maps[e];d.getLegendStyles(l).then((i=>{t=document.createElement("td"),t.style.width="16.66%",t.border="1px solid black",n.appendChild(t);const d=document.createElement("h1");d.innerText=a.geoviewLayerName.en,t.appendChild(d);const s=document.createElement("h2");s.innerText=`${l.layerName.en}  `,s.style.height="15px",t.appendChild(s);const o=document.createElement("button");let c=a.getVisible(l);o.innerText=c?"Hide":"Show",o.addEventListener("click",(e=>{c=!a.getVisible(l),o.innerText=c?"Hide":"Show",a.setVisible(c,l)})),s.appendChild(o),l.style&&Object.keys(l.style).forEach((n=>{const d=document.createElement("p");if(d.innerText=`Geometry = ${n}`,d.style.height="15px",t.appendChild(d),"uniqueValue"===l.style[n].styleType){if(l.style[n].defaultSettings)if("always"===l.style[n].defaultVisible){const e=document.createElement("label");e.innerText="Always show ",e.style.fontSize="15px",e.style.height="15px",t.appendChild(e),t.appendChild(i[n].defaultCanvas);const l=document.createElement("br");l.style.height="1px",t.appendChild(l)}else{const d=document.createElement("button");"yes"===l.style[n].defaultVisible?d.innerText=`Hide ${l.style[n].defaultLabel}`:"no"===l.style[n].defaultVisible&&(d.innerText=`Show ${l.style[n].defaultLabel}`),d.addEventListener("click",(t=>{"yes"===l.style[n].defaultVisible?(l.style[n].defaultVisible="no",d.innerText=`Show ${l.style[n].defaultLabel}`):"no"===l.style[n].defaultVisible&&(l.style[n].defaultVisible="yes",d.innerText=`Hide ${l.style[n].defaultLabel}`);const i=document.getElementById(`checkbox-${e}-${a.geoviewLayerId}`),s=document.getElementById(`filter-input-${e}-${a.geoviewLayerId}`),o="true"===i.value?s.value:a.getLayerFilter(l);a.applyViewFilter(l,o,"true"!==i.value)})),t.appendChild(d),t.appendChild(i[n].defaultCanvas);const s=document.createElement("br");s.style.height="1px",t.appendChild(s)}for(let d=0;d<l.style[n].uniqueValueStyleInfo.length;d++)if("always"===l.style[n].uniqueValueStyleInfo[d].visible){const e=document.createElement("label");e.innerText="Always show ",e.style.fontSize="15px",t.appendChild(e),t.appendChild(i[n].arrayOfCanvas[d]);const l=document.createElement("br");l.style.height="1px",t.appendChild(l)}else{const s=document.createElement("button");"yes"===l.style[n].uniqueValueStyleInfo[d].visible?s.innerText=`Hide ${l.style[n].uniqueValueStyleInfo[d].label}`:"no"===l.style[n].uniqueValueStyleInfo[d].visible&&(s.innerText=`Show ${l.style[n].uniqueValueStyleInfo[d].label}`),s.addEventListener("click",(t=>{const i=l.style[n].uniqueValueStyleInfo[d];"yes"===i.visible?(i.visible="no",s.innerText=`Show ${i.label}`):"no"===i.visible&&(i.visible="yes",s.innerText=`Hide ${i.label}`);const o=document.getElementById(`checkbox-${e}-${a.geoviewLayerId}`),c=document.getElementById(`filter-input-${e}-${a.geoviewLayerId}`),r="true"===o.value?c.value:a.getLayerFilter(l);a.applyViewFilter(l,r,"true"!==o.value)})),t.appendChild(s),t.appendChild(i[n].arrayOfCanvas[d]);const o=document.createElement("br");o.style.height="1px",t.appendChild(o)}}else if("classBreaks"===l.style[n].styleType){if(l.style[n].defaultSettings)if("always"===l.style[n].defaultVisible){const e=document.createElement("label");e.innerText="Always show ",e.style.fontSize="15px",t.appendChild(e),t.appendChild(i[n].defaultCanvas);const l=document.createElement("br");l.style.height="1px",t.appendChild(l)}else{const i=document.createElement("button");"yes"===l.style[n].defaultVisible?i.innerText=`Hide ${l.style[n].defaultLabel}`:"no"===l.style[n].defaultVisible&&(i.innerText=`Show ${l.style[n].defaultLabel}`),i.addEventListener("click",(t=>{"yes"===l.style[n].defaultVisible?(l.style[n].defaultVisible="no",i.innerText=`Show ${l.style[n].defaultLabel}`):"no"===l.style[n].defaultVisible&&(l.style[n].defaultVisible="yes",i.innerText=`Hide ${l.style[n].defaultLabel}`);const d=document.getElementById(`checkbox-${e}-${a.geoviewLayerId}`),s=document.getElementById(`filter-input-${e}-${a.geoviewLayerId}`),o="true"===d.value?s.value:a.getLayerFilter(l);a.applyViewFilter(l,o,"true"!==d.value)})),t.appendChild(i);const d=document.createElement("br");d.style.height="1px",t.appendChild(d)}for(let d=0;d<l.style[n].classBreakStyleInfo.length;d++)if("always"===l.style[n].classBreakStyleInfo[d].visible){const e=document.createElement("label");e.innerText="Always show ",e.style.fontSize="15px",t.appendChild(e),t.appendChild(i[n].arrayOfCanvas[d]);const l=document.createElement("br");l.style.height="1px",t.appendChild(l)}else{const s=document.createElement("button");"yes"===l.style[n].classBreakStyleInfo[d].visible?s.innerText=`Hide ${l.style[n].classBreakStyleInfo[d].label}`:"no"===l.style[n].classBreakStyleInfo[d].visible&&(s.innerText=`Show ${l.style[n].classBreakStyleInfo[d].label}`),s.addEventListener("click",(t=>{const i=l.style[n].classBreakStyleInfo[d];"yes"===i.visible?(i.visible="no",s.innerText=`Show ${i.label}`):"no"===i.visible&&(i.visible="yes",s.innerText=`Hide ${i.label}`);const o=document.getElementById(`checkbox-${e}-${a.geoviewLayerId}`),c=document.getElementById(`filter-input-${e}-${a.geoviewLayerId}`),r="true"===o.value?c.value:a.getLayerFilter(l);a.applyViewFilter(l,r,"true"!==o.value)})),t.appendChild(s),t.appendChild(i[n].arrayOfCanvas[d]);const o=document.createElement("br");o.style.height="1px",t.appendChild(o)}}if(a.getLayerFilter){const n=document.createElement("p");n.innerText="Extra filter: ",t.appendChild(n);const i=document.createElement("input");i.id=`filter-input-${e}-${a.geoviewLayerId}`,i.style.width="50%",n.appendChild(i),i.value=a.getLayerFilter(l)||"";const d=document.createElement("button");d.addEventListener("click",(t=>{const n=document.getElementById(`checkbox-${e}-${a.geoviewLayerId}`);a.applyViewFilter(l,i.value,"true"!==n.value)})),d.innerText="Apply",n.appendChild(d);const s=document.createElement("input");s.type="checkbox",s.value="false",s.id=`checkbox-${e}-${a.geoviewLayerId}`,s.addEventListener("click",(e=>{s.value="true"===s.value?"false":"true",a.applyViewFilter(l,i.value,"true"!==s.value)})),t.appendChild(s);const o=document.createElement("label");o.innerText="apply only the extra filter",t.appendChild(o)}}))}))}}))}))};function displayLegend(e,t){const l=(e,t)=>{const l=document.createElement("th");l.style="text-align: center; vertical-align: middle;",l.innerHTML=e,t.appendChild(l)},n=(e,t)=>{const l=document.createElement("td");l.style.verticalAlign="middle",l.style.textAlign="center",e?"string"==typeof e?l.innerHTML=e.replaceAll("<","&lt;").replaceAll(">","&gt;"):l.appendChild(e):l.innerHTML="NO LEGEND",t.appendChild(l)},a=document.getElementById(`${e}-table`);a&&a.parentNode.removeChild(a);const i=document.getElementById(`${e}-table-pre`),d=document.createElement("table");d.id=`${e}-table`,d.border="1",d.style="width:50%",i.appendChild(d);let s=!0;Object.keys(t).forEach((e=>{if("ogcWms"===t[e]?.type||"imageStatic"===t[e]?.type){if(s){s=!1;const e=document.createElement("tr");d.appendChild(e),l("Layer Path",e),l("Symbology",e)}const a=document.createElement("tr");n(t[e].layerPath,a),n(t[e].legend,a),d.appendChild(a)}else{const a=(e,t,l)=>{const a=document.createElement("tr");n(e,a),n(t,a),n(l,a),d.appendChild(a)};if(s){s=!1;const e=document.createElement("tr");d.appendChild(e),l("Layer Path",e),l("Label",e),l("Symbology",e)}t[e]?.legend&&Object.keys(t[e].legend).forEach((l=>{if(l)if("uniqueValue"===t[e].styleConfig[l].styleType){t[e].legend[l].defaultCanvas&&a(e,t[e].styleConfig[l].defaultLabel,t[e].legend[l].defaultCanvas);for(let n=0;n<t[e].legend[l].arrayOfCanvas.length;n++)a(e,t[e].styleConfig[l].uniqueValueStyleInfo[n].label,t[e].legend[l].arrayOfCanvas[n])}else if("classBreaks"===t[e].styleConfig[l].styleType){t[e].legend[l].defaultCanvas&&a(e,t[e].styleConfig[l].defaultLabel,t[e].legend[l].defaultCanvas);for(let n=0;n<t[e].legend[l].arrayOfCanvas.length;n++)a(e,t[e].styleConfig[l].classBreakStyleInfo[n].label,t[e].legend[l].arrayOfCanvas[n])}else"simple"===t[e].styleConfig[l].styleType&&a(e,t[e].styleConfig[l].label,t[e].legend[l].defaultCanvas)}))}}))}
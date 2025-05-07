/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.128
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */
import{a as g,b as d}from"./chunk-BHOMZQKL.js";import{h as x}from"./chunk-O23FQWOY.js";import{b as p,c as M,d as O}from"./chunk-V3YO6LNK.js";import{b as m}from"./chunk-Y5QCE4LD.js";import{e as f}from"./chunk-V7XFDMXL.js";function n(t,e,n,h){this.x=t??0,this.y=e??0,this.width=n??0,this.height=h??0}n.packedLength=4,n.pack=function(t,e,n){return m.typeOf.object("value",t),m.defined("array",e),n=n??0,e[n++]=t.x,e[n++]=t.y,e[n++]=t.width,e[n]=t.height,e},n.unpack=function(t,e,h){return m.defined("array",t),e=e??0,f(h)||(h=new n),h.x=t[e++],h.y=t[e++],h.width=t[e++],h.height=t[e],h},n.fromPoints=function(t,e){if(f(e)||(e=new n),!f(t)||0===t.length)return e.x=0,e.y=0,e.width=0,e.height=0,e;let h=t.length,i=t[0].x,r=t[0].y,o=t[0].x,a=t[0].y;for(let e=1;e<h;e++){let n=t[e],h=n.x,f=n.y;i=Math.min(h,i),o=Math.max(h,o),r=Math.min(f,r),a=Math.max(f,a)}return e.x=i,e.y=r,e.width=o-i,e.height=a-r,e};var L=new g,X=new p,Y=new p;n.fromRectangle=function(t,e,h){if(f(h)||(h=new n),!f(t))return h.x=0,h.y=0,h.width=0,h.height=0,h;L._ellipsoid=O.default;let i=(e=e??L).project(x.southwest(t,X)),r=e.project(x.northeast(t,Y));return M.subtract(r,i,r),h.x=i.x,h.y=i.y,h.width=r.x,h.height=r.y,h},n.clone=function(t,e){if(f(t))return f(e)?(e.x=t.x,e.y=t.y,e.width=t.width,e.height=t.height,e):new n(t.x,t.y,t.width,t.height)},n.union=function(t,e,h){m.typeOf.object("left",t),m.typeOf.object("right",e),f(h)||(h=new n);let i=Math.min(t.x,e.x),r=Math.min(t.y,e.y),o=Math.max(t.x+t.width,e.x+e.width),a=Math.max(t.y+t.height,e.y+e.height);return h.x=i,h.y=r,h.width=o-i,h.height=a-r,h},n.expand=function(t,e,h){m.typeOf.object("rectangle",t),m.typeOf.object("point",e),h=n.clone(t,h);let i=e.x-h.x,r=e.y-h.y;return i>h.width?h.width=i:i<0&&(h.width-=i,h.x=e.x),r>h.height?h.height=r:r<0&&(h.height-=r,h.y=e.y),h},n.intersect=function(t,e){m.typeOf.object("left",t),m.typeOf.object("right",e);let n=t.x,h=t.y,i=e.x,r=e.y;return n>i+e.width||n+t.width<i||h+t.height<r||h>r+e.height?d.OUTSIDE:d.INTERSECTING},n.equals=function(t,e){return t===e||f(t)&&f(e)&&t.x===e.x&&t.y===e.y&&t.width===e.width&&t.height===e.height},n.prototype.clone=function(t){return n.clone(this,t)},n.prototype.intersect=function(t){return n.intersect(this,t)},n.prototype.equals=function(t){return n.equals(this,t)};var S=n;export{S as a};
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
import{a as C}from"./chunk-XAJAI4KM.js";import{b as g}from"./chunk-Y5QCE4LD.js";import{e as f}from"./chunk-V7XFDMXL.js";var d=C.EPSILON10;function x(e,r,s,n){if(g.defined("equalsEpsilon",r),!f(e))return;s=s??!1;let t=f(n),i=e.length;if(i<2)return e;let u,l,o,a=e[0],h=0,p=-1;for(u=1;u<i;++u)l=e[u],r(a,l,d)?(f(o)||(o=e.slice(0,u),h=u-1,p=0),t&&n.push(u)):(f(o)&&(o.push(l),h=u,t&&(p=n.length)),a=l);return s&&r(e[0],e[i-1],d)&&(t&&(f(o)?n.splice(p,0,h):n.push(i-1)),f(o)?o.length-=1:o=e.slice(0,-1)),f(o)?o:e}var k=x;export{k as a};
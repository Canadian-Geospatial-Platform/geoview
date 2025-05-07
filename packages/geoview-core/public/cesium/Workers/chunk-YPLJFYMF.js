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
import{f as O}from"./chunk-V3YO6LNK.js";import{a as f}from"./chunk-Y5QCE4LD.js";import{e as t}from"./chunk-V7XFDMXL.js";function n(n){n=n??O.EMPTY_OBJECT,this.position=n.position??!1,this.normal=n.normal??!1,this.st=n.st??!1,this.bitangent=n.bitangent??!1,this.tangent=n.tangent??!1,this.color=n.color??!1}n.POSITION_ONLY=Object.freeze(new n({position:!0})),n.POSITION_AND_NORMAL=Object.freeze(new n({position:!0,normal:!0})),n.POSITION_NORMAL_AND_ST=Object.freeze(new n({position:!0,normal:!0,st:!0})),n.POSITION_AND_ST=Object.freeze(new n({position:!0,st:!0})),n.POSITION_AND_COLOR=Object.freeze(new n({position:!0,color:!0})),n.ALL=Object.freeze(new n({position:!0,normal:!0,st:!0,tangent:!0,bitangent:!0})),n.DEFAULT=n.POSITION_NORMAL_AND_ST,n.packedLength=6,n.pack=function(n,e,o){if(!t(n))throw new f("value is required");if(!t(e))throw new f("array is required");return o=o??0,e[o++]=n.position?1:0,e[o++]=n.normal?1:0,e[o++]=n.st?1:0,e[o++]=n.tangent?1:0,e[o++]=n.bitangent?1:0,e[o]=n.color?1:0,e},n.unpack=function(e,o,i){if(!t(e))throw new f("array is required");return o=o??0,t(i)||(i=new n),i.position=1===e[o++],i.normal=1===e[o++],i.st=1===e[o++],i.tangent=1===e[o++],i.bitangent=1===e[o++],i.color=1===e[o],i},n.clone=function(e,o){if(t(e))return t(o)||(o=new n),o.position=e.position,o.normal=e.normal,o.st=e.st,o.tangent=e.tangent,o.bitangent=e.bitangent,o.color=e.color,o};var _=n;export{_ as a};
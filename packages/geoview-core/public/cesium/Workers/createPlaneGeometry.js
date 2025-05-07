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
import{a as m}from"./chunk-YPLJFYMF.js";import{a as b}from"./chunk-CZ3TUBLX.js";import{b as v,c as x,d as c}from"./chunk-L4Y3PGRA.js";import{d as l}from"./chunk-BHOMZQKL.js";import"./chunk-O23FQWOY.js";import{a as i}from"./chunk-KGIGJVHC.js";import{a as u,f as A}from"./chunk-V3YO6LNK.js";import"./chunk-XAJAI4KM.js";import"./chunk-QJ75BJDL.js";import"./chunk-SAZKQEJR.js";import{b as f}from"./chunk-Y5QCE4LD.js";import{e as s}from"./chunk-V7XFDMXL.js";function p(t){let e=(t=t??A.EMPTY_OBJECT).vertexFormat??m.DEFAULT;this._vertexFormat=e,this._workerName="createPlaneGeometry"}p.packedLength=m.packedLength,p.pack=function(t,e,n){return f.typeOf.object("value",t),f.defined("array",e),n=n??0,m.pack(t._vertexFormat,e,n),e};var d=new m,P={vertexFormat:d};p.unpack=function(t,e,n){f.defined("array",t),e=e??0;let r=m.unpack(t,e,d);return s(n)?(n._vertexFormat=m.clone(r,n._vertexFormat),n):new p(P)};var y=new u(-.5,-.5,0),F=new u(.5,.5,0);p.createGeometry=function(t){let e,n,r=t._vertexFormat,a=new b;if(r.position){if(n=new Float64Array(12),n[0]=y.x,n[1]=y.y,n[2]=0,n[3]=F.x,n[4]=y.y,n[5]=0,n[6]=F.x,n[7]=F.y,n[8]=0,n[9]=y.x,n[10]=F.y,n[11]=0,a.position=new c({componentDatatype:i.DOUBLE,componentsPerAttribute:3,values:n}),r.normal){let t=new Float32Array(12);t[0]=0,t[1]=0,t[2]=1,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=1,t[9]=0,t[10]=0,t[11]=1,a.normal=new c({componentDatatype:i.FLOAT,componentsPerAttribute:3,values:t})}if(r.st){let t=new Float32Array(8);t[0]=0,t[1]=0,t[2]=1,t[3]=0,t[4]=1,t[5]=1,t[6]=0,t[7]=1,a.st=new c({componentDatatype:i.FLOAT,componentsPerAttribute:2,values:t})}if(r.tangent){let t=new Float32Array(12);t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=0,t[5]=0,t[6]=1,t[7]=0,t[8]=0,t[9]=1,t[10]=0,t[11]=0,a.tangent=new c({componentDatatype:i.FLOAT,componentsPerAttribute:3,values:t})}if(r.bitangent){let t=new Float32Array(12);t[0]=0,t[1]=1,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=1,t[8]=0,t[9]=0,t[10]=1,t[11]=0,a.bitangent=new c({componentDatatype:i.FLOAT,componentsPerAttribute:3,values:t})}e=new Uint16Array(6),e[0]=0,e[1]=1,e[2]=2,e[3]=0,e[4]=2,e[5]=3}return new x({attributes:a,indices:e,primitiveType:v.TRIANGLES,boundingSphere:new l(u.ZERO,Math.sqrt(2))})};var w=p;function h(t,e){return s(e)&&(t=w.unpack(t,e)),w.createGeometry(t)}var N=h;export{N as default};
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
import{a as k,b as _,c as A}from"./chunk-WQJ35HX7.js";import"./chunk-YPLJFYMF.js";import"./chunk-ISZ7WW7L.js";import{a as F}from"./chunk-CZ3TUBLX.js";import{b,c as N,d as g}from"./chunk-L4Y3PGRA.js";import{d as y}from"./chunk-BHOMZQKL.js";import{f as s}from"./chunk-O23FQWOY.js";import{a as T}from"./chunk-KGIGJVHC.js";import{a}from"./chunk-V3YO6LNK.js";import"./chunk-XAJAI4KM.js";import"./chunk-QJ75BJDL.js";import"./chunk-SAZKQEJR.js";import{b as h}from"./chunk-Y5QCE4LD.js";import{e as w}from"./chunk-V7XFDMXL.js";var d=0,j=1;function P(e){h.typeOf.object("options",e),h.typeOf.object("options.frustum",e.frustum),h.typeOf.object("options.origin",e.origin),h.typeOf.object("options.orientation",e.orientation);let t,n,r=e.frustum,o=e.orientation,i=e.origin,u=e._drawNearPlane??!0;r instanceof _?(t=d,n=_.packedLength):r instanceof k&&(t=j,n=k.packedLength),this._frustumType=t,this._frustum=r.clone(),this._origin=a.clone(i),this._orientation=s.clone(o),this._drawNearPlane=u,this._workerName="createFrustumOutlineGeometry",this.packedLength=2+n+a.packedLength+s.packedLength}P.pack=function(e,t,n){h.typeOf.object("value",e),h.defined("array",t),n=n??0;let r=e._frustumType,o=e._frustum;return t[n++]=r,r===d?(_.pack(o,t,n),n+=_.packedLength):(k.pack(o,t,n),n+=k.packedLength),a.pack(e._origin,t,n),n+=a.packedLength,s.pack(e._orientation,t,n),t[n+=s.packedLength]=e._drawNearPlane?1:0,t};var C=new _,E=new k,G=new s,R=new a;P.unpack=function(e,t,n){h.defined("array",e),t=t??0;let r,o=e[t++];o===d?(r=_.unpack(e,t,C),t+=_.packedLength):(r=k.unpack(e,t,E),t+=k.packedLength);let i=a.unpack(e,t,R);t+=a.packedLength;let u=s.unpack(e,t,G),c=1===e[t+=s.packedLength];if(!w(n))return new P({frustum:r,origin:i,orientation:u,_drawNearPlane:c});let p=o===n._frustumType?n._frustum:void 0;return n._frustum=r.clone(p),n._frustumType=o,n._origin=a.clone(i,n._origin),n._orientation=s.clone(u,n._orientation),n._drawNearPlane=c,n},P.createGeometry=function(e){let t=e._frustumType,n=e._frustum,r=e._origin,a=e._orientation,o=e._drawNearPlane,i=new Float64Array(24);A._computeNearFarPlanes(r,a,t,n,i);let s,u,c=new F({position:new g({componentDatatype:T.DOUBLE,componentsPerAttribute:3,values:i})}),p=o?2:1,k=new Uint16Array(8*(p+1)),m=o?0:1;for(;m<2;++m)s=o?8*m:0,u=4*m,k[s]=u,k[s+1]=u+1,k[s+2]=u+1,k[s+3]=u+2,k[s+4]=u+2,k[s+5]=u+3,k[s+6]=u+3,k[s+7]=u;for(m=0;m<2;++m)s=8*(p+m),u=4*m,k[s]=u,k[s+1]=u+4,k[s+2]=u+1,k[s+3]=u+5,k[s+4]=u+2,k[s+5]=u+6,k[s+6]=u+3,k[s+7]=u+7;return new N({attributes:c,indices:k,primitiveType:b.LINES,boundingSphere:y.fromVertices(i)})};var L=P;function S(e,t){return w(t)&&(e=L.unpack(e,t)),L.createGeometry(e)}var $=S;export{$ as default};
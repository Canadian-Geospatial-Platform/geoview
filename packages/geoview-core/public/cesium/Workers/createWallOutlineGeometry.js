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
import{a as z}from"./chunk-WU7KXF7X.js";import"./chunk-GL6V53IR.js";import"./chunk-T4QMV5NY.js";import"./chunk-FLU3S7Y5.js";import"./chunk-FT22QKWD.js";import"./chunk-HGNPNJ5T.js";import"./chunk-ISZ7WW7L.js";import{a as W}from"./chunk-CF754CSJ.js";import{a as N}from"./chunk-CZ3TUBLX.js";import{b as R,c as S,d as M}from"./chunk-L4Y3PGRA.js";import{d as D}from"./chunk-BHOMZQKL.js";import"./chunk-O23FQWOY.js";import{a as q}from"./chunk-KGIGJVHC.js";import{a as p,d as l,f as O}from"./chunk-V3YO6LNK.js";import{a as b}from"./chunk-XAJAI4KM.js";import"./chunk-QJ75BJDL.js";import"./chunk-SAZKQEJR.js";import{a as H}from"./chunk-Y5QCE4LD.js";import{e as m}from"./chunk-V7XFDMXL.js";var B=new p,U=new p;function _(i){let t=(i=i??O.EMPTY_OBJECT).positions,e=i.maximumHeights,n=i.minimumHeights;if(!m(t))throw new H("options.positions is required.");if(m(e)&&e.length!==t.length)throw new H("options.positions and options.maximumHeights must have the same length.");if(m(n)&&n.length!==t.length)throw new H("options.positions and options.minimumHeights must have the same length.");let o=i.granularity??b.RADIANS_PER_DEGREE,r=i.ellipsoid??l.default;this._positions=t,this._minimumHeights=n,this._maximumHeights=e,this._granularity=o,this._ellipsoid=l.clone(r),this._workerName="createWallOutlineGeometry";let s=1+t.length*p.packedLength+2;m(n)&&(s+=n.length),m(e)&&(s+=e.length),this.packedLength=s+l.packedLength+1}_.pack=function(i,t,e){if(!m(i))throw new H("value is required");if(!m(t))throw new H("array is required");e=e??0;let n,o=i._positions,r=o.length;for(t[e++]=r,n=0;n<r;++n,e+=p.packedLength)p.pack(o[n],t,e);let s=i._minimumHeights;if(r=m(s)?s.length:0,t[e++]=r,m(s))for(n=0;n<r;++n)t[e++]=s[n];let a=i._maximumHeights;if(r=m(a)?a.length:0,t[e++]=r,m(a))for(n=0;n<r;++n)t[e++]=a[n];return l.pack(i._ellipsoid,t,e),t[e+=l.packedLength]=i._granularity,t};var G=l.clone(l.UNIT_SPHERE),L={positions:void 0,minimumHeights:void 0,maximumHeights:void 0,ellipsoid:G,granularity:void 0};_.unpack=function(i,t,e){if(!m(i))throw new H("array is required");t=t??0;let n,o,r,s=i[t++],a=new Array(s);for(n=0;n<s;++n,t+=p.packedLength)a[n]=p.unpack(i,t);if(s=i[t++],s>0)for(o=new Array(s),n=0;n<s;++n)o[n]=i[t++];if(s=i[t++],s>0)for(r=new Array(s),n=0;n<s;++n)r[n]=i[t++];let h=l.unpack(i,t,G),u=i[t+=l.packedLength];return m(e)?(e._positions=a,e._minimumHeights=o,e._maximumHeights=r,e._ellipsoid=l.clone(h,e._ellipsoid),e._granularity=u,e):(L.positions=a,L.minimumHeights=o,L.maximumHeights=r,L.granularity=u,new _(L))},_.fromConstantHeights=function(i){let t=(i=i??O.EMPTY_OBJECT).positions;if(!m(t))throw new H("options.positions is required.");let e,n,o=i.minimumHeight,r=i.maximumHeight,s=m(o),a=m(r);if(s||a){let i=t.length;e=s?new Array(i):void 0,n=a?new Array(i):void 0;for(let t=0;t<i;++t)s&&(e[t]=o),a&&(n[t]=r)}return new _({positions:t,maximumHeights:n,minimumHeights:e,ellipsoid:i.ellipsoid})},_.createGeometry=function(i){let t=i._positions,e=i._minimumHeights,n=i._maximumHeights,o=i._granularity,r=i._ellipsoid,s=z.computePositions(r,t,n,e,o,!1);if(!m(s))return;let a,l=s.bottomPositions,h=s.topPositions,u=h.length,c=2*u,g=new Float64Array(c),f=0;for(u/=3,a=0;a<u;++a){let i=3*a,t=p.fromArray(h,i,B),e=p.fromArray(l,i,U);g[f++]=e.x,g[f++]=e.y,g[f++]=e.z,g[f++]=t.x,g[f++]=t.y,g[f++]=t.z}let d=new N({position:new M({componentDatatype:q.DOUBLE,componentsPerAttribute:3,values:g})}),_=c/3;c=2*_-4+_;let k=W.createTypedArray(_,c),H=0;for(a=0;a<_-2;a+=2){let i=a,t=a+2,e=p.fromArray(g,3*i,B),n=p.fromArray(g,3*t,U);if(p.equalsEpsilon(e,n,b.EPSILON10))continue;let o=a+1,r=a+3;k[H++]=o,k[H++]=i,k[H++]=o,k[H++]=r,k[H++]=i,k[H++]=t}return k[H++]=_-2,k[H++]=_-1,new S({attributes:d,indices:k,primitiveType:R.LINES,boundingSphere:new D.fromVertices(g)})};var C=_;function J(i,t){return m(t)&&(i=C.unpack(i,t)),i._ellipsoid=l.clone(i._ellipsoid),C.createGeometry(i)}var pi=J;export{pi as default};
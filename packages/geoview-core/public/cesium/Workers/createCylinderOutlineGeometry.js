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
import{a as M}from"./chunk-MBQWQZPG.js";import{a as L}from"./chunk-FFURXUS3.js";import{a as N}from"./chunk-CF754CSJ.js";import{a as k}from"./chunk-CZ3TUBLX.js";import{b as D,c as P,d as A}from"./chunk-L4Y3PGRA.js";import{d as y}from"./chunk-BHOMZQKL.js";import"./chunk-O23FQWOY.js";import{a as R}from"./chunk-KGIGJVHC.js";import{a as T,c as _,f as S}from"./chunk-V3YO6LNK.js";import"./chunk-XAJAI4KM.js";import"./chunk-QJ75BJDL.js";import"./chunk-SAZKQEJR.js";import{a as E,b as m}from"./chunk-Y5QCE4LD.js";import{e as b}from"./chunk-V7XFDMXL.js";var V=new _;function d(t){let e=(t=t??S.EMPTY_OBJECT).length,i=t.topRadius,o=t.bottomRadius,s=t.slices??128,r=Math.max(t.numberOfVerticalLines??16,0);if(m.typeOf.number("options.positions",e),m.typeOf.number("options.topRadius",i),m.typeOf.number("options.bottomRadius",o),m.typeOf.number.greaterThanOrEquals("options.slices",s,3),b(t.offsetAttribute)&&t.offsetAttribute===L.TOP)throw new E("GeometryOffsetAttribute.TOP is not a supported options.offsetAttribute for this geometry.");this._length=e,this._topRadius=i,this._bottomRadius=o,this._slices=s,this._numberOfVerticalLines=r,this._offsetAttribute=t.offsetAttribute,this._workerName="createCylinderOutlineGeometry"}d.packedLength=6,d.pack=function(t,e,i){return m.typeOf.object("value",t),m.defined("array",e),i=i??0,e[i++]=t._length,e[i++]=t._topRadius,e[i++]=t._bottomRadius,e[i++]=t._slices,e[i++]=t._numberOfVerticalLines,e[i]=t._offsetAttribute??-1,e};var p={length:void 0,topRadius:void 0,bottomRadius:void 0,slices:void 0,numberOfVerticalLines:void 0,offsetAttribute:void 0};d.unpack=function(t,e,i){m.defined("array",t),e=e??0;let o=t[e++],s=t[e++],r=t[e++],n=t[e++],a=t[e++],u=t[e];return b(i)?(i._length=o,i._topRadius=s,i._bottomRadius=r,i._slices=n,i._numberOfVerticalLines=a,i._offsetAttribute=-1===u?void 0:u,i):(p.length=o,p.topRadius=s,p.bottomRadius=r,p.slices=n,p.numberOfVerticalLines=a,p.offsetAttribute=-1===u?void 0:u,new d(p))},d.createGeometry=function(t){let e=t._length,i=t._topRadius,o=t._bottomRadius,s=t._slices,r=t._numberOfVerticalLines;if(e<=0||i<0||o<0||0===i&&0===o)return;let n,a=2*s,u=M.computePositions(e,i,o,s,!1),f=2*s;if(r>0){let t=Math.min(r,s);n=Math.round(s/t),f+=t}let m,p=N.createTypedArray(a,2*f),c=0;for(m=0;m<s-1;m++)p[c++]=m,p[c++]=m+1,p[c++]=m+s,p[c++]=m+1+s;if(p[c++]=s-1,p[c++]=0,p[c++]=s+s-1,p[c++]=s,r>0)for(m=0;m<s;m+=n)p[c++]=m,p[c++]=m+s;let d=new k;d.position=new A({componentDatatype:R.DOUBLE,componentsPerAttribute:3,values:u}),V.x=.5*e,V.y=Math.max(o,i);let l=new y(T.ZERO,_.magnitude(V));if(b(t._offsetAttribute)){e=u.length;let i=t._offsetAttribute===L.NONE?0:1,o=new Uint8Array(e/3).fill(i);d.applyOffset=new A({componentDatatype:R.UNSIGNED_BYTE,componentsPerAttribute:1,values:o})}return new P({attributes:d,indices:p,primitiveType:D.LINES,boundingSphere:l,offsetAttribute:t._offsetAttribute})};var w=d;function G(t,e){return b(e)&&(t=w.unpack(t,e)),w.createGeometry(t)}var et=G;export{et as default};
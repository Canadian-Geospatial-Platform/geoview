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
import{a as l}from"./chunk-IMV2XHR5.js";import"./chunk-CNMIODAT.js";import"./chunk-2TTZKDIP.js";import"./chunk-HJB4AZ37.js";import"./chunk-NSW7N5NB.js";import"./chunk-56SXHQAK.js";import"./chunk-FFURXUS3.js";import{a as m}from"./chunk-YPLJFYMF.js";import"./chunk-HGNPNJ5T.js";import"./chunk-ISZ7WW7L.js";import"./chunk-CF754CSJ.js";import"./chunk-CZ3TUBLX.js";import"./chunk-L4Y3PGRA.js";import"./chunk-BHOMZQKL.js";import"./chunk-O23FQWOY.js";import"./chunk-KGIGJVHC.js";import{a,d as s,f as _}from"./chunk-V3YO6LNK.js";import"./chunk-XAJAI4KM.js";import"./chunk-QJ75BJDL.js";import"./chunk-SAZKQEJR.js";import{b as p}from"./chunk-Y5QCE4LD.js";import{e as d}from"./chunk-V7XFDMXL.js";function n(e){let t=(e=e??_.EMPTY_OBJECT).radius;p.typeOf.number("radius",t);let i={center:e.center,semiMajorAxis:t,semiMinorAxis:t,ellipsoid:e.ellipsoid,height:e.height,extrudedHeight:e.extrudedHeight,granularity:e.granularity,vertexFormat:e.vertexFormat,stRotation:e.stRotation,shadowVolume:e.shadowVolume};this._ellipseGeometry=new l(i),this._workerName="createCircleGeometry"}n.packedLength=l.packedLength,n.pack=function(e,t,i){return p.typeOf.object("value",e),l.pack(e._ellipseGeometry,t,i)};var h=new l({center:new a,semiMajorAxis:1,semiMinorAxis:1}),t={center:new a,radius:void 0,ellipsoid:s.clone(s.default),height:void 0,extrudedHeight:void 0,granularity:void 0,vertexFormat:new m,stRotation:void 0,semiMajorAxis:void 0,semiMinorAxis:void 0,shadowVolume:void 0};n.unpack=function(e,i,o){let r=l.unpack(e,i,h);return t.center=a.clone(r._center,t.center),t.ellipsoid=s.clone(r._ellipsoid,t.ellipsoid),t.ellipsoid=s.clone(r._ellipsoid,h._ellipsoid),t.height=r._height,t.extrudedHeight=r._extrudedHeight,t.granularity=r._granularity,t.vertexFormat=m.clone(r._vertexFormat,t.vertexFormat),t.stRotation=r._stRotation,t.shadowVolume=r._shadowVolume,d(o)?(t.semiMajorAxis=r._semiMajorAxis,t.semiMinorAxis=r._semiMinorAxis,o._ellipseGeometry=new l(t),o):(t.radius=r._semiMajorAxis,new n(t))},n.createGeometry=function(e){return l.createGeometry(e._ellipseGeometry)},n.createShadowVolume=function(e,t,i){let o=e._ellipseGeometry._granularity,r=e._ellipseGeometry._ellipsoid,s=t(o,r),l=i(o,r);return new n({center:e._ellipseGeometry._center,radius:e._ellipseGeometry._semiMajorAxis,ellipsoid:r,stRotation:e._ellipseGeometry._stRotation,granularity:o,extrudedHeight:s,height:l,vertexFormat:m.POSITION_ONLY,shadowVolume:!0})},Object.defineProperties(n.prototype,{rectangle:{get:function(){return this._ellipseGeometry.rectangle}},textureCoordinateRotationPoints:{get:function(){return this._ellipseGeometry.textureCoordinateRotationPoints}}});var c=n;function g(e,t){return d(t)&&(e=c.unpack(e,t)),e._ellipseGeometry._center=a.clone(e._ellipseGeometry._center),e._ellipseGeometry._ellipsoid=s.clone(e._ellipseGeometry._ellipsoid),c.createGeometry(e)}var V=g;export{V as default};
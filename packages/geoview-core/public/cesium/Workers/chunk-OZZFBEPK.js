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
import{a as z}from"./chunk-BHOMZQKL.js";import{h as I,i as b}from"./chunk-O23FQWOY.js";import{a as W,b as O,d as L}from"./chunk-V3YO6LNK.js";import{a as m}from"./chunk-XAJAI4KM.js";import{a as v}from"./chunk-Y5QCE4LD.js";import{e as k}from"./chunk-V7XFDMXL.js";var Z=Math.cos,B=Math.sin,p=Math.sqrt,N={computePosition:function(t,n,a,r,o,s,e){let i=n.radiiSquared,l=t.nwCorner,h=t.boundingRectangle,u=l.latitude-t.granYCos*r+o*t.granXSin,g=Z(u),c=B(u),m=i.z*c,C=l.longitude+r*t.granYSin+o*t.granXCos,d=g*Z(C),S=g*B(C),w=i.x*d,O=i.y*S,X=p(w*d+O*S+m*c);if(s.x=w/X,s.y=O/X,s.z=m/X,a){let n=t.stNwCorner;k(n)?(u=n.latitude-t.stGranYCos*r+o*t.stGranXSin,C=n.longitude+r*t.stGranYSin+o*t.stGranXCos,e.x=(C-t.stWest)*t.lonScalar,e.y=(u-t.stSouth)*t.latScalar):(e.x=(C-h.west)*t.lonScalar,e.y=(u-h.south)*t.latScalar)}}},A=new b,l=new W,F=new O,j=new W,y=new z;function D(t,n,a,r,o,s,e){let i=Math.cos(n),h=r*i,u=a*i,g=Math.sin(n),c=r*g,m=a*g;y._ellipsoid=L.default,l=y.project(t,l),l=W.subtract(l,j,l);let C=b.fromRotation(n,A);l=b.multiplyByVector(C,l,l),l=W.add(l,j,l),s-=1,e-=1;let d=(t=y.unproject(l,t)).latitude,S=d+s*m,p=d-h*e,w=d-h*e+s*m,O=Math.max(d,S,p,w),X=Math.min(d,S,p,w),Y=t.longitude,f=Y+s*u,_=Y+e*c,I=Y+e*c+s*u;return{north:O,south:X,east:Math.max(Y,f,_,I),west:Math.min(Y,f,_,I),granYCos:h,granYSin:c,granXCos:u,granXSin:m,nwCorner:t}}N.computeOptions=function(t,n,a,r,o,s,e){let i=t.east,l=t.west,h=t.north,u=t.south,g=!1,c=!1;h===m.PI_OVER_TWO&&(g=!0),u===-m.PI_OVER_TWO&&(c=!0);let C,d=h-u;C=l>i?m.TWO_PI-l+i:i-l;let S=Math.ceil(C/n)+1,p=Math.ceil(d/n)+1,w=C/(S-1),O=d/(p-1),X=I.northwest(t,s),Y=I.center(t,F);(0!==a||0!==r)&&(Y.longitude<X.longitude&&(Y.longitude+=m.TWO_PI),y._ellipsoid=L.default,j=y.project(Y,j));let f=O,W=w,_=I.clone(t,o),M={granYCos:f,granYSin:0,granXCos:W,granXSin:0,nwCorner:X,boundingRectangle:_,width:S,height:p,northCap:g,southCap:c};if(0!==a){let t=D(X,a,w,O,Y,S,p);if(h=t.north,u=t.south,i=t.east,l=t.west,h<-m.PI_OVER_TWO||h>m.PI_OVER_TWO||u<-m.PI_OVER_TWO||u>m.PI_OVER_TWO)throw new v("Rotated rectangle is invalid.  It crosses over either the north or south pole.");M.granYCos=t.granYCos,M.granYSin=t.granYSin,M.granXCos=t.granXCos,M.granXSin=t.granXSin,_.north=h,_.south=u,_.east=i,_.west=l}if(0!==r){a-=r;let t=I.northwest(_,e),n=D(t,a,w,O,Y,S,p);M.stGranYCos=n.granYCos,M.stGranXCos=n.granXCos,M.stGranYSin=n.granYSin,M.stGranXSin=n.granXSin,M.stNwCorner=t,M.stWest=n.west,M.stSouth=n.south}return M};var st=N;export{st as a};
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
import{f as C}from"./chunk-O23FQWOY.js";import{a as n,e as b}from"./chunk-V3YO6LNK.js";import{a as w}from"./chunk-XAJAI4KM.js";var j={},q=new n,L=new n,Q=new C,G=new b;function W(e,t,r,a,o,i,l,s,y,c){let m=e+t;n.multiplyByScalar(a,Math.cos(m),q),n.multiplyByScalar(r,Math.sin(m),L),n.add(q,L,q);let u=Math.cos(e);u*=u;let w=Math.sin(e);w*=w;let x=i/Math.sqrt(l*u+o*w)/s;return C.fromAxisAngle(q,x,Q),b.fromQuaternion(Q,G),b.multiplyByVector(G,y,c),n.normalize(c,c),n.multiplyByScalar(c,s,c),c}var U=new n,Z=new n,N=new n,v=new n;j.raisePositionsToHeight=function(e,t,r){let a=t.ellipsoid,o=t.height,i=t.extrudedHeight,l=r?e.length/3*2:e.length/3,s=new Float64Array(3*l),y=e.length,c=r?y:0;for(let t=0;t<y;t+=3){let l=t+1,y=t+2,m=n.fromArray(e,t,U);a.scaleToGeodeticSurface(m,m);let u=n.clone(m,Z),w=a.geodeticSurfaceNormal(m,v),x=n.multiplyByScalar(w,o,N);n.add(m,x,m),r&&(n.multiplyByScalar(w,i,x),n.add(u,x,u),s[t+c]=u.x,s[l+c]=u.y,s[y+c]=u.z),s[t]=m.x,s[l]=m.y,s[y]=m.z}return s};var D=new n,J=new n,K=new n;j.computeEllipsePositions=function(e,t,r){let a=e.semiMinorAxis,o=e.semiMajorAxis,i=e.rotation,l=e.center,s=8*e.granularity,y=a*a,c=o*o,m=o*a,u=n.magnitude(l),x=n.normalize(l,D),h=n.cross(n.UNIT_Z,l,J);h=n.normalize(h,h);let f=n.cross(x,h,K),z=1+Math.ceil(w.PI_OVER_TWO/s),O=w.PI_OVER_TWO/(z-1),_=w.PI_OVER_TWO-z*O;_<0&&(z-=Math.ceil(Math.abs(_)/O));let p,d,P,M,I,T=t?new Array(3*(z*(z+2)*2)):void 0,g=0,A=U,V=Z,E=4*z*3,j=E-1,v=0,R=r?new Array(E):void 0;for(_=w.PI_OVER_TWO,A=W(_,i,f,h,y,m,c,u,x,A),t&&(T[g++]=A.x,T[g++]=A.y,T[g++]=A.z),r&&(R[j--]=A.z,R[j--]=A.y,R[j--]=A.x),_=w.PI_OVER_TWO-O,p=1;p<z+1;++p){if(A=W(_,i,f,h,y,m,c,u,x,A),V=W(Math.PI-_,i,f,h,y,m,c,u,x,V),t){for(T[g++]=A.x,T[g++]=A.y,T[g++]=A.z,P=2*p+2,d=1;d<P-1;++d)M=d/(P-1),I=n.lerp(A,V,M,N),T[g++]=I.x,T[g++]=I.y,T[g++]=I.z;T[g++]=V.x,T[g++]=V.y,T[g++]=V.z}r&&(R[j--]=A.z,R[j--]=A.y,R[j--]=A.x,R[v++]=V.x,R[v++]=V.y,R[v++]=V.z),_=w.PI_OVER_TWO-(p+1)*O}for(p=z;p>1;--p){if(_=w.PI_OVER_TWO-(p-1)*O,A=W(-_,i,f,h,y,m,c,u,x,A),V=W(_+Math.PI,i,f,h,y,m,c,u,x,V),t){for(T[g++]=A.x,T[g++]=A.y,T[g++]=A.z,P=2*(p-1)+2,d=1;d<P-1;++d)M=d/(P-1),I=n.lerp(A,V,M,N),T[g++]=I.x,T[g++]=I.y,T[g++]=I.z;T[g++]=V.x,T[g++]=V.y,T[g++]=V.z}r&&(R[j--]=A.z,R[j--]=A.y,R[j--]=A.x,R[v++]=V.x,R[v++]=V.y,R[v++]=V.z)}_=w.PI_OVER_TWO,A=W(-_,i,f,h,y,m,c,u,x,A);let S={};return t&&(T[g++]=A.x,T[g++]=A.y,T[g++]=A.z,S.positions=T,S.numPts=z),r&&(R[j--]=A.z,R[j--]=A.y,R[j--]=A.x,S.outerPositions=R),S};var tt=j;export{tt as a};
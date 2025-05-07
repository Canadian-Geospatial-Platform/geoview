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
import{a as K}from"./chunk-REC7BNVA.js";import{a as G}from"./chunk-NSW7N5NB.js";import{a as S}from"./chunk-CF754CSJ.js";import{c as B,h as R}from"./chunk-O23FQWOY.js";import"./chunk-KGIGJVHC.js";import{a as t,b as _,d as L}from"./chunk-V3YO6LNK.js";import{a as F}from"./chunk-XAJAI4KM.js";import"./chunk-QJ75BJDL.js";import"./chunk-SAZKQEJR.js";import"./chunk-Y5QCE4LD.js";import"./chunk-V7XFDMXL.js";var O=32767,ct=new _,rt=new t;function it(e,r,a,n,u){let o=e.length/3,s=e.subarray(0,o),f=e.subarray(o,2*o),i=e.subarray(2*o,3*o);G.zigZagDeltaDecode(s,f,i);let c=new Float64Array(e.length);for(let e=0;e<o;++e){let o=s[e],p=f[e],l=i[e],d=F.lerp(r.west,r.east,o/O),h=F.lerp(r.south,r.north,p/O),k=F.lerp(a,n,l/O),b=_.fromRadians(d,h,k,ct),m=u.cartographicToCartesian(b,rt);t.pack(m,c,3*e)}return c}var Y=it,X=new R,$=new L,j=new t,H={min:void 0,max:void 0};function at(e){e=new Float64Array(e);let r=0;H.min=e[r++],H.max=e[r++],R.unpack(e,r,X),r+=R.packedLength,L.unpack(e,r,$),r+=L.packedLength,t.unpack(e,r,j)}function ft(t){let e=t.length,r=new Uint32Array(e+1),a=0;for(let n=0;n<e;++n)r[n]=a,a+=t[n];return r[e]=a,r}var Z=new t,q=new t,J=new t,dt=new t,Q=new t;function ut(e,r){let a=new Uint16Array(e.positions),n=new Uint16Array(e.widths),u=new Uint32Array(e.counts),o=new Uint16Array(e.batchIds);at(e.packedBuffer);let s,f=X,i=$,c=j,p=H.min,l=H.max,d=Y(a,f,p,l,i),h=d.length/3,k=4*h-4,b=new Float32Array(3*k),m=new Float32Array(3*k),w=new Float32Array(3*k),y=new Float32Array(2*k),A=new Uint16Array(k),F=0,L=0,N=0,g=0,E=u.length;for(s=0;s<E;++s){let e=u[s],r=n[s],a=o[s];for(let n=0;n<e;++n){let u;if(0===n){let e=t.unpack(d,3*g,Z),r=t.unpack(d,3*(g+1),q);u=t.subtract(e,r,J),t.add(e,u,u)}else u=t.unpack(d,3*(g+n-1),J);let o,s=t.unpack(d,3*(g+n),dt);if(n===e-1){let r=t.unpack(d,3*(g+e-1),Z),a=t.unpack(d,3*(g+e-2),q);o=t.subtract(r,a,Q),t.add(r,o,o)}else o=t.unpack(d,3*(g+n+1),Q);t.subtract(u,c,u),t.subtract(s,c,s),t.subtract(o,c,o);let f=n===e-1?2:4;for(let e=0===n?2:0;e<f;++e){t.pack(s,b,F),t.pack(u,m,F),t.pack(o,w,F),F+=3;let n=e-2<0?-1:1;y[L++]=e%2*2-1,y[L++]=n*r,A[N++]=a}}g+=e}let D=S.createTypedArray(k,6*h-6),I=0,O=0;for(E=h-1,s=0;s<E;++s)D[O++]=I,D[O++]=I+2,D[O++]=I+1,D[O++]=I+1,D[O++]=I+2,D[O++]=I+3,I+=4;r.push(b.buffer,m.buffer,w.buffer),r.push(y.buffer,A.buffer,D.buffer);let R={indexDatatype:2===D.BYTES_PER_ELEMENT?S.UNSIGNED_SHORT:S.UNSIGNED_INT,currentPositions:b.buffer,previousPositions:m.buffer,nextPositions:w.buffer,expandAndWidth:y.buffer,batchIds:A.buffer,indices:D.buffer};if(e.keepDecodedPositions){let t=ft(u);r.push(d.buffer,t.buffer),R=B(R,{decodedPositions:d.buffer,decodedPositionOffsets:t.buffer})}return R}var It=K(ut);export{It as default};
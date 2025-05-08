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

import {
  EllipseGeometry_default
} from "./chunk-TL5YKZJF.js";
import "./chunk-CQNYYX3N.js";
import "./chunk-COOLDICB.js";
import "./chunk-ERKJ7IWJ.js";
import "./chunk-XF6EBVKV.js";
import "./chunk-KV6TEHXY.js";
import "./chunk-OWLBD6BL.js";
import "./chunk-NREPBWCX.js";
import "./chunk-TEUGW455.js";
import "./chunk-NB6D74SQ.js";
import "./chunk-XMKE4XB2.js";
import "./chunk-ICU72UPR.js";
import "./chunk-OMZGZVHI.js";
import "./chunk-GQVSADCI.js";
import "./chunk-VXAAIRJ7.js";
import "./chunk-YFXXUW6U.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-V4Y7C25O.js";
import "./chunk-FW2OX42E.js";
import "./chunk-34EWMUFG.js";
import "./chunk-EO44CO62.js";
import "./chunk-VNDECE6N.js";
import {
  defined_default
} from "./chunk-S2NKKWYE.js";

// packages/engine/Source/Workers/createEllipseGeometry.js
function createEllipseGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseGeometry_default = createEllipseGeometry;
export {
  createEllipseGeometry_default as default
};

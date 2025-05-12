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
  BoxGeometry_default
} from "./chunk-ORIMMEHO.js";
import "./chunk-OWLBD6BL.js";
import "./chunk-NREPBWCX.js";
import "./chunk-ICU72UPR.js";
import "./chunk-OMZGZVHI.js";
import "./chunk-GQVSADCI.js";
import "./chunk-VXAAIRJ7.js";
import "./chunk-YFXXUW6U.js";
import "./chunk-V4Y7C25O.js";
import "./chunk-FW2OX42E.js";
import "./chunk-34EWMUFG.js";
import "./chunk-EO44CO62.js";
import "./chunk-VNDECE6N.js";
import {
  defined_default
} from "./chunk-S2NKKWYE.js";

// packages/engine/Source/Workers/createBoxGeometry.js
function createBoxGeometry(boxGeometry, offset) {
  if (defined_default(offset)) {
    boxGeometry = BoxGeometry_default.unpack(boxGeometry, offset);
  }
  return BoxGeometry_default.createGeometry(boxGeometry);
}
var createBoxGeometry_default = createBoxGeometry;
export {
  createBoxGeometry_default as default
};

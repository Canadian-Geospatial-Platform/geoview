import React, { useEffect } from "react";

import { test } from "geoview-core";

const App = () => {
  useEffect(() => {
    test();
  }, []);
  return <h3>Welcome to React Boilerplate</h3>;
};
export default App;

// Plotly wrapper using plotly.js-dist-min (smaller bundle)
// react-plotly.js by default imports full plotly.js which is not installed.
// This uses the factory pattern with the minified distribution instead.

import createPlotlyComponent from 'react-plotly.js/factory'
// @ts-ignore — plotly.js-dist-min has no type declarations
import Plotly from 'plotly.js-dist-min'

const Plot = createPlotlyComponent(Plotly)

export default Plot

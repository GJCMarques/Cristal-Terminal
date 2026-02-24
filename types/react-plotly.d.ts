declare module 'react-plotly.js' {
    import * as Plotly from 'plotly.js'
    import * as React from 'react'

    export interface PlotParams {
        data: Plotly.Data[]
        layout?: Partial<Plotly.Layout>
        config?: Partial<Plotly.Config>
        frames?: Plotly.Frame[]
        onInitialized?: (figure: Readonly<Plotly.Figure>, graphDiv: Readonly<HTMLElement>) => void
        onUpdate?: (figure: Readonly<Plotly.Figure>, graphDiv: Readonly<HTMLElement>) => void
        onPurge?: (figure: Readonly<Plotly.Figure>, graphDiv: Readonly<HTMLElement>) => void
        onError?: (err: Error) => void
        onHover?: (event: Readonly<Plotly.PlotMouseEvent>) => void
        onUnhover?: (event: Readonly<Plotly.PlotMouseEvent>) => void
        onClick?: (event: Readonly<Plotly.PlotMouseEvent>) => void
        revision?: number
        className?: string
        style?: React.CSSProperties
        useResizeHandler?: boolean
        debug?: boolean
    }

    export default class Plot extends React.Component<PlotParams> { }
}

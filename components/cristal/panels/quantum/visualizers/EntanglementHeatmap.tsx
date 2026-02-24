'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

export function EntanglementHeatmap({ densityMatrix, labels, color = '#00e5ff' }: { densityMatrix: number[][], labels?: string[], color?: string }) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient || !densityMatrix) return <div className="h-[250px] w-full bg-[#050505] animate-pulse rounded border border-neutral-800" />

    return (
        <div className="w-full h-[250px] relative bg-[#050505] rounded-md overflow-hidden border border-neutral-800">
            <Plot
                data={[
                    {
                        z: densityMatrix,
                        x: labels,
                        y: labels,
                        type: 'heatmap',
                        colorscale: [
                            [0, '#000000'],
                            [0.2, '#1a1a1a'],
                            [0.5, color + '55'],
                            [1, color]
                        ],
                        showscale: false,
                        hoverinfo: 'none'
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { l: 20, r: 20, b: 20, t: 20 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: {
                        showgrid: false, zeroline: false, showticklabels: true,
                        tickfont: { family: 'monospace', size: 10, color: '#888' }
                    },
                    yaxis: {
                        showgrid: false, zeroline: false, showticklabels: true, autorange: 'reversed',
                        tickfont: { family: 'monospace', size: 10, color: '#888' }
                    }
                }}
                config={{ displayModeBar: false, scrollZoom: false }}
                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            <div className="absolute top-2 right-2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest bg-[#00000080] px-2 py-1 rounded">
                Entanglement Matrix ρ
            </div>
        </div>
    )
}

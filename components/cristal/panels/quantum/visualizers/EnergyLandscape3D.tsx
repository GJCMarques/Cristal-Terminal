'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface EnergyLandscapeProps {
    landscape: number[][]
    color?: string
}

export function EnergyLandscape3D({ landscape, color = '#ff0055' }: EnergyLandscapeProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient || !landscape || landscape.length === 0) {
        return <div className="h-[250px] w-full bg-[#050505] animate-pulse rounded border border-neutral-800" />
    }

    return (
        <div className="w-full h-[250px] relative bg-[#050505] rounded-md overflow-hidden border border-neutral-800">
            <Plot
                data={[
                    {
                        z: landscape,
                        type: 'surface',
                        colorscale: [
                            [0, color],
                            [0.3, color + '77'],
                            [0.6, '#301010'],
                            [1, '#000000']
                        ],
                        showscale: false,
                        hoverinfo: 'none',
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { l: 0, r: 0, b: 0, t: 0 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    scene: {
                        xaxis: { visible: false },
                        yaxis: { visible: false },
                        zaxis: { visible: false },
                        camera: {
                            eye: { x: -1.2, y: -1.5, z: 0.8 },
                            up: { x: 0, y: 0, z: 1 },
                            center: { x: 0, y: 0, z: -0.2 }
                        }
                    }
                }}
                config={{ displayModeBar: false, scrollZoom: false }}
                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest bg-[#00000080] px-2 py-1 rounded">
                Cost Function Landscape (QAOA/VQE)
            </div>
        </div>
    )
}

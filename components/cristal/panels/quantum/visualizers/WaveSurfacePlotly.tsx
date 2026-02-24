'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Next.js static rendering fails with Plotly, needs dynamic import avoiding SSR
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface WaveSurfaceProps {
    distribution: { estado: string; prob: number; marcado?: boolean }[]
    color?: string
}

export function WaveSurfacePlotly({ distribution, color = '#00e5ff' }: WaveSurfaceProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) return <div className="h-[250px] w-full bg-[#050505] animate-pulse rounded border border-neutral-800" />

    const n = distribution.length || 64
    const mapSize = 40 // High resolution for smooth 3D peaks

    const zData: number[][] = Array(mapSize).fill(0).map(() => Array(mapSize).fill(0))

    // Generate artistic interference pattern based on distribution peaks
    for (let i = 0; i < mapSize; i++) {
        for (let j = 0; j < mapSize; j++) {
            // Base ripple
            let val = Math.sin(i * 0.4) * Math.cos(j * 0.4) * 5 + 20

            // Apply quantum superpositions (peaks) mapping from distribution probs
            distribution.forEach((state, idx) => {
                // Map linear 1D index to random spots or grid spots
                const cx = (idx * 13) % mapSize
                const cy = (idx * 27) % mapSize

                const sigma = 3 // Width of peak
                const dx = i - cx
                const dy = j - cy
                const dist2 = dx * dx + dy * dy
                val += (state.prob * 150) * Math.exp(-dist2 / (2 * sigma * sigma))
            })

            // Adding secondary harmonic
            val += Math.sin((i + j) * 0.2) * 8
            zData[i][j] = val < 0 ? 0 : val
        }
    }

    // A classic Jet / Rainbow colorscale to emulate standard MATLAB / Mathematica physics plots
    const heatmapColorScale = [
        [0.0, "rgb(0,0,131)"],    // Deep blue
        [0.125, "rgb(0,60,170)"], // Blue
        [0.375, "rgb(5,255,255)"],// Cyan
        [0.625, "rgb(255,255,0)"],// Yellow
        [0.875, "rgb(250,0,0)"],  // Red
        [1.0, "rgb(128,0,0)"]     // Dark red
    ]

    return (
        <div className="w-full h-[250px] relative bg-[#050505] rounded-md overflow-hidden border border-neutral-800">
            <Plot
                data={[
                    {
                        z: zData,
                        type: 'surface',
                        colorscale: heatmapColorScale,
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
                        xaxis: { visible: true, showgrid: true, gridcolor: '#222', zeroline: false },
                        yaxis: { visible: true, showgrid: true, gridcolor: '#222', zeroline: false },
                        zaxis: { visible: true, showgrid: true, gridcolor: '#222', zeroline: false, range: [0, Math.max(70, Math.max(...zData.flat()))] },
                        camera: {
                            eye: { x: 1.5, y: -1.5, z: 1.2 },
                            up: { x: 0, y: 0, z: 1 },
                            center: { x: 0, y: 0, z: -0.2 }
                        }
                    }
                }}
                config={{ displayModeBar: false, scrollZoom: false }}
                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest bg-[#00000080] px-2 py-1 rounded">
                Quantum Probability Amplitudes
            </div>
        </div>
    )
}

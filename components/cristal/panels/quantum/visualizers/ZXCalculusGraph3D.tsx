'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'

function ZXGraph({ colorTheme }: { colorTheme: string }) {
    const group = useRef<THREE.Group>(null)

    // Generate random static ZX nodes and connections
    const { nodes, links } = useMemo(() => {
        const N = 30 // Nodes
        const _nodes = []
        for (let i = 0; i < N; i++) {
            // Random coords in sphere
            const u = Math.random()
            const v = Math.random()
            const theta = 2 * Math.PI * u
            const phi = Math.acos(2 * v - 1)
            const r = Math.cbrt(Math.random()) * 2.5

            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)

            // Type: Spider Z (Green/Color) or Spider X (Red)
            const isZ = Math.random() > 0.4

            _nodes.push({ id: i, pos: [x, y, z] as [number, number, number], isZ })
        }

        const _links = []
        for (let i = 0; i < 15; i++) {
            const source = Math.floor(Math.random() * N)
            const target = Math.floor(Math.random() * N)
            if (source !== target) {
                _links.push([_nodes[source].pos, _nodes[target].pos] as [[number, number, number], [number, number, number]])
            }
        }

        return { nodes: _nodes, links: _links }
    }, [])

    useFrame((state) => {
        if (group.current) {
            group.current.rotation.x = state.clock.elapsedTime * 0.1
            group.current.rotation.y = state.clock.elapsedTime * 0.15
        }
    })

    return (
        <group ref={group}>
            {/* Edges */}
            {links.map((pts, i) => (
                <Line key={`link-${i}`} points={pts} color="#333333" lineWidth={1.5} />
            ))}

            {/* Nodes */}
            {nodes.map((n, i) => (
                <Sphere key={`node-${i}`} position={n.pos} args={[n.isZ ? 0.12 : 0.08, 16, 16]}>
                    <meshStandardMaterial
                        color={n.isZ ? colorTheme : '#ff0033'}
                        emissive={n.isZ ? colorTheme : '#ff0033'}
                        emissiveIntensity={0.8}
                    />
                </Sphere>
            ))}
        </group>
    )
}

export function ZXCalculusGraph3D({ color = '#00e5ff' }: { color?: string }) {
    return (
        <div className="w-full h-[250px] relative bg-[#050505] rounded-md overflow-hidden border border-neutral-800">
            <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <ZXGraph colorTheme={color} />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} minDistance={4.5} maxDistance={4.5} />
            </Canvas>
            <div className="absolute bottom-2 left-2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest bg-[#00000080] px-2 py-1 rounded">
                ZX-Calculus Topology
            </div>
        </div>
    )
}

'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei'
import * as THREE from 'three'

interface BlochSphereProps {
    alpha?: { re: number; im: number }
    beta?: { re: number; im: number }
    color?: string
}

function Pointers({ alpha, beta, color }: BlochSphereProps) {
    const ref = useRef<THREE.Group>(null)

    // Calcule theta and phi from alpha (cos(theta/2)) and beta (e^{i phi} sin(theta/2))
    const prob0 = alpha!.re ** 2 + alpha!.im ** 2
    const prob1 = beta!.re ** 2 + beta!.im ** 2

    // Normalize
    const total = prob0 + prob1 || 1
    const p0Norm = Math.min(1, Math.max(0, prob0 / total))
    const theta = 2 * Math.acos(Math.sqrt(p0Norm))

    // Calculate relative phase
    const complexA = alpha!
    const complexB = beta!

    // phase = arg(beta) - arg(alpha)
    const argB = Math.atan2(complexB.im, complexB.re)
    const argA = Math.atan2(complexA.im, complexA.re)
    const phi = argB - argA

    // Vector coordinates (radius = 1.8 to match visual shell)
    const r = 1.8
    const x = r * Math.sin(theta) * Math.cos(phi)
    const y = r * Math.cos(theta)    // Z-axis in Bloch is typically Y-axis in 3D engines
    const z = r * Math.sin(theta) * Math.sin(phi)

    useFrame((state) => {
        if (ref.current) {
            // Slow rotation to give a dynamic feel
            ref.current.rotation.y = state.clock.elapsedTime * 0.1
        }
    })

    return (
        <group ref={ref}>
            {/* Outer Shell */}
            <Sphere args={[2, 32, 32]}>
                <meshBasicMaterial color={color || '#00e5ff'} wireframe opacity={0.15} transparent />
            </Sphere>

            {/* Axis Lines */}
            <Line points={[[0, -2.5, 0], [0, 2.5, 0]]} color="#333" lineWidth={1} />
            <Line points={[[-2.5, 0, 0], [2.5, 0, 0]]} color="#333" lineWidth={1} />
            <Line points={[[0, 0, -2.5], [0, 0, 2.5]]} color="#333" lineWidth={1} />

            {/* Axis Labels */}
            <Text position={[0, 2.8, 0]} fontSize={0.2} color="#888">|0⟩</Text>
            <Text position={[0, -2.8, 0]} fontSize={0.2} color="#888">|1⟩</Text>
            <Text position={[2.8, 0, 0]} fontSize={0.2} color="#888">+X</Text>
            <Text position={[0, 0, 2.8]} fontSize={0.2} color="#888">+Y</Text>

            {/* State Vector Line */}
            <Line points={[[0, 0, 0], [x, y, z]]} color={color || '#00e5ff'} lineWidth={3} />
            <Sphere position={[x, y, z]} args={[0.08, 16, 16]}>
                <meshBasicMaterial color={color || '#00e5ff'} />
            </Sphere>

            {/* Equatorial Disc for pure states visual */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.98, 2, 64]} />
                <meshBasicMaterial color={color || '#00e5ff'} opacity={0.3} transparent side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

export function BlochSphere3D({ alpha = { re: 1, im: 0 }, beta = { re: 0, im: 0 }, color = '#00e5ff' }: BlochSphereProps) {
    return (
        <div className="w-full h-[250px] relative bg-[#050505] rounded-md overflow-hidden border border-neutral-800">
            <Canvas camera={{ position: [3.5, 2.5, 4], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <Pointers alpha={alpha} beta={beta} color={color} />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} minDistance={6} maxDistance={6} />
            </Canvas>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest bg-[#00000080] px-2 py-1 rounded">
                Bloch Sphere Simulator
            </div>
        </div>
    )
}

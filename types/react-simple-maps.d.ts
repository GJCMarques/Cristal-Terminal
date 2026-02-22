// Type declarations for react-simple-maps v3
declare module 'react-simple-maps' {
  import type { ReactNode, MouseEvent, CSSProperties } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    style?: CSSProperties
    children?: ReactNode
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    onMoveEnd?: (args: { zoom: number; coordinates: [number, number] }) => void
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>
    children: (args: { geographies: Geography[] }) => ReactNode
  }

  export interface Geography {
    rsmKey: string
    type: string
    id: string
    properties: Record<string, string | number | undefined>
    geometry: Record<string, unknown>
  }

  export interface GeographyProps {
    geography: Geography
    style?: {
      default?: CSSProperties & { fill?: string; stroke?: string; strokeWidth?: number; outline?: string; cursor?: string }
      hover?:   CSSProperties & { fill?: string; stroke?: string; strokeWidth?: number; outline?: string; cursor?: string }
      pressed?: CSSProperties & { fill?: string; outline?: string }
    }
    onClick?: (geo: Geography, e: MouseEvent<SVGPathElement>) => void
    onMouseEnter?: (e: MouseEvent<SVGPathElement>, geo: Geography) => void
    onMouseLeave?: (e: MouseEvent<SVGPathElement>, geo: Geography) => void
    onMouseMove?: (e: MouseEvent<SVGPathElement>, geo: Geography) => void
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
}

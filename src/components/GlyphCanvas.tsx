'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Point {
  x: number
  y: number
}

interface GlyphCanvasProps {
  onSave: (svg: string) => void
  phoneme?: string
}

// Procedural stylization functions
function stylizePaths(paths: Point[][], style: string): string {
  if (paths.length === 0) return ''

  const svgPaths: string[] = []
  
  for (const path of paths) {
    if (path.length < 2) continue
    
    let d = ''
    
    switch (style) {
      case 'runic':
        // Angular, straight lines between points
        d = runicStyle(path)
        break
      case 'flowing':
        // Smooth curves through points
        d = flowingStyle(path)
        break
      case 'geometric':
        // Simplified to basic geometric shapes
        d = geometricStyle(path)
        break
      case 'organic':
        // Natural curves with varying thickness
        d = organicStyle(path)
        break
      case 'blocky':
        // Thick strokes, simplified angles
        d = blockyStyle(path)
        break
      case 'minimal':
        // Reduced to essential strokes
        d = minimalStyle(path)
        break
      default:
        d = basicStyle(path)
    }
    
    if (d) svgPaths.push(d)
  }

  const strokeWidth = style === 'blocky' ? 6 : style === 'minimal' ? 2 : 3
  
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  ${svgPaths.map(d => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n  ')}
</svg>`
}

function basicStyle(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`
  }
  return d
}

function runicStyle(points: Point[]): string {
  if (points.length < 2) return ''
  
  // Reduce to key points and snap to angles
  const simplified = simplifyPath(points, 8)
  const snapped = simplified.map((p, i) => {
    if (i === 0) return p
    const prev = simplified[i - 1]
    const dx = p.x - prev.x
    const dy = p.y - prev.y
    const angle = Math.atan2(dy, dx)
    const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return {
      x: prev.x + Math.cos(snappedAngle) * dist,
      y: prev.y + Math.sin(snappedAngle) * dist
    }
  })
  
  return basicStyle(snapped)
}

function flowingStyle(points: Point[]): string {
  if (points.length < 2) return ''
  
  const simplified = simplifyPath(points, 5)
  if (simplified.length < 2) return basicStyle(points)
  
  // Create smooth curves through points
  let d = `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)}`
  
  for (let i = 1; i < simplified.length - 1; i++) {
    const p0 = simplified[i - 1]
    const p1 = simplified[i]
    const p2 = simplified[i + 1]
    
    const cx = (p0.x + p1.x + p2.x) / 3
    const cy = (p0.y + p1.y + p2.y) / 3
    
    d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`
  }
  
  const last = simplified[simplified.length - 1]
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
  
  return d
}

function geometricStyle(points: Point[]): string {
  if (points.length < 2) return ''
  
  // Find bounding box
  const minX = Math.min(...points.map(p => p.x))
  const maxX = Math.max(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y))
  const maxY = Math.max(...points.map(p => p.y))
  
  const width = maxX - minX
  const height = maxY - minY
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  
  // Determine if it's more circular or linear
  const aspectRatio = width / (height || 1)
  
  if (aspectRatio > 0.8 && aspectRatio < 1.2 && points.length > 10) {
    // Make it a circle
    const r = Math.max(width, height) / 2
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
  }
  
  // Otherwise, reduce to 3-6 key points
  const simplified = simplifyPath(points, 15)
  return basicStyle(simplified)
}

function organicStyle(points: Point[]): string {
  if (points.length < 2) return ''
  
  const simplified = simplifyPath(points, 4)
  if (simplified.length < 3) return flowingStyle(points)
  
  // Add slight curves and variation
  let d = `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)}`
  
  for (let i = 1; i < simplified.length; i++) {
    const prev = simplified[i - 1]
    const curr = simplified[i]
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2
    // Add slight curve
    const perpX = -(curr.y - prev.y) * 0.15
    const perpY = (curr.x - prev.x) * 0.15
    d += ` Q ${(midX + perpX).toFixed(1)} ${(midY + perpY).toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
  }
  
  return d
}

function blockyStyle(points: Point[]): string {
  if (points.length < 2) return ''
  
  // Reduce to very few points, snap to grid
  const simplified = simplifyPath(points, 20)
  const gridSize = 10
  const snapped = simplified.map(p => ({
    x: Math.round(p.x / gridSize) * gridSize,
    y: Math.round(p.y / gridSize) * gridSize
  }))
  
  return basicStyle(snapped)
}

function minimalStyle(points: Point[]): string {
  if (points.length < 2) return ''
  
  // Reduce to absolute minimum strokes
  const simplified = simplifyPath(points, 25)
  
  // If very few points, just draw a line
  if (simplified.length <= 3) {
    return basicStyle([simplified[0], simplified[simplified.length - 1]])
  }
  
  return basicStyle(simplified)
}

// Ramer-Douglas-Peucker algorithm for path simplification
function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points
  
  let maxDist = 0
  let maxIndex = 0
  
  const start = points[0]
  const end = points[points.length - 1]
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }
  
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon)
    const right = simplifyPath(points.slice(maxIndex), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  
  return [start, end]
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const mag = Math.sqrt(dx * dx + dy * dy)
  
  if (mag === 0) return Math.sqrt(
    Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
  )
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag)
  const closestX = lineStart.x + u * dx
  const closestY = lineStart.y + u * dy
  
  return Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2))
}

export function GlyphCanvas({ onSave, phoneme = '' }: GlyphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [paths, setPaths] = useState<Point[][]>([])
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [style, setStyle] = useState('flowing')
  const [isProcessing, setIsProcessing] = useState(false)
  const [useAI, setUseAI] = useState(true)

  const styles = [
    { id: 'runic', name: 'Runic', desc: 'Angular, carved stone' },
    { id: 'flowing', name: 'Flowing', desc: 'Elegant curves' },
    { id: 'geometric', name: 'Geometric', desc: 'Clean shapes' },
    { id: 'organic', name: 'Organic', desc: 'Natural lines' },
    { id: 'blocky', name: 'Blocky', desc: 'Bold strokes' },
    { id: 'minimal', name: 'Minimal', desc: 'Essential only' },
  ]

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setPaths([])
    setCurrentPath([])
  }, [])

  // Initialize canvas
  useEffect(() => {
    clearCanvas()
  }, [clearCanvas])

  // Redraw paths
  const redrawPaths = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const allPaths = [...paths, currentPath]
    for (const path of allPaths) {
      if (path.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(path[0].x * 2, path[0].y * 2) // Scale for canvas size
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * 2, path[i].y * 2)
      }
      ctx.stroke()
    }
  }, [paths, currentPath])

  useEffect(() => {
    redrawPaths()
  }, [redrawPaths])

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    // Scale to 100x100 coordinate system
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    const point = getCanvasPoint(e)
    setCurrentPath([point])
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const point = getCanvasPoint(e)
    setCurrentPath(prev => [...prev, point])
  }

  const handleEnd = () => {
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, currentPath])
    }
    setCurrentPath([])
    setIsDrawing(false)
  }

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1))
  }

  const handleStylize = async () => {
    if (paths.length === 0) return
    
    setIsProcessing(true)
    
    try {
      if (useAI) {
        // Get canvas as data URL
        const canvas = canvasRef.current
        if (!canvas) return
        const dataUrl = canvas.toDataURL('image/png')
        
        const response = await fetch('/api/glyph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sketchDataUrl: dataUrl,
            style,
            phoneme,
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'AI generation failed')
        }
        
        const { svg } = await response.json()
        onSave(svg)
      } else {
        // Use procedural stylization
        const svg = stylizePaths(paths, style)
        onSave(svg)
      }
      
      clearCanvas()
    } catch (error: any) {
      console.error('Stylization error:', error)
      alert(`Error: ${error.message}. Falling back to procedural.`)
      // Fallback to procedural
      const svg = stylizePaths(paths, style)
      onSave(svg)
      clearCanvas()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Label className="mr-2">Style:</Label>
        {styles.map(s => (
          <Button
            key={s.id}
            variant={style === s.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStyle(s.id)}
            title={s.desc}
          >
            {s.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Use AI cleanup (recommended)</span>
        </label>
      </div>

      <div className="border-2 border-dashed rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="w-full aspect-square cursor-crosshair touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleUndo} disabled={paths.length === 0}>
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={clearCanvas}>
          Clear
        </Button>
        <Button 
          onClick={handleStylize} 
          disabled={paths.length === 0 || isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Processing...' : useAI ? '✨ Generate with AI' : 'Stylize'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Draw your glyph, then click Generate. {useAI ? 'AI will clean up and stylize your sketch.' : 'Your sketch will be procedurally stylized.'}
      </p>
    </div>
  )
}


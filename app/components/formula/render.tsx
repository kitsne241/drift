import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/html-struct'
import { reLink, getRect, genCode, selectScope } from '~/lib/scope'
import { sampleScope } from '~/lib/sample-data'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  const mathRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [scope, setScope] = useState(sampleScope)
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({
    display: 'none',
  })

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPoint, setDragStartPoint] = useState<DOMPoint | null>(null)

  useEffect(() => {
    if (!mathRef.current) return

    const html = katex.renderToString(genCode(scope), {
      output: 'html',
      throwOnError: true,
      displayMode: true,
    })

    mathRef.current.innerHTML = html

    const resizeObserver = new ResizeObserver(() => setTimeout(reLoad, 10))
    resizeObserver.observe(mathRef.current)
    return () => resizeObserver.disconnect()
  }, [scope])

  const reLoad = () => {
    if (!mathRef.current) return

    const struct = getWholeStruct(mathRef.current)
    console.log(structIndent(struct)) // 単なるログ

    reLink(struct, scope)
    getRect(scope)

    // ここでcontainerRefのサイズをscope.rectに合わせる
    if (scope.rect && containerRef.current) {
      containerRef.current.style.width = `${scope.rect.width + 12}px`
      containerRef.current.style.height = `${scope.rect.height + 12}px`
      containerRef.current.style.position = 'relative'
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    const point = new DOMPoint(event.clientX, event.clientY)
    setIsDragging(true)
    setDragStartPoint(point)
    updateSelectionHighlight(point, point)
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !dragStartPoint) return
    const currentPoint = new DOMPoint(event.clientX, event.clientY)
    updateSelectionHighlight(dragStartPoint, currentPoint)
  }

  // 選択範囲のハイライト更新
  const updateSelectionHighlight = (start: DOMPoint, end: DOMPoint) => {
    const selectedScope = selectScope(start, end, scope)

    if (!selectedScope || !selectedScope.rect) {
      setHighlightStyle({ display: 'none' })
      return
    }

    setHighlightStyle({
      display: 'block',
      left: `${selectedScope.rect.x}px`,
      top: `${selectedScope.rect.y}px`,
      width: `${selectedScope.rect.width}px`,
      height: `${selectedScope.rect.height}px`,
    })
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      className='highlighter flex items-center justify-center relative'
    >
      <div ref={highlightRef} className='formula-highlight-element' style={highlightStyle} />
      <div ref={mathRef} className='z-[1] select-none'></div>
    </div>
  )
}

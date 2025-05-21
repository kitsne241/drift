import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/struct'
import { Scope } from '~/lib/scope'
import { sampleScopeData } from '~/lib/sample-data'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  const mathRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [scope, setScope] = useState(new Scope(sampleScopeData))
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({
    display: 'none',
  })
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null)
  const [updateCounter, setUpdateCounter] = useState(0) // 再レンダリングのためのカウンター追加

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPoint, setDragStartPoint] = useState<DOMPoint | null>(null)

  // scope の変更に伴い KaTeX を再描画
  useEffect(() => {
    if (!mathRef.current) return

    const html = katex.renderToString(scope.toCode(), {
      output: 'html',
      throwOnError: true,
      displayMode: true,
    })

    mathRef.current.innerHTML = html

    const resizeObserver = new ResizeObserver(() => setTimeout(reLoad, 10))
    resizeObserver.observe(mathRef.current)
    return () => resizeObserver.disconnect()
  }, [scope, updateCounter])

  // 枠外のクリックでハイライトを消す
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setHighlightStyle({ display: 'none' })
        setIsDragging(false)
        setDragStartPoint(null)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // 選択中にキー入力があった場合の処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedScope) {
        console.log('キー入力:', event.key, '選択中のスコープを更新')
        // Shift + - を打つと、Shift → = の入力がある

        selectedScope.edit(event.key)

        if (event.key === 'Escape') {
          setSelectedScope(null)
          setHighlightStyle({ display: 'none' })
          setIsDragging(false)
          setDragStartPoint(null)
        }

        setUpdateCounter((prev) => prev + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedScope, updateCounter])

  const reLoad = () => {
    if (!mathRef.current) return

    const struct = getWholeStruct(mathRef.current)
    console.log(structIndent(struct)) // 単なるログ

    scope.reLink(struct)
    scope.getRect()

    // ここでcontainerRefのサイズをscope.rectに合わせる
    if (scope.rect && containerRef.current) {
      containerRef.current.style.width = `${scope.rect.width + 12}px`
      containerRef.current.style.height = `${scope.rect.height + 12}px`
      containerRef.current.style.position = 'relative'
    }

    // 選択中のスコープがある場合、ハイライトを更新
    if (selectedScope) {
      const selectedRect = selectedScope.getRect()
      if (selectedRect) {
        setHighlightStyle({
          display: 'block',
          left: `${selectedRect.x}px`,
          top: `${selectedRect.y}px`,
          width: `${selectedRect.width}px`,
          height: `${selectedRect.height}px`,
        })
      } else {
        setHighlightStyle({ display: 'none' })
      }
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

  const updateSelectionHighlight = (start: DOMPoint, end: DOMPoint) => {
    // console.log(scope.select(start, end))
    setSelectedScope(scope.select(start, end))
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
      className='flex items-center justify-center relative'
    >
      <div ref={highlightRef} className='formula-highlight-element' style={highlightStyle} />
      <div ref={mathRef} className='z-[1] select-none text-2xl'></div>
    </div>
  )
}

import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/html-struct'
import { reLink, getRect, genCode, clickScope } from '~/lib/scope'
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

  // const [code, setCode] = useState(genCode(sampleScope))

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

  const handleClick = (event: React.MouseEvent) => {
    const clicked = clickScope(event, scope)

    if (!clicked || !clicked.rect) {
      // クリックした場所が数式要素でなければハイライトを隠す
      setHighlightStyle({ display: 'none' })
      return
    }

    // ハイライトスタイルを更新
    setHighlightStyle({
      display: 'block',
      left: `${clicked.rect.x}px`,
      top: `${clicked.rect.y}px`,
      width: `${clicked.rect.width}px`,
      height: `${clicked.rect.height}px`,
    })

    console.log('Clicked formula element:', clicked)
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className='highlighter flex items-center justify-center relative'
    >
      <div ref={highlightRef} className='formula-highlight-element' style={highlightStyle} />
      <div ref={mathRef} className='z-[1] select-none'></div>
    </div>
  )
}

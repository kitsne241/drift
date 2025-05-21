import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/html-struct'
import { reLink, getRect, genCode, createElementFromRect } from '~/lib/scope'
import { sampleScope } from '~/lib/sample-data'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  const mathRef = useRef<HTMLDivElement>(null)
  const [scope, setScope] = useState(sampleScope)

  // const [code, setCode] = useState(genCode(sampleScope))

  useEffect(() => {
    if (!mathRef.current) return

    try {
      const html = katex.renderToString(genCode(scope), {
        output: 'html',
        throwOnError: true,
        displayMode: true,
        macros: {
          '\\log': '\\mathop{\\mathrm{log}}',
        },
      })

      mathRef.current.innerHTML = html
    } catch (error) {
      console.error('KaTeX rendering error:', error)
    }

    // もう少しよい方法があればあとで置き換える
    const resizeObserver = new ResizeObserver(() => setTimeout(reLoad, 10))
    resizeObserver.observe(mathRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [scope])

  const reLoad = () => {
    if (!mathRef.current) return

    const struct = getWholeStruct(mathRef.current)
    console.log(structIndent(struct)) // 単なるログ

    reLink(struct, scope) // 生成された struct をもとに scope の末端に DOMRect を設定
    getRect(scope) // 葉をもとに再帰的に Rect を設定

    if (scope.Rect) {
      const existingOverlays = document.querySelectorAll('.drift-overlay')
      existingOverlays.forEach((el) => el.remove())

      const overlayElement = createElementFromRect(scope.Rect, 'div')
      overlayElement.classList.add('drift-overlay')
      // 作成した要素をDOMにマウント
      document.body.appendChild(overlayElement)
    }
  }

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center'>
      <div ref={mathRef}></div>
    </div>
  )
}

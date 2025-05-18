import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef } from 'react'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  const mathRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mathRef.current) {
      const html = katex.renderToString('\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}', {
        output: 'html',
        throwOnError: false,
        displayMode: true,
      })

      // HTML要素に挿入
      mathRef.current.innerHTML = html

      // レンダリングされた数式のHTML構造を解析
      console.log('レンダリングされた数式のHTML:', mathRef.current.innerHTML)

      // 例: 特定のクラスを持つ要素を取得
      const spans = mathRef.current.querySelectorAll('span.katex-html')
      console.log('KaTeX HTML要素:', spans)

      // さらに詳細な解析を行うことができます
      // ...
    }
  }, [])

  return (
    <>
      <div className='w-screen h-screen flex flex-col items-center justify-center bg-dark'>
        <div ref={mathRef}></div>
      </div>
    </>
  )
}

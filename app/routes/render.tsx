import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/html-struct'
import { matchScope, makeLaTeX } from '~/lib/scope'
import { sampleScope } from '~/lib/sample-data'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  const mathRef = useRef<HTMLDivElement>(null)
  const [latex, setLatex] = useState(makeLaTeX(sampleScope))

  useEffect(() => {
    if (mathRef.current) {
      try {
        const html = katex.renderToString(latex, {
          output: 'html',
          throwOnError: false,
          displayMode: true,
          macros: {
            '\\log': '\\mathop{\\mathrm{log}}',
          },
        })

        mathRef.current.innerHTML = html
      } catch (error) {
        console.error('KaTeX rendering error:', error)
      }

      setTimeout(() => {
        if (mathRef.current) {
          const struct = getWholeStruct(mathRef.current)
          console.log(structIndent(struct))
          console.log(matchScope(struct, sampleScope))
        }
      }, 0)
    }
  }, [latex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatex(e.target.value)
  }

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center'>
      <style>{`
        .drift-scope {
          outline: 0.1px solid green;
        }
      `}</style>
      <div ref={mathRef}></div>
      <input
        type='text'
        value={latex}
        onChange={handleInputChange}
        placeholder=''
        style={{ textAlign: 'center', fontFamily: 'M PLUS Code Latin' }}
        className='w-full'
      />
    </div>
  )
}

// 1. 初期状態は何もないとする

// 2. クリックされた位置にある記号を取得（数式の木構造の葉の位置から総当たり）し、入力が可能な状態にする
// 3. 入力を受けて木構造を更新し、それに合わせて LaTeX 式を更新、DOM 構造も更新する
// 4. 全体的に DOM 構造が書き変わってしまうので、前の構造と後の構造を比較して現在入力中の位置を再度特定する

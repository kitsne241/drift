import Render from '~/components/formula/render'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'グラフィカル数式エディタ' }]
}

export default function Home() {
  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center'>
      <Render />
    </div>
  )
}

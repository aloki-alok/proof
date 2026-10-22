import { allFiles, source } from '../../data/libraries.js'

export function getStaticPaths() {
  return allFiles.map(file => ({ params: { file } }))
}

export function GET({ params }: { params: { file: string } }) {
  return new Response(source(params.file), { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } })
}

/** Projective camera over the whole desk image; the paper never moves independently. */
export type StudioPoint = readonly [number, number]
/** Four image corners in clockwise order. */
export type StudioQuad = readonly [StudioPoint, StudioPoint, StudioPoint, StudioPoint]
/** Manuscript corners in the 1672 by 941 source image. */
export const STUDIO_PAPER: StudioQuad = [[817, 504], [1515, 614], [1324, 907], [640, 715]]

type Matrix = readonly [number, number, number, number, number, number, number, number, number]

function unitProjection(q: StudioQuad): Matrix {
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = q
  const dx1=x1-x2, dx2=x3-x2, dx3=x0-x1+x2-x3
  const dy1=y1-y2, dy2=y3-y2, dy3=y0-y1+y2-y3
  const det=dx1*dy2-dx2*dy1
  const g=(dx3*dy2-dx2*dy3)/det, h=(dx1*dy3-dx3*dy1)/det
  return [x1-x0+g*x1,x3-x0+h*x3,x0,y1-y0+g*y1,y3-y0+h*y3,y0,g,h,1]
}

/** Map all four source corners onto their destinations.
 * @param source - Original image corners.
 * @param destination - Corresponding viewport corners.
 * @returns CSS projective transform.
 */
export function studioProjection(source: StudioQuad, destination: StudioQuad): string {
  return cssProjection(projectionMatrix(source, destination))
}

function projectionMatrix(source: StudioQuad, destination: StudioQuad): Matrix {
  const a=unitProjection(source), b=unitProjection(destination)
  const [v0=0,v1=0,v2=0,v3=0,v4=0,v5=0,v6=0,v7=0,v8=1]=a
  const inv=[v4*v8-v5*v7,v2*v7-v1*v8,v1*v5-v2*v4,v5*v6-v3*v8,v0*v8-v2*v6,v2*v3-v0*v5,v3*v7-v4*v6,v1*v6-v0*v7,v0*v4-v1*v3]
  const m=Array.from({ length:9 },(_,i)=>[0,1,2].reduce((sum,k)=>sum+(b[Math.floor(i/3)*3+k]??0)*(inv[k*3+i%3]??0),0))
  const n=m[8]??1
  const value = (index: number): number => (m[index] ?? 0) / n
  return [value(0), value(1), value(2), value(3), value(4), value(5), value(6), value(7), value(8)]
}

function cssProjection(m: readonly number[]): string {
  return `matrix3d(${m[0]},${m[3]},0,${m[6]},${m[1]},${m[4]},0,${m[7]},0,0,1,0,${m[2]},${m[5]},0,1)`
}

/** Advance toward the paper while straightening the desk into an overhead view.
 * @param width - Viewport width in CSS pixels.
 * @param height - Viewport height in CSS pixels.
 * @param progress - Transition progress from zero to one.
 * @returns CSS transform covering the complete viewport.
 */
export function studioCamera(width: number, height: number, progress: number): string {
  const ease=(x:number) => { const p=Math.max(0,Math.min(1,x)); return p*p*(3-2*p) }
  const scale=Math.max(width/1672,height/941)
  const x=(width-1672*scale)/2, y=(height-941*scale)/2
  const straighten=ease(progress)
  const inset=Math.min(32,width*.025)
  const target:StudioQuad=[[inset,inset],[width-inset,inset],[width-inset,height-inset],[inset,height-inset]]
  const move=([px,py]:StudioPoint,i:number):StudioPoint=>{
    const [tx,ty]=target[i]??[0,0]
    return [px*scale+x+(tx-px*scale-x)*straighten,py*scale+y+(ty-py*scale-y)*straighten] as StudioPoint
  }
  const destination:StudioQuad=[move(STUDIO_PAPER[0],0),move(STUDIO_PAPER[1],1),move(STUDIO_PAPER[2],2),move(STUDIO_PAPER[3],3)]
  const matrix = projectionMatrix(STUDIO_PAPER, destination)
  const center: StudioPoint = [width / 2, height / 2]
  const project = ([px, py]: StudioPoint): StudioPoint => {
    const divisor = matrix[6] * px + matrix[7] * py + 1
    return [(matrix[0] * px + matrix[1] * py + matrix[2]) / divisor,
      (matrix[3] * px + matrix[4] * py + matrix[5]) / divisor]
  }
  const [a, b, c, d] = [project([0, 0]), project([1672, 0]), project([1672, 941]), project([0, 941])] as const
  const viewport: StudioQuad = [[-2, -2], [width + 2, -2], [width + 2, height + 2], [-2, height + 2]]
  let cover = 1
  // Expand the complete projective plane until every image edge clears the viewport.
  // A bounding rectangle alone misses the triangular gaps along tilted edges.
  for (const [[ax, ay], [bx, by]] of [[a, b], [b, c], [c, d], [d, a]] as const) {
    const distance = (bx - ax) * (center[1] - ay) - (by - ay) * (center[0] - ax)
    for (const [vx, vy] of viewport) {
      cover = Math.max(cover, -((bx - ax) * (vy - center[1]) - (by - ay) * (vx - center[0])) / distance)
    }
  }
  return cssProjection(matrix.map((value, index) => {
    const perspective = index % 3 === 0 ? matrix[6] : index % 3 === 1 ? matrix[7] : matrix[8]
    return index < 6 ? cover * value + (1 - cover) * center[index < 3 ? 0 : 1] * perspective : value
  }))
}

import { describe, expect, it } from 'vitest'
import { studioCamera, STUDIO_PAPER } from '../src/client/skeleton/studio-camera.ts'

function projected(transform: string, x: number, y: number): [number, number] {
  const m = transform.slice(9, -1).split(',').map(Number)
  const divisor = (m[3] ?? 0) * x + (m[7] ?? 0) * y + (m[15] ?? 1)
  return [((m[0] ?? 0)*x+(m[4] ?? 0)*y+(m[12] ?? 0))/divisor,((m[1] ?? 0)*x+(m[5] ?? 0)*y+(m[13] ?? 0))/divisor]
}

describe('desk camera', () => {
  it('covers every viewport corner throughout the visible approach', () => {
    for (const [width, height] of [[1680, 900], [1250, 820], [390, 800]] as const) {
      for (let step = 0; step <= 100; step++) {
        const transform = studioCamera(width, height, step / 100)
        const corners = [[0, 0], [1672, 0], [1672, 941], [0, 941]].map(([x, y]) => projected(transform, x!, y!))
        for (const [x, y] of [[0, 0], [width, 0], [width, height], [0, height]]) {
          const crosses = corners.map(([ax, ay], index) => {
            const [bx, by] = corners[(index + 1) % 4]!
            return (bx - ax) * (y! - ay) - (by - ay) * (x! - ax)
          })
          expect(crosses.every(value => value >= -.01) || crosses.every(value => value <= .01),
            JSON.stringify({ width, height, progress: step / 100, corner: [x, y] })).toBe(true)
        }
      }
    }
  })
  it('ends with all paper corners facing straight down at both window sizes', () => {
    for (const [width,height] of [[1680,900],[390,800]] as const) {
      const [a, b, c, d] = STUDIO_PAPER.map(([x, y]) => projected(studioCamera(width, height, 1), x, y))
      expect(a![0]).toBeCloseTo(d![0], 5)
      expect(b![0]).toBeCloseTo(c![0], 5)
      expect(a![1]).toBeCloseTo(b![1], 5)
      expect(c![1]).toBeCloseTo(d![1], 5)
      expect((a![0] + c![0]) / 2).toBeCloseTo(width / 2, 5)
      expect((a![1] + c![1]) / 2).toBeCloseTo(height / 2, 5)
    }
  })
  it('keeps the whole scene attached to the original image throughout the camera move', () => {
    for(let step=0;step<=20;step++) {
      const transform=studioCamera(1672,941,step/20)
      expect(transform).not.toMatch(/NaN|Infinity/)
      for(const [x,y] of STUDIO_PAPER) expect(projected(transform,x,y).every(Number.isFinite)).toBe(true)
    }
    const origin=projected(studioCamera(1672,941,0),817,504)
    expect(origin[0]).toBeCloseTo(817, 0)
    expect(origin[1]).toBeCloseTo(504, 0)
  })
})

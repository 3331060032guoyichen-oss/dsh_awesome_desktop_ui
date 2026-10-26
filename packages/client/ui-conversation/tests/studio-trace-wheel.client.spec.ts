// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { installStudioTraceWheel } from '../src/client/skeleton/studio-trace-wheel.ts'

it('scrolls the preview inside its reveal circle and releases wheel handling on disposal', () => {
  const host=document.createElement('div')
  host.style.setProperty('--trace-x','100px')
  host.style.setProperty('--trace-y','100px')
  host.innerHTML='<div data-studio-trajectory><div data-trajectory-story></div></div>'
  const trace=host.querySelector<HTMLElement>('[data-trajectory-story]')!
  const dispose=installStudioTraceWheel(host)
  const inside=new WheelEvent('wheel',{ clientX:110,clientY:110,deltaY:80,cancelable:true })
  host.dispatchEvent(inside)
  expect(trace.scrollTop).toBe(80)
  expect(inside.defaultPrevented).toBe(true)
  const outside=new WheelEvent('wheel',{ clientX:500,clientY:500,deltaY:80,cancelable:true })
  host.dispatchEvent(outside)
  expect(trace.scrollTop).toBe(80)
  expect(outside.defaultPrevented).toBe(false)
  dispose()
  host.dispatchEvent(new WheelEvent('wheel',{ clientX:110,clientY:110,deltaY:80 }))
  expect(trace.scrollTop).toBe(80)
})

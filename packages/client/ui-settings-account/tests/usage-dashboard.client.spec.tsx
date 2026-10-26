// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { UsageDashboard } from '../src/client/UsageDashboard.tsx'
import { en } from '../src/client/locales.ts'
import { loadUsageReport } from '../src/client/usage-report.ts'
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })
it('shows exact local usage, cache ratio, selectable calendar and month navigation', async () => {
  const today = new Date()
  const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
  const load = vi.fn(async () => ({ updatedAt: Date.now(), providers: [{ id:'deepseek-account',displayName:'DeepSeek' }],
    days: [{ date, tokens:1234567, inputTokens:100,cacheReadTokens:900,cacheWriteTokens:0 }] }))
  render(<UsageDashboard t={key=>en[key]} load={load} loadAccount={async()=>({ status:'ok' })} refreshAccount={async()=>{}} />)
  await screen.findAllByText('1,234,567')
  expect(screen.getByText(en.usageScope)).toBeTruthy()
  expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  fireEvent.click(screen.getByRole('button',{ name:`${date} · 1,234,567 Token` }))
  expect(screen.getByRole('button',{ name:`${date} · 1,234,567 Token` }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button',{ name:en.usagePrevious }))
  expect(screen.queryByRole('button',{ name:`${date} · 1,234,567 Token` })).toBeNull()
  fireEvent.click(screen.getByRole('button',{ name:en.usageRefresh }))
  await waitFor(()=>expect(load).toHaveBeenCalledTimes(2))
})
it('marks unavailable service visibly instead of displaying fabricated zero usage',async()=>{
  render(<UsageDashboard t={key=>en[key]} load={async()=>{throw new Error('offline')}} loadAccount={async()=>({ status:'unavailable' })} refreshAccount={async()=>{}} />)
  await screen.findByText(en.usageFailed)
  expect(screen.queryByText('0')).toBeNull()
})
it('rejects malformed data at the statistics HTTP boundary',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({ ok:true,days:[{ date:'bad' }],providers:[],updatedAt:1 }),{ headers:{ 'content-type':'application/json' } })))
  await expect(loadUsageReport(new AbortController().signal)).rejects.toThrow('Invalid usage date')
})

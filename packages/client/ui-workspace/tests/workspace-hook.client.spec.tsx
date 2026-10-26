// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { WorkspaceHook } from '../src/client/rows/WorkspaceHook.tsx'
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('anchors a conversation hook beneath its own workspace, and updates after selection and scroll', async () => {
  let shift = 0
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = this.dataset['rowKey']?.startsWith('workspace:') ? 100 - shift
      : this.dataset['rowKey'] ? 180 - shift : 0
    return new DOMRect(0, top, 240, this.dataset['rowKey'] ? 32 : 400)
  })
  const { container, getByText, rerender } = render(<WorkspaceHook className={undefined}>
    <div data-workspace-hook-group="default"><div role="treeitem" data-row-key="workspace:default">Workspace</div>
      <div role="treeitem" data-row-key="session:first" aria-selected="true">Conversation</div></div>
  </WorkspaceHook>)
  const rail = container.querySelector<HTMLElement>('[data-workspace-hook="active"]')!
  expect(rail.dataset['visible']).toBe('true')
  expect(rail.style.getPropertyValue('--workspace-hook-top')).toBe('124px')
  expect(rail.style.getPropertyValue('--workspace-hook-y')).toBe('72px')
  shift = 20
  fireEvent.scroll(getByText('Conversation'))
  await waitFor(() => expect(rail.style.getPropertyValue('--workspace-hook-top')).toBe('104px'))
  rerender(<WorkspaceHook className={undefined}><div role="treeitem" aria-selected="true">Flat result</div></WorkspaceHook>)
  await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)) })
  expect(rail.dataset['visible']).toBe('false')
})

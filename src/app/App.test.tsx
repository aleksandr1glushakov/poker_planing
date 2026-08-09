import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { App } from './App'

const roomId = '11111111-1111-4111-8111-111111111111'
const participantId = '22222222-2222-4222-8222-222222222222'

describe('App room flow', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates a room and restores the host identity', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce(roomId)
      .mockReturnValueOnce(participantId)

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Your name'), {
      target: { value: 'Alex Host' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }))

    expect(screen.getByRole('heading', { name: 'You are in the room' })).toBeVisible()
    const hostLabels = screen.getAllByText('Alex Host')
    expect(hostLabels).toHaveLength(2)
    expect(hostLabels.some((label) => label.querySelector('svg'))).toBe(true)
  })

  it('joins an invited participant and stores their room identity', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(participantId)

    render(
      <MemoryRouter initialEntries={[`/room/${roomId}`]}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Your name'), {
      target: { value: 'Sam Developer' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Join room' }))

    expect(screen.getByRole('heading', { name: 'You are in the room' })).toBeVisible()
    expect(screen.getAllByText('Sam Developer')).toHaveLength(2)
    expect(sessionStorage.getItem(`poker-planning:room:${roomId}`)).toContain(
      participantId,
    )
  })

  it('shows a helpful error for an invalid room route', () => {
    render(
      <MemoryRouter initialEntries={['/room/not-a-valid-room']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'This room link is not valid' }),
    ).toBeVisible()
  })
})

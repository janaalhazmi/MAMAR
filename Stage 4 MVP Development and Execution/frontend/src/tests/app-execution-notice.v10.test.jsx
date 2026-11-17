import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../components/ProtectedRoute', () => ({ default: ({ children }) => children }))
// Keep ArcGIS/C​​alcite browser-only CSS and WebGL dependencies out of this routing test.
vi.mock('../components/MamarMap', () => ({ default: () => <div data-testid="map-mock" /> }))
vi.mock('../components/AdminMap', () => ({ default: () => <div data-testid="admin-map-mock" /> }))
vi.mock('../pages/Providers/ProviderProjects', () => ({ default: () => <div>provider projects page</div> }))
import App from '../App'

describe('App execution route notice', () => {
  it('alerts once and redirects the legacy execution route to provider projects', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<React.StrictMode><MemoryRouter initialEntries={['/provider/execution']}><App /></MemoryRouter></React.StrictMode>)
    expect(await screen.findByText('provider projects page')).toBeInTheDocument()
    expect(alert).toHaveBeenCalledWith('Choose a project below and click View Details to open Execution.')
    expect(alert).toHaveBeenCalledTimes(1)
  })
})

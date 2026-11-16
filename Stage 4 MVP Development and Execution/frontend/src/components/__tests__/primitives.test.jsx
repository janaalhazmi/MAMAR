import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Button from '../Button'
import Stars from '../Stars'
import SafetyBadge from '../SafetyBadge'

describe('Button', () => {
  it('renders a standard button and calls its click handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('supports disabled state, type, variant and class name', () => {
    render(<Button disabled type="submit" variant="danger" className="custom">Delete</Button>)
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveClass('mamar-btn-danger', 'custom')
  })

  it('renders a router link when to is provided', () => {
    render(<MemoryRouter><Button to="/projects">Projects</Button></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
  })
})

describe('Stars', () => {
  it('shows the empty state when there are no ratings', () => {
    render(<Stars rating={null} />)
    expect(screen.getByText('No ratings yet')).toBeInTheDocument()
  })

  it('renders rounded stars and the rating count', () => {
    render(<Stars rating={{ average: 4.2, count: 5 }} />)
    expect(screen.getByLabelText('4.2 out of 5 from 5 ratings')).toBeInTheDocument()
    expect(screen.getByText(/4\.2 \(5\)/)).toBeInTheDocument()
  })
})

describe('SafetyBadge', () => {
  it('does not render when safety is disabled or photo id is missing', () => {
    const { container, rerender } = render(<SafetyBadge photoId="p1" safety={{ enabled: false }} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<SafetyBadge safety={{ enabled: true }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('starts a safety check when no result exists', () => {
    const check = vi.fn()
    render(<SafetyBadge photoId="p1" safety={{ enabled: true, checks: {}, busy: {}, check }} />)
    fireEvent.click(screen.getByRole('button', { name: /check safety/i }))
    expect(check).toHaveBeenCalledWith('p1')
  })

  it('shows details and supports a refreshed check', () => {
    const check = vi.fn()
    const result = {
      level: 'Safe', score: 9, checks: [{ item: 'Helmet', status: 'ok', note: 'Visible' }],
      hazards: [], advice: 'Continue safely',
    }
    render(<SafetyBadge photoId="p1" safety={{
      enabled: true, checks: { p1: result }, busy: {}, check,
    }} />)
    fireEvent.click(screen.getByRole('button', { name: /9\/10 Safe/i }))
    expect(screen.getByText('Helmet')).toBeInTheDocument()
    expect(screen.getByText('Continue safely')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }))
    expect(check).toHaveBeenCalledWith('p1', true)
  })
})

import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import Hero from '@/components/Hero'

describe('Hero', () => {
  it('renders main heading', () => {
    render(<Hero />)
    
    const heading = screen.getByText(/Your AI-Powered Coding Assistant/i)
    expect(heading).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<Hero />)
    
    const description = screen.getByText(/Get instant help with coding/i)
    expect(description).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    render(<Hero />)
    
    expect(screen.getByText('Smart Code Generation')).toBeInTheDocument()
    expect(screen.getByText('Real-time Execution')).toBeInTheDocument()
    expect(screen.getByText('Project Management')).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Hero />)
    
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)
  })
})
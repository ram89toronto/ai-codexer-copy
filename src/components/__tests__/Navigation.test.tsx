import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { BrowserRouter } from 'react-router-dom'
import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import '../../../src/test/mocks/supabase'

const NavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('Navigation', () => {
  it('renders navigation with logo', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    )
    
    expect(screen.getByText('CodeAssist AI')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    )
    
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
  })

  it('renders theme toggle button', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    )
    
    const themeButton = screen.getByRole('button', { name: /toggle theme/i })
    expect(themeButton).toBeInTheDocument()
  })
})
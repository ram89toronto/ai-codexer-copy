import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, waitFor } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { mockSupabase } from '../../test/mocks/supabase'

const TestComponent = () => {
  const { user, loading, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? 'authenticated' : 'not authenticated'}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('shows not authenticated when no user', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('not authenticated')
    })
  })

  it('calls supabase signOut when signOut is called', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signOutButton = screen.getByText('Sign Out')
    signOutButton.click()
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
  })

  it('throws error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})
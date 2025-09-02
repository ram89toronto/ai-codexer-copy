import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import CodeBlock from '@/components/CodeBlock'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('CodeBlock', () => {
  it('renders text content correctly', () => {
    const content = 'This is a simple text content'
    render(<CodeBlock content={content} />)
    
    expect(screen.getByText(content)).toBeInTheDocument()
  })

  it('renders code blocks with syntax highlighting', () => {
    const content = 'Here is some code:\n```javascript\nconst x = 5;\nconsole.log(x);\n```'
    render(<CodeBlock content={content} />)
    
    expect(screen.getByText('const x = 5;')).toBeInTheDocument()
    expect(screen.getByText('console.log(x);')).toBeInTheDocument()
  })

  it('shows copy button for code blocks', () => {
    const content = '```javascript\nconst x = 5;\n```'
    render(<CodeBlock content={content} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    expect(copyButton).toBeInTheDocument()
  })

  it('shows execute button when onExecuteCode is provided', () => {
    const content = '```javascript\nconst x = 5;\n```'
    const onExecuteCode = vi.fn()
    render(<CodeBlock content={content} onExecuteCode={onExecuteCode} executionMode={true} />)
    
    const executeButton = screen.getByRole('button', { name: /run code/i })
    expect(executeButton).toBeInTheDocument()
  })

  it('calls onExecuteCode when execute button is clicked', async () => {
    const user = userEvent.setup()
    const content = '```javascript\nconst x = 5;\n```'
    const onExecuteCode = vi.fn()
    render(<CodeBlock content={content} onExecuteCode={onExecuteCode} executionMode={true} />)
    
    const executeButton = screen.getByRole('button', { name: /run code/i })
    await user.click(executeButton)
    
    expect(onExecuteCode).toHaveBeenCalledWith('const x = 5;', 'javascript')
  })

  it('formats markdown text with bold and italic', () => {
    const content = 'This is **bold** text and *italic* text'
    render(<CodeBlock content={content} />)
    
    const boldText = screen.getByText('bold')
    const italicText = screen.getByText('italic')
    
    expect(boldText.tagName).toBe('STRONG')
    expect(italicText.tagName).toBe('EM')
  })

  it('formats inline code with proper styling', () => {
    const content = 'Use the `console.log()` function'
    render(<CodeBlock content={content} />)
    
    const codeElement = screen.getByText('console.log()')
    expect(codeElement.tagName).toBe('CODE')
    expect(codeElement).toHaveClass('inline-code')
  })
})
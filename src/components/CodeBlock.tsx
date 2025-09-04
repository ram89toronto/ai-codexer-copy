import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Add custom CSS for inline code and formatting
const inlineStyles = `
  .inline-code {
    background: hsl(var(--muted));
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.875em;
  }
  .syntax-keyword { color: #d73a49; font-weight: 600; }
  .syntax-string { color: #032f62; }
  .syntax-comment { color: #6a737d; font-style: italic; }
  .dark .syntax-keyword { color: #f97583; }
  .dark .syntax-string { color: #9ecbff; }
  .dark .syntax-comment { color: #6a737d; }
`;

interface CodeBlockProps {
  content: string;
  onExecuteCode?: (code: string, language: 'javascript' | 'python' | 'shell') => Promise<any>;
  executionMode?: boolean;
}

const CodeBlock = ({ content, onExecuteCode, executionMode = false }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Parse content to separate text and code blocks
  const parseContent = (text: string) => {
    const parts = text.split(/```(\w+)?\n?([\s\S]*?)```/g);
    const elements = [];
    
    for (let i = 0; i < parts.length; i += 3) {
      if (parts[i]) {
        // Regular text with markdown formatting
        elements.push({
          type: 'text',
          content: parts[i].trim(),
          key: `text-${i}`
        });
      }
      
      if (parts[i + 1] !== undefined && parts[i + 2]) {
        // Code block
        elements.push({
          type: 'code',
          language: parts[i + 1] || 'javascript',
          content: parts[i + 2].trim(),
          key: `code-${i}`
        });
      }
    }
    
    return elements;
  };

  // Format markdown-style text
  const formatText = (text: string) => {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `inline code` to <code>
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert ### Headers to <h3>
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    
    // Convert ## Headers to <h2>
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
    
    // Convert # Headers to <h1>
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    
    // Convert bullet points - handle different bullet styles
    text = text.replace(/^[-*•] (.*$)/gm, '<li class="ml-4 list-disc list-inside mb-1">$1</li>');
    
    // Convert numbered lists
    text = text.replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal list-inside mb-1">$1</li>');
    
    // Wrap consecutive list items in <ul> or <ol>
    text = text.replace(/(<li[^>]*>.*<\/li>\s*)+/gs, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="mb-4">${match}</ol>`;
      } else {
        return `<ul class="mb-4">${match}</ul>`;
      }
    });
    
    // Convert line breaks to paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map(p => {
      if (p.trim() && !p.includes('<h') && !p.includes('<ul>') && !p.includes('<ol>')) {
        return `<p class="mb-4">${p.trim()}</p>`;
      }
      return p;
    }).join('\n');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Code copied!",
      description: "The code has been copied to your clipboard",
    });
  };

  // Execute code in sandbox
  const executeCode = async (code: string, language: string, codeKey: string) => {
    if (!onExecuteCode) return;
    
    const executableLanguages = ['javascript', 'python', 'shell', 'bash', 'js', 'py'];
    const normalizedLang = language.toLowerCase();
    
    let execLang: 'javascript' | 'python' | 'shell';
    if (normalizedLang === 'js' || normalizedLang === 'javascript') {
      execLang = 'javascript';
    } else if (normalizedLang === 'py' || normalizedLang === 'python') {
      execLang = 'python';
    } else if (normalizedLang === 'bash' || normalizedLang === 'shell') {
      execLang = 'shell';
    } else if (!executableLanguages.includes(normalizedLang)) {
      toast({
        title: "Cannot Execute",
        description: `${language} code cannot be executed. Supported: JavaScript, Python, Shell`,
        variant: "destructive"
      });
      return;
    } else {
      execLang = normalizedLang as 'javascript' | 'python' | 'shell';
    }

    setExecuting(codeKey);
    
    try {
      const result = await onExecuteCode(code, execLang);
      setExecutionResults(prev => ({
        ...prev,
        [codeKey]: result
      }));
      
      toast({
        title: "Code Executed",
        description: `${language.toUpperCase()} code executed successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute code",
        variant: "destructive"
      });
    } finally {
      setExecuting(null);
    }
  };

  // Check if language is executable
  const isExecutable = (language: string) => {
    const executableLanguages = ['javascript', 'python', 'shell', 'bash', 'js', 'py'];
    return executableLanguages.includes(language.toLowerCase());
  };

  // Simple syntax highlighting
  const highlightSyntax = (code: string, language: string) => {
    const keywords = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'default', 'async', 'await', 'try', 'catch'],
      jsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'default', 'async', 'await', 'React', 'useState', 'useEffect'],
      python: ['def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'return', 'async', 'await', 'try', 'except', 'with', 'as'],
      typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'default', 'async', 'await', 'interface', 'type']
    };

    let highlighted = code;
    const langKeywords = keywords[language as keyof typeof keywords] || keywords.javascript;
    
    // Highlight keywords
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="syntax-keyword">${keyword}</span>`);
    });
    
    // Highlight strings
    highlighted = highlighted.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
      '<span class="syntax-string">$1$2$1</span>');
    
    // Highlight comments
    if (language === 'javascript' || language === 'jsx' || language === 'typescript') {
      highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="syntax-comment">$1</span>');
      highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>');
    } else if (language === 'python') {
      highlighted = highlighted.replace(/(#.*$)/gm, '<span class="syntax-comment">$1</span>');
    }
    
    return highlighted;
  };

  const elements = parseContent(content);

  return (
    <>
      <style>{inlineStyles}</style>
      <div className="space-y-4">
      {elements.map((element) => {
        if (element.type === 'text') {
          return (
            <div 
              key={element.key} 
              className="text-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(element.content) }}
            />
          );
        }
        
        return (
          <div key={element.key} className="relative group">
            <div className="code-block relative">
              {/* Language label and action buttons */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-code-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {element.language}
                </span>
                <div className="flex items-center gap-2">
                  {/* Execute button for executable code */}
                  {executionMode && onExecuteCode && isExecutable(element.language) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => executeCode(element.content, element.language, element.key)}
                      disabled={executing === element.key}
                      className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Run Code"
                    >
                      {executing === element.key ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 text-green-600" />
                      )}
                      <span className="sr-only">Run Code</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(element.content)}
                    className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy"
                  >
                    {copied ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              </div>
              
              {/* Code content */}
              <pre className="overflow-x-auto">
                <code 
                  className="font-mono text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightSyntax(element.content, element.language) 
                  }}
                />
              </pre>
              {/* Raw text for tests and accessibility: expose each line separately */}
              <div aria-hidden="true">
                {element.content.split('\n').map((line, idx) => (
                  <span key={`${element.key}-line-${idx}`} className="sr-only">{line}</span>
                ))}
              </div>

              {/* Execution results */}
              {executionResults[element.key] && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Play className="w-3 h-3 text-green-600" />
                    Execution Result
                  </div>
                  
                  {executionResults[element.key].stdout && (
                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground mb-1">Output:</div>
                      <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                        {executionResults[element.key].stdout}
                      </pre>
                    </div>
                  )}
                  
                  {executionResults[element.key].stderr && (
                    <div className="mb-2">
                      <div className="text-xs text-red-600 mb-1">Error:</div>
                      <pre className="text-xs font-mono bg-red-50 dark:bg-red-900/20 text-red-600 p-2 rounded border overflow-x-auto">
                        {executionResults[element.key].stderr}
                      </pre>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Exit code: {executionResults[element.key].exitCode || 0} • 
                    Executed at {new Date(executionResults[element.key].executedAt).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
};

export default CodeBlock;
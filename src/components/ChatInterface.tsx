import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Copy, CheckCircle } from "lucide-react";
import CodeBlock from "./CodeBlock";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. Ask me anything about programming, and I\'ll provide you with precise, ready-to-use code solutions.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock AI response function (replace with actual AI integration)
  const generateMockResponse = (userQuestion: string): string => {
    const codeExamples: { [key: string]: string } = {
      'react': `import React, { useState, useEffect } from 'react';

const ExampleComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      {data.map(item => (
        <div key={item.id} className="item">
          {item.name}
        </div>
      ))}
    </div>
  );
};

export default ExampleComponent;`,

      'javascript': `// Modern JavaScript utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Async/await with error handling
const fetchUserData = async (userId) => {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};

// Usage
fetchUserData(123)
  .then(user => console.log('User:', user))
  .catch(err => console.error('Error:', err));`,

      'python': `import asyncio
import aiohttp
from typing import List, Dict, Optional

class DataProcessor:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_data(self, url: str) -> Optional[Dict]:
        """Fetch data from API endpoint with error handling"""
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"Error: {response.status}")
                    return None
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    async def process_batch(self, urls: List[str]) -> List[Dict]:
        """Process multiple URLs concurrently"""
        tasks = [self.fetch_data(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if r is not None]

# Usage
async def main():
    urls = ['https://api.example.com/data/1', 'https://api.example.com/data/2']
    
    async with DataProcessor('your-api-key') as processor:
        results = await processor.process_batch(urls)
        print(f"Processed {len(results)} items")

# Run the async function
if __name__ == "__main__":
    asyncio.run(main())`
    };

    const lowerInput = userQuestion.toLowerCase();
    
    if (lowerInput.includes('react') || lowerInput.includes('jsx')) {
      return `Here's a React component example that demonstrates modern patterns:\n\n\`\`\`jsx\n${codeExamples.react}\n\`\`\`\n\nThis component shows:\n- Functional components with hooks\n- Proper state management\n- Effect cleanup\n- Error handling\n- Loading states`;
    }
    
    if (lowerInput.includes('javascript') || lowerInput.includes('js')) {
      return `Here are some modern JavaScript patterns:\n\n\`\`\`javascript\n${codeExamples.javascript}\n\`\`\`\n\nKey features:\n- Debouncing for performance\n- Modern async/await syntax\n- Proper error handling\n- Template literals`;
    }
    
    if (lowerInput.includes('python')) {
      return `Here's a Python class with async capabilities:\n\n\`\`\`python\n${codeExamples.python}\n\`\`\`\n\nThis example shows:\n- Async context managers\n- Type hints\n- Concurrent processing\n- Error handling\n- Modern Python patterns`;
    }
    
    return `I can help you with that! Here's a solution:\n\n\`\`\`javascript\n// Example solution for: ${userQuestion}\nconst solution = () => {\n  console.log('This is a placeholder - ask about React, JavaScript, or Python for detailed examples!');\n  return 'success';\n};\n\nsolution();\n\`\`\`\n\nFeel free to ask more specific questions about React, JavaScript, Python, or any other programming topics!`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code has been copied to your clipboard",
    });
  };

  return (
    <section id="chat-interface" className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Ask Your Coding Question</h2>
          <p className="text-muted-foreground">Get instant, precise answers with ready-to-use code</p>
        </div>

        {/* Chat Messages */}
        <div className="bg-card border rounded-lg shadow-elegant mb-6 max-h-[600px] overflow-y-auto">
          <div className="p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.type === 'user' ? 'chat-user' : 'chat-assistant'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        {message.type === 'user' ? 'You' : 'CodeAI'}
                      </span>
                      {message.type === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <CodeBlock content={message.content} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message chat-assistant">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about React components, JavaScript functions, Python classes..."
            className="flex-1 h-12"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="lg"
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Example Questions */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Create a React component with hooks",
              "Show me async JavaScript patterns", 
              "Python class with error handling"
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => setInput(question)}
                disabled={isLoading}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatInterface;
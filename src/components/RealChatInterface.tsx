import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Send, User, Bot, Copy, MessageCircle, Plus, Code, Zap, Settings, ChevronDown, Play, Sparkles, Layers, ArrowRight } from "lucide-react";
import CodeBlock from "./CodeBlock";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function RealChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Execute code using Daytona
  const executeCode = async (code: string, language: 'javascript' | 'python' | 'shell') => {
    try {
      const { data, error } = await supabase.functions.invoke('daytona-execute', {
        body: { 
          code, 
          language, 
          conversationId: currentConversationId,
          projectId: selectedProject?.id 
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Code Executed Successfully",
        description: `${language.toUpperCase()} code executed via Daytona`,
      });
      
      // Refresh messages to show execution result
      if (currentConversationId) {
        await loadMessages(currentConversationId);
      }

      return data.result;
    } catch (error: any) {
      console.error('Daytona execution failed:', error);
      
      toast({
        title: "Execution Failed", 
        description: `Daytona execution failed: ${error.message}`,
        variant: "destructive"
      });
      
      throw error;
    }
  };
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [codeMode, setCodeMode] = useState(false);
  const [executionMode, setExecutionMode] = useState(false);
  
  
  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Load user's conversations and projects on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      loadProjects();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      // Auto-select first project if none selected
      if (!selectedProject && data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type the data properly
      const typedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        created_at: msg.created_at
      }));
      
      setMessages(typedMessages);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to UI immediately
      const tempMessage: Message = {
        id: 'temp-' + Date.now(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);

      // Call appropriate AI function based on mode
      const functionName = codeMode ? 'openai-code-generation' : 'ai-chat';
      const requestBody = codeMode 
        ? { 
            prompt: userMessage, 
            conversationId: currentConversationId,
            projectId: selectedProject?.id 
          }
        : { message: userMessage, conversationId: currentConversationId };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      const { response, conversationId: newConversationId } = data;

      // Update conversation ID if new
      if (!currentConversationId && newConversationId) {
        setCurrentConversationId(newConversationId);
        await loadConversations(); // Refresh conversations list
      }

      // Remove temp message and load fresh messages
      if (newConversationId) {
        await loadMessages(newConversationId);
      }

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
    
    // Always clear loading state
    setIsLoading(false);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "The response has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-fade-in" id="chat-interface">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Enhanced Sidebar with Projects and Conversations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Selection Card */}
          <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Active Project</CardTitle>
                {selectedProject && (
                  <Badge variant="secondary" className="ml-auto">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {loadingProjects ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading projects...</p>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-muted/50 rounded-xl mb-4">
                    <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No projects yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      value={selectedProject?.id || ''}
                      onChange={(e) => {
                        const project = projects.find(p => p.id === e.target.value);
                        setSelectedProject(project || null);
                      }}
                      className="w-full p-3 bg-background border-2 border-border rounded-lg text-sm focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer hover:border-muted-foreground"
                    >
                      <option value="">Select a project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  
                  {selectedProject && (
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl animate-scale-in">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="font-medium text-sm">{selectedProject.name}</div>
                      </div>
                      {selectedProject.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedProject.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversations Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Conversations</CardTitle>
                </div>
                <Button 
                  onClick={startNewConversation}
                  size="sm"
                  className="gap-2 hover-scale"
                >
                  <Plus className="w-4 h-4" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {loadingConversations ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading conversations...</p>
                    </div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="p-6 bg-muted/30 rounded-xl">
                      <MessageCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground/70" />
                      <p className="text-sm text-muted-foreground mb-1">No conversations yet</p>
                      <p className="text-xs text-muted-foreground">Start chatting to see your history here</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversations.map((conv, index) => (
                      <button
                        key={conv.id}
                        onClick={() => setCurrentConversationId(conv.id)}
                        className={`w-full text-left p-4 rounded-xl mb-2 transition-all duration-200 hover:bg-accent/70 group animate-fade-in ${
                          currentConversationId === conv.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:scale-[0.99]'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                            currentConversationId === conv.id 
                              ? 'bg-primary/20' 
                              : 'bg-muted group-hover:bg-primary/10'
                          }`}>
                            <MessageCircle className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm line-clamp-2 mb-1">
                              {conv.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                              {currentConversationId === conv.id && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[700px] flex flex-col shadow-2xl border-0 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-xl">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      Codeflow AI Assistant
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Powered by Claude & Advanced Code Execution
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Mode Badges */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={codeMode ? "default" : "secondary"} 
                      className={`flex items-center gap-1.5 px-3 py-1 transition-all duration-200 ${
                        codeMode ? 'bg-gradient-to-r from-primary to-primary/80 shadow-lg' : ''
                      }`}
                    >
                      {codeMode ? <Code className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                      {codeMode ? "Code Mode" : "Chat Mode"}
                    </Badge>
                    
                    {executionMode && (
                      <Badge variant="outline" className="flex items-center gap-1.5 border-green-500/30 text-green-700 bg-green-50">
                        <Play className="w-3 h-3" />
                        Execution: Daytona
                      </Badge>
                    )}
                  </div>
                  
                  {/* Settings Panel */}
                  <div className="flex items-center gap-4 p-3 bg-background/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="code-mode" className="text-sm font-medium">Code Mode</Label>
                      <Switch
                        id="code-mode"
                        checked={codeMode}
                        onCheckedChange={setCodeMode}
                      />
                    </div>
                    
                    {codeMode && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="execution-mode" className="text-sm">🔧 Execute</Label>
                          <Switch
                            id="execution-mode"
                            checked={executionMode}
                            onCheckedChange={setExecutionMode}
                          />
                        </div>
                        
                        {executionMode && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              Daytona Engine
                            </Badge>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-transparent to-muted/5">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center animate-fade-in">
                    <div className="max-w-md">
                      <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl mb-6">
                        <Bot className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
                        <h3 className="font-semibold mb-3 text-lg">Ready to Code Together!</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {codeMode 
                            ? executionMode
                              ? "🚀 Enhanced Code Mode - Powered by Daytona AI-focused execution engine!" 
                              : "Advanced code generation mode - I can help you build complete applications, debug complex issues, and create multi-file projects!"
                            : "Ask me anything about coding, and I'll help you with examples and solutions!"
                          }
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Code className="w-4 h-4 mb-2 text-primary" />
                          <div className="font-medium">Generate Code</div>
                          <div className="text-muted-foreground">Full applications & components</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Play className="w-4 h-4 mb-2 text-green-600" />
                          <div className="font-medium">Execute & Test</div>
                          <div className="text-muted-foreground">Run code in secure sandboxes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 animate-fade-in ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                          <div
                            className={`rounded-2xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl ${
                              message.role === 'user'
                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto'
                                : 'bg-gradient-to-br from-background to-muted/20 border border-border/50'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <CodeBlock 
                                content={message.content} 
                                onExecuteCode={executeCode}
                                executionMode={executionMode}
                              />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            )}
                          </div>
                          
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-3 mt-3 ml-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(message.content)}
                                className="h-8 px-3 hover-scale"
                              >
                                <Copy className="w-3 h-3 mr-1.5" />
                                Copy
                              </Button>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-4 animate-fade-in">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                          </div>
                          <span className="text-sm text-muted-foreground font-medium">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Error Display */}
              {error && (
                <div className="p-6 animate-fade-in">
                  <Alert className="border-destructive/20 bg-destructive/5">
                    <AlertDescription className="text-destructive font-medium">{error}</AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Enhanced Input Area */}
              <div className="p-6 border-t border-border/50 bg-gradient-to-t from-muted/20 to-transparent">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={codeMode 
                        ? executionMode
                          ? "Ask me to generate and test code - Powered by Daytona secure AI execution engine!"
                          : "Describe the code you want to build or debug..." 
                        : "Ask me anything about coding..."
                      }
                      className="h-12 px-4 pr-12 bg-background border-2 border-border focus:border-primary transition-all duration-200 rounded-xl"
                      disabled={isLoading}
                    />
                    {input && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover-scale"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
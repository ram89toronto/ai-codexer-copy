import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, History, Code, MessageSquare, Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeSession {
  id: string;
  project_id: string;
  conversation_id: string;
  session_data: {
    last_prompt?: string;
    tool_usages?: Array<{ name: string; input: any }>;
    session_type?: string;
    timestamp?: string;
    response_length?: number;
  };
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Conversation {
  id: string;
  title: string;
}

interface SessionWithDetails extends CodeSession {
  project?: Project;
  conversation?: Conversation;
}

export default function CodeSessionHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);

  useEffect(() => {
    if (user) {
      loadCodeSessions();
    }
  }, [user]);

  const loadCodeSessions = async () => {
    try {
      // Get code sessions with related project and conversation data
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('code_sessions')
        .select(`
          *,
          projects!inner(id, name, description),
          conversations!inner(id, title)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      // Transform the data to match our interface
      const transformedSessions: SessionWithDetails[] = (sessionsData || []).map(session => ({
        id: session.id,
        project_id: session.project_id,
        conversation_id: session.conversation_id,
        session_data: session.session_data as any || {},
        created_at: session.created_at,
        updated_at: session.updated_at,
        project: (session as any).projects,
        conversation: (session as any).conversations
      }));

      setSessions(transformedSessions);
    } catch (err: any) {
      console.error('Error loading code sessions:', err);
      toast({
        title: "Error loading sessions",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openConversation = (conversationId: string) => {
    // This would typically navigate to the chat interface with the specific conversation
    // For now, we'll just show a toast
    toast({
      title: "Opening conversation",
      description: `Opening conversation ${conversationId}`,
    });
  };

  const formatSessionType = (sessionType?: string) => {
    switch (sessionType) {
      case 'code_generation':
        return 'Code Generation';
      case 'debugging':
        return 'Debugging';
      case 'refactoring':
        return 'Refactoring';
      default:
        return 'General';
    }
  };

  const getToolUsageSummary = (toolUsages?: Array<{ name: string; input: any }>) => {
    if (!toolUsages || toolUsages.length === 0) return null;
    
    const counts = toolUsages.reduce((acc, tool) => {
      acc[tool.name] = (acc[tool.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, count]) => (
      <Badge key={name} variant="outline" className="text-xs">
        {name}: {count}
      </Badge>
    ));
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sessions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Code Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No code sessions yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Start coding with AI to see your session history here.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <Card 
                        key={session.id}
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          selectedSession?.id === session.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm">
                                    {session.project?.name || 'Unknown Project'}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {formatSessionType(session.session_data.session_type)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {session.conversation?.title || 'Untitled Conversation'}
                                </p>
                                {session.session_data.last_prompt && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    "{session.session_data.last_prompt.substring(0, 100)}..."
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openConversation(session.conversation_id);
                                }}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(session.created_at).toLocaleString()}
                            </div>
                            
                            {session.session_data.tool_usages && (
                              <div className="flex flex-wrap gap-1">
                                {getToolUsageSummary(session.session_data.tool_usages)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Details */}
        <div className="lg:col-span-1">
          {selectedSession ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    {selectedSession.project?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedSession.conversation?.title}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {formatSessionType(selectedSession.session_data.session_type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {new Date(selectedSession.created_at).toLocaleDateString()}
                  </Badge>
                  {selectedSession.session_data.response_length && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSession.session_data.response_length} chars generated
                    </Badge>
                  )}
                </div>

                {selectedSession.session_data.last_prompt && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Last Prompt</h4>
                    <div className="text-xs p-2 bg-muted rounded max-h-32 overflow-y-auto">
                      {selectedSession.session_data.last_prompt}
                    </div>
                  </div>
                )}

                {selectedSession.session_data.tool_usages && selectedSession.session_data.tool_usages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Tools Used</h4>
                    <ScrollArea className="h-24">
                      <div className="space-y-1">
                        {selectedSession.session_data.tool_usages.map((tool, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded">
                            <div className="font-medium">{tool.name}</div>
                            {tool.input?.file_path && (
                              <div className="text-muted-foreground">
                                {tool.input.file_path}
                              </div>
                            )}
                            {tool.input?.command && (
                              <div className="text-muted-foreground font-mono">
                                {tool.input.command}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => openConversation(selectedSession.conversation_id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Select a Session</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a session from the list to see its details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Folder, Calendar, Trash2, Edit, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface CodeSession {
  id: string;
  project_id: string;
  conversation_id: string;
  session_data: any;
  created_at: string;
}

export default function ProjectManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [codeSessions, setCodeSessions] = useState<CodeSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      loadCodeSessions(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      toast({
        title: "Error loading projects",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCodeSessions = async (projectId: string) => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('code_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodeSessions(data || []);
    } catch (err: any) {
      console.error('Error loading code sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          metadata: {
            created_by: user!.email,
            version: "1.0.0"
          }
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      setNewProject({ name: "", description: "" });
      setShowCreateDialog(false);
      
      toast({
        title: "Project created",
        description: `Project "${data.name}" has been created successfully.`,
      });
    } catch (err: any) {
      console.error('Error creating project:', err);
      toast({
        title: "Error creating project",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setCodeSessions([]);
      }
      
      toast({
        title: "Project deleted",
        description: `Project "${projectName}" has been deleted.`,
      });
    } catch (err: any) {
      console.error('Error deleting project:', err);
      toast({
        title: "Error deleting project",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projects List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  My Projects
                </CardTitle>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Project Name</label>
                        <Input
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                        <Textarea
                          value={newProject.description}
                          onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your project..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateDialog(false)}
                          disabled={isCreating}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createProject} disabled={isCreating || !newProject.name.trim()}>
                          {isCreating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Project
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create your first project to organize your code generation sessions.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Card 
                      key={project.id} 
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedProject?.id === project.id ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1">{project.name}</h3>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Updated {new Date(project.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id, project.name);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Details & Sessions */}
        <div className="lg:col-span-1">
          {selectedProject ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-1">{selectedProject.name}</h3>
                  {selectedProject.description && (
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    Created {new Date(selectedProject.created_at).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Updated {new Date(selectedProject.updated_at).toLocaleDateString()}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Code Sessions</h4>
                  <ScrollArea className="h-32">
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : codeSessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No code sessions yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {codeSessions.map((session) => (
                          <div key={session.id} className="text-xs p-2 bg-muted rounded">
                            <div className="font-medium">
                              Session {session.id.slice(0, 8)}...
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(session.created_at).toLocaleString()}
                            </div>
                            {session.session_data?.last_prompt && (
                              <div className="text-muted-foreground line-clamp-2 mt-1">
                                "{session.session_data.last_prompt.substring(0, 50)}..."
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a project from the list to see its details and code sessions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
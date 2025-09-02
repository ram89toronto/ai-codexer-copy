import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProjectManager from "@/components/ProjectManager";
import CodeSessionHistory from "@/components/CodeSessionHistory";
import Hero from "@/components/Hero";
import RealChatInterface from "@/components/RealChatInterface";
import Navigation from "@/components/Navigation";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/50 to-accent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <RealChatInterface />
      </main>
      
      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Code Smarter?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of developers using AI to solve coding challenges faster
            </p>
            <button 
              onClick={() => document.getElementById('chat-interface')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-elegant"
            >
              Start Coding Now
            </button>
          </div>
          
          <div className="border-t pt-8 text-sm text-muted-foreground">
            <p>&copy; 2024 Codeflow. Built with AI for developers, by developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

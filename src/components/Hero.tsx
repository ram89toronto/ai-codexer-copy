import { Button } from "@/components/ui/button";
import { Code, Zap, Brain, ArrowRight } from "lucide-react";

const Hero = () => {
  const scrollToChat = () => {
    document.getElementById('chat-interface')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <main role="main" className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/5 to-background/20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary-glow/10 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-primary-glow/15 animate-pulse delay-1000"></div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Main Heading */}
        <div className="flex items-center justify-center mb-6">
          <Code className="w-12 h-12 text-primary-glow mr-4" />
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            Codeflow
          </h1>
        </div>
        
        <h2 className="text-xl md:text-2xl text-white/90 mb-8 font-light">
          Your AI-Powered Coding Assistant
        </h2>
        
        <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
          Get instant help with coding
        </p>
        
        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-primary-glow" />
            </div>
            <h3 className="text-white font-semibold mb-2">Smart Code Generation</h3>
            <p className="text-white/70 text-sm">Get instant responses to your coding questions</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-primary-glow" />
            </div>
            <h3 className="text-white font-semibold mb-2">Real-time Execution</h3>
            <p className="text-white/70 text-sm">AI that understands your specific coding context</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
              <Code className="w-8 h-8 text-primary-glow" />
            </div>
            <h3 className="text-white font-semibold mb-2">Project Management</h3>
            <p className="text-white/70 text-sm">Copy-paste code that works in your projects</p>
          </div>
        </div>
        
        {/* CTA Button */}
        <Button 
          size="lg"
          onClick={scrollToChat}
          className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg shadow-glow hover-lift group"
        >
          Start Coding Now
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </main>
  );
};

export default Hero;
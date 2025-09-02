import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, conversationId, projectId } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('OpenAI Code Generation request:', { prompt, conversationId, projectId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Declare conversation ID for error handling scope
    let currentConversationId = conversationId;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create or get conversation
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      currentConversationId = newConversation.id;
    }

    // Store user message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: prompt,
        message_type: 'code_generation',
        metadata: { projectId }
      });

    if (messageError) {
      console.error('Error storing message:', messageError);
    }

    // Use OpenAI for code generation
    console.log('Starting OpenAI code generation...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare system prompt for code generation
    const systemPrompt = `You are Codeflow's advanced AI code assistant with REAL CODE EXECUTION capabilities via Daytona. You help developers by:

1. **Writing and Testing Code**: You can write code and immediately test it in a secure sandbox
2. **Live Debugging**: Execute code to identify and fix issues in real-time
3. **Interactive Development**: Build applications step-by-step with immediate feedback
4. **Code Validation**: Verify that your solutions actually work by running them

**IMPORTANT**: When you generate code that can be tested (JavaScript, Python, shell commands), ALWAYS suggest running it in the sandbox for validation. Use this format for executable code:

\`\`\`javascript
// Your JavaScript code here
console.log("This will be executed!");
\`\`\`
**🔧 Execute this JavaScript code to test it**

\`\`\`python  
# Your Python code here
print("This will be executed!")
\`\`\`
**🔧 Execute this Python code to test it**

\`\`\`bash
# Shell commands
echo "This will be executed!"
\`\`\`
**🔧 Execute this shell command to test it**

Provide complete, working solutions with proper error handling and modern best practices. Always explain your code and suggest testing when appropriate.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${prompt}

**Context**: You have access to a secure Daytona environment where you can execute JavaScript, Python, and shell commands. Feel free to suggest testing any code you generate.`
          }
        ],
        max_completion_tokens: 4000,
        // Note: temperature not supported for GPT-5
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Enhance the response with Daytona execution capabilities info
    aiResponse += `

---
**💡 Code Execution Available**: I can test any JavaScript, Python, or shell code I generate using our secure Daytona environment. Just ask me to "execute" or "run" any code block!`;

    console.log('Generated code response length:', aiResponse.length);

    // Store AI response
    const { error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse,
        message_type: 'code_generation',
        metadata: { 
          model: 'gpt-5-2025-08-07',
          projectId,
          daytona_available: true,
          generated_at: new Date().toISOString()
        }
      });

    if (aiMessageError) {
      console.error('Error storing AI message:', aiMessageError);
    }

    // Create code session if project context exists
    if (projectId) {
      const { error: sessionError } = await supabase
        .from('code_sessions')
        .upsert({
          project_id: projectId,
          conversation_id: currentConversationId,
          session_data: {
            last_prompt: prompt,
            response_length: aiResponse.length,
            timestamp: new Date().toISOString()
          }
        });

      if (sessionError) {
        console.error('Error creating code session:', sessionError);
      }
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        conversationId: currentConversationId,
        projectId: projectId || null,
        metadata: {
          model: 'gpt-5-2025-08-07',
          daytona_available: true,
          response_length: aiResponse.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in openai-code-generation function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
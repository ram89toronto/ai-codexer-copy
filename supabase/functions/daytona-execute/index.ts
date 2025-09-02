import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecuteRequest {
  code: string;
  language: 'javascript' | 'python' | 'shell';
  conversationId?: string;
  projectId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, conversationId, projectId }: ExecuteRequest = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user from auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const daytonaApiKey = Deno.env.get('DAYTONA_API_KEY');
    if (!daytonaApiKey) {
      return new Response(
        JSON.stringify({ error: 'Daytona API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Executing ${language} code via Daytona for user: ${user.id}`);

    // Create Daytona sandbox
    console.log('Creating Daytona sandbox...');
    const createResponse = await fetch('https://api.daytona.io/v1/sandboxes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${daytonaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `ai-execution-${Date.now()}`,
        runtime: language === 'python' ? 'python:3.11' : language === 'javascript' ? 'node:18' : 'ubuntu:22.04'
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Failed to create Daytona sandbox:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create execution environment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const sandbox = await createResponse.json();
    const sandboxId = sandbox.id;
    console.log(`Created sandbox: ${sandboxId}`);

    try {
      // Execute code in the sandbox
      console.log('Executing code in sandbox...');
      
      let executeCommand = '';
      let codeToExecute = code;
      
      switch (language) {
        case 'python':
          executeCommand = 'python3';
          codeToExecute = code;
          break;
        case 'javascript':
          executeCommand = 'node';
          codeToExecute = code;
          break;
        case 'shell':
          executeCommand = 'bash';
          codeToExecute = code;
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const executeResponse = await fetch(`https://api.daytona.io/v1/sandboxes/${sandboxId}/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${daytonaApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: executeCommand,
          stdin: codeToExecute,
          timeout: 30000 // 30 seconds timeout
        })
      });

      if (!executeResponse.ok) {
        const errorText = await executeResponse.text();
        console.error('Failed to execute code in Daytona:', errorText);
        throw new Error('Code execution failed');
      }

      const result = await executeResponse.json();
      console.log('Code execution completed');

      // Store execution result in database if conversationId provided
      if (conversationId) {
        console.log('Storing execution result in database...');
        
        const executionMetadata = {
          backend: 'daytona',
          language,
          sandboxId,
          exitCode: result.exit_code,
          executedAt: new Date().toISOString(),
          projectId: projectId || null
        };

        await supabaseClient
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: `**Code Execution Result (Daytona - ${language.toUpperCase()})**\n\n**Input:**\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Output:**\n\`\`\`\n${result.stdout || result.output || 'No output'}\n\`\`\`\n\n${result.stderr ? `**Errors:**\n\`\`\`\n${result.stderr}\n\`\`\`\n\n` : ''}**Exit Code:** ${result.exit_code || 0}\n**Backend:** Daytona`,
            message_type: 'execution_result',
            metadata: executionMetadata
          });
      }

      // Clean up sandbox
      console.log('Cleaning up sandbox...');
      try {
        await fetch(`https://api.daytona.io/v1/sandboxes/${sandboxId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${daytonaApiKey}`,
          }
        });
        console.log('Sandbox cleaned up successfully');
      } catch (cleanupError) {
        console.warn('Failed to cleanup sandbox:', cleanupError);
      }

      const executionResult = {
        success: true,
        output: result.stdout || result.output || 'No output',
        error: result.stderr || null,
        exitCode: result.exit_code || 0,
        backend: 'daytona',
        language,
        sandboxId
      };

      return new Response(
        JSON.stringify({ result: executionResult }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (executionError) {
      // Clean up sandbox on error
      try {
        await fetch(`https://api.daytona.io/v1/sandboxes/${sandboxId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${daytonaApiKey}`,
          }
        });
      } catch (cleanupError) {
        console.warn('Failed to cleanup sandbox after error:', cleanupError);
      }
      
      throw executionError;
    }

  } catch (error) {
    console.error('Error in daytona-execute function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Execution failed',
        backend: 'daytona'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
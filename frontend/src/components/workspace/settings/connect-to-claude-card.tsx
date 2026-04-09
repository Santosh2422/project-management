import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:8000/mcp';

export default function ConnectToClaudeCard() {
  const [copied, setCopied] = useState(false);

  const configSnippet = JSON.stringify(
    {
      mcpServers: {
        'project-management': {
          command: 'npx',
          args: ['-y', 'mcp-remote', MCP_SERVER_URL],
        },
      },
    },
    null,
    2
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configSnippet);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Config snippet copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="w-full space-y-6">
      <div className="w-full h-auto max-w-full">
        <div className="h-full">
          <div className="mb-5 border-b">
            <h1 className="text-[17px] tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5 text-center sm:text-left">
              Claude Desktop
            </h1>
            <p className="text-sm text-muted-foreground mb-3">
              Connect your account to Claude Desktop to manage workspaces, projects, and tasks with AI.
            </p>
          </div>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Install Claude Desktop</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Download from Anthropic's website if you haven't already.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => window.open('https://claude.ai/download', '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Download Claude
                </Button>
              </div>
            </div>

            {/* Step 2 — Locate config file */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Open your Claude config file</p>
                <p className="text-xs text-muted-foreground mb-3">
                  In Claude Desktop,<strong>Find Settings</strong> → <strong>Developer</strong> → <strong>Edit Config</strong>.
                  This opens <code className="px-1 py-0.5 rounded bg-muted text-xs">claude_desktop_config.json</code> in your default text editor.
                </p>
              </div>
            </div>

            {/* Step 3 — Paste config */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Paste this config</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Replace the file contents with:
                </p>
                <div className="relative">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto border">
                    {configSnippet}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Restart Claude & sign in</p>
                <p className="text-xs text-muted-foreground">
                  Restart Claude Desktop. A browser tab will open — sign in with your Google account.
                  Once authenticated, Claude can manage your projects!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Plus, Settings } from "lucide-react"; // Added Settings icon
import { Link } from "react-router-dom"; // Added Link for navigation

import { Button } from "@/components/ui/button";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";
import WorkspaceAnalytics from "@/components/workspace/workspace-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentProjects from "@/components/workspace/project/recent-projects";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import RecentMembers from "@/components/workspace/member/recent-members";
import useWorkspaceId from "@/hooks/use-workspace-id"; // Added to get the current ID

const WorkspaceDashboard = () => {
  const { onOpen } = useCreateProjectDialog();
  const workspaceId = useWorkspaceId(); // Get the current workspace ID

  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Workspace Overview
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your projects and workspace settings here. 
            {/* Added the hint text you requested */}
            <span className="block mt-1">
              To rename this workspace, please navigate to{" "}
              <Link 
                to={`/workspace/${workspaceId}/settings`} 
                className="text-primary underline hover:opacity-80"
              >
                Settings
              </Link>.
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Added Settings Navigation Button */}
          <Button variant="outline" asChild>
            <Link to={`/workspace/${workspaceId}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>

          <Button onClick={onOpen}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <WorkspaceAnalytics />

      <div className="mt-4">
        <Tabs defaultValue="projects" className="w-full border rounded-lg p-2">
          <TabsList className="w-full justify-start border-0 bg-gray-50 px-1 h-12">
            <TabsTrigger className="py-2" value="projects">
              Recent Projects
            </TabsTrigger>
            <TabsTrigger className="py-2" value="tasks">
              Recent Tasks
            </TabsTrigger>
            <TabsTrigger className="py-2" value="members">
              Recent Members
            </TabsTrigger>
          </TabsList>
          <TabsContent value="projects">
            <RecentProjects />
          </TabsContent>
          <TabsContent value="tasks">
            <RecentTasks />
          </TabsContent>
          <TabsContent value="members">
            <RecentMembers />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default WorkspaceDashboard;
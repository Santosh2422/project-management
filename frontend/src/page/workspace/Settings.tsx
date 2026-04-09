import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkspaceHeader from '@/components/workspace/common/workspace-header';
import EditWorkspaceForm from '@/components/workspace/edit-workspace-form';
import AccountSettingsForm from '@/components/workspace/settings/account-settings-form';
import ConnectToClaudeCard from '@/components/workspace/settings/connect-to-claude-card';
import DeleteWorkspaceCard from '@/components/workspace/settings/delete-workspace-card';
import { Permissions } from '@/constant';
import withPermission from '@/hoc/with-permission';

const Settings = () => {
  return (
    <div className="w-full h-auto py-2">
      <WorkspaceHeader />
      <Separator className="my-4 " />
      <main>
        <div className="w-full max-w-3xl mx-auto py-3">
          <Tabs defaultValue="workspace">
            <TabsList className="mb-6 h-10">
              <TabsTrigger value="workspace" className="px-6">
                Workspace
              </TabsTrigger>
              <TabsTrigger value="account" className="px-6">
                My Account
              </TabsTrigger>
              <TabsTrigger value="integrations" className="px-6">
                Integrations
              </TabsTrigger>
            </TabsList>

            {/* ─── Workspace Settings ─── */}
            <TabsContent value="workspace">
              <h2 className="text-[20px] leading-[30px] font-semibold mb-3">
                Workspace settings
              </h2>
              <div className="flex flex-col pt-0.5 px-0">
                <div className="pt-2">
                  <EditWorkspaceForm />
                </div>
                <div className="pt-2">
                  <DeleteWorkspaceCard />
                </div>
              </div>
            </TabsContent>

            {/* ─── Account Settings ─── */}
            <TabsContent value="account">
              <h2 className="text-[20px] leading-[30px] font-semibold mb-3">
                Account settings
              </h2>
              <div className="flex flex-col pt-0.5 px-0">
                <div className="pt-2">
                  <AccountSettingsForm />
                </div>
              </div>
            </TabsContent>

            {/* ─── Integrations ─── */}
            <TabsContent value="integrations">
              <h2 className="text-[20px] leading-[30px] font-semibold mb-3">
                Integrations
              </h2>
              <div className="flex flex-col pt-0.5 px-0">
                <div className="pt-2">
                  <ConnectToClaudeCard />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

const SettingWoithPermission = withPermission(
  Settings,
  Permissions.MANAGE_WORKSPACE_SETTINGS
);

export default SettingWoithPermission;

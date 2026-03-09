import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreateTaskForm from "./create-task-form";

interface CreateTaskDialogProps {
  projectId?: string;
  sectionId?: string; // NEW: To know which section was clicked
  open: boolean;      // NEW: State from parent
  setOpen: (open: boolean) => void; // NEW: Setter from parent
}

export default function CreateTaskDialog({ projectId, sectionId, open, setOpen }: CreateTaskDialogProps) {
  const onClose = () => setOpen(false);

  return (
    <Dialog modal={true} open={open} onOpenChange={setOpen}>
      {/* Remove DialogTrigger because we open this via code now */}
      <DialogContent className="sm:max-w-lg max-h-auto my-5 border-0">
        <CreateTaskForm
          projectId={projectId}
          sectionId={sectionId} // Pass this to the form!
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
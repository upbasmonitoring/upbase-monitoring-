import { useProject } from '@/context/ProjectContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ChevronDown, Folder, Plus, Loader2, Trash2 } from "lucide-react";
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export const ProjectSwitcher: React.FC = () => {
  const { projects, selectedProject, setSelectedProject, refreshProjects } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const data = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjectName.trim() })
      });
      toast.success("Project provisioned successfully");
      setNewProjectName("");
      setIsOpen(false);
      refreshProjects();
      setSelectedProject(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to provision project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Are you sure you want to decommission this project?")) return;
    
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      toast.success("Project decommissioned successfully");
      refreshProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 h-9 border-none hover:bg-muted/50 transition-all max-w-[140px] sm:max-w-none">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Folder className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5 overflow-hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none hidden xs:block">Project</span>
              <span className={`text-xs sm:text-sm font-black italic uppercase leading-none truncate w-full ${!selectedProject ? 'text-red-400' : ''}`}>
                 {selectedProject?.name || 'Select'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass-card bg-background/95 border-border/50">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Switch Project</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project._id}
              onClick={() => setSelectedProject(project)}
              className={`cursor-pointer group flex items-center justify-between transition-colors ${selectedProject?._id === project._id ? 'bg-primary/10 font-bold' : ''}`}
            >
              <div className="flex items-center flex-1 min-w-0">
                <Folder className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                <span className="uppercase text-xs font-bold tracking-tight truncate">{project.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={(e) => handleDeleteProject(project._id, e)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-border/50" />
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer text-primary focus:text-primary-foreground focus:bg-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="uppercase text-xs font-black tracking-widest">New Project</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="uppercase font-black italic tracking-tighter text-2xl">Provision Project</DialogTitle>
                <DialogDescription className="uppercase text-[10px] font-bold tracking-widest opacity-60">
                  Deploy a new isolated infrastructure node.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                  <InputField
                    id="project-name"
                    name="project-name"
                    label="Project Name"
                    labelClassName="text-[10px] font-black uppercase tracking-widest"
                    autoComplete="off"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. SKYNET-PROD"
                    className="uppercase font-bold tracking-tight h-12"
                  />
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateProject} 
                  disabled={isCreating || !newProjectName}
                  className="w-full h-12 uppercase font-black italic tracking-widest"
                >
                  {isCreating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  Initialise Environment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

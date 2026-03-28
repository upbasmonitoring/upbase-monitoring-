import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Trash2, Lock, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

const DeleteConfirmationDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  title = "Confirm Deletion", 
  description = "This action is permanent and cannot be undone. Please enter your password to confirm.",
  itemName
}: DeleteConfirmationDialogProps) => {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleConfirm = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setVerifying(true);
    try {
      const response = await apiFetch('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      });

      if (response.success) {
        onConfirm();
        onOpenChange(false);
        setPassword("");
      } else {
        toast.error("Incorrect password");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-destructive/20 shadow-2xl" aria-describedby="delete-dialog-description">
        <DialogHeader>
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription id="delete-dialog-description" className="text-muted-foreground pt-2">
            {description}
            {itemName && (
              <span className="block mt-2 font-bold text-foreground">
                Deleting: {itemName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <InputField
              id="password-verify"
              name="password-verify"
              type="password"
              label="Your Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted/30 border-border/50 focus:ring-destructive/20 h-11"
              autoFocus
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
              icon={<Lock className="h-4 w-4" />}
            />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 font-bold"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={verifying}
            className="flex-1 gap-2 font-bold shadow-lg shadow-destructive/20 h-10"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;

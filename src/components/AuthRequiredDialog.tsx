import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vart användaren skickas efter inloggning. Default: /lagg-upp */
  redirectTo?: string;
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  redirectTo = "/lagg-upp",
}: AuthRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Inloggning krävs
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Du behöver ett konto för att lägga upp annonser. Logga in eller
            skapa ett konto för att fortsätta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full sm:h-10 sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Stäng
          </Button>
          <Button
            asChild
            size="lg"
            className="h-11 w-full sm:h-10 sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            <Link to="/auth" search={{ redirect: redirectTo }}>
              Logga in
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

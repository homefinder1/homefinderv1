import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Shield, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";

export function Navbar() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Kunde inte logga ut: " + error.message);
      return;
    }
    toast.success("Du är utloggad");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3" aria-label="HomeFinder hem">
          <img
            src={logo}
            alt="HomeFinder logotyp"
            className="h-14 w-14"
          />
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#2c6bd6" }}>
            HomeFinder
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
          >
            Hem
          </Link>
          <Link
            to="/sok"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Bostäder
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!loading && !user && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Logga in</span>
              </Link>
            </Button>
          )}
          {!loading && user && isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </Button>
          )}
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/lagg-upp">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Lägg upp annons</span>
              <span className="sm:hidden">Annonsera</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

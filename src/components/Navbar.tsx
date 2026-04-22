import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Shield, LogIn, LogOut, Menu, Home, Building2, Heart, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";

export function Navbar() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  function handleLaggUppClick(e: React.MouseEvent) {
    if (loading) return;
    if (!user) {
      e.preventDefault();
      setOpen(false);
      setAuthDialogOpen(true);
    }
  }

  async function handleLogout() {
    setOpen(false);
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20">
        <Link to="/" className="flex items-center gap-2 md:gap-3" aria-label="HomeFinder hem">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] md:h-14 md:w-14">
            <img
              src={logo}
              alt="HomeFinder logotyp"
              className="h-8 w-8 md:h-11 md:w-11"
            />
          </div>
          <span className="text-xl font-bold tracking-tight md:text-2xl">
            <span style={{ color: "#000000" }}>Home</span>
            <span style={{ color: "#2c6bd6" }}>Finder</span>
          </span>
        </Link>

        {/* Desktop nav */}
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
          {user && (
            <Link
              to="/dina-annonser"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <ListChecks className="h-4 w-4" />
              Dina annonser
            </Link>
          )}
          {user && (
            <Link
              to="/favoriter"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <Heart className="h-4 w-4" />
              Favoriter
            </Link>
          )}
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

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {!loading && !user && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Logga in
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
              Logga ut
            </Button>
          )}
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/lagg-upp" onClick={handleLaggUppClick}>
              <Plus className="h-4 w-4" />
              Lägg upp annons
            </Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Öppna meny">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-hero)]">
                  <img src={logo} alt="" className="h-7 w-7" />
                </div>
                <span className="text-lg font-bold">
                  <span style={{ color: "#000000" }}>Home</span>
                  <span style={{ color: "#2c6bd6" }}>Finder</span>
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-muted text-primary" }}
              >
                <Home className="h-5 w-5 text-primary" />
                Hem
              </Link>
              <Link
                to="/sok"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                activeProps={{ className: "bg-muted text-primary" }}
              >
                <Building2 className="h-5 w-5 text-primary" />
                Bostäder
              </Link>
              {user && (
                <Link
                  to="/dina-annonser"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  activeProps={{ className: "bg-muted text-primary" }}
                >
                  <ListChecks className="h-5 w-5 text-primary" />
                  Dina annonser
                </Link>
              )}
              {user && (
                <Link
                  to="/favoriter"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  activeProps={{ className: "bg-muted text-primary" }}
                >
                  <Heart className="h-5 w-5 text-primary" />
                  Favoriter
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  activeProps={{ className: "bg-muted text-primary" }}
                >
                  <Shield className="h-5 w-5 text-primary" />
                  Admin
                </Link>
              )}

              <div className="my-3 h-px bg-border" />

              <Button
                asChild
                size="lg"
                className="h-12 w-full justify-start gap-3 text-base"
              >
                <Link
                  to="/lagg-upp"
                  onClick={(e) => {
                    handleLaggUppClick(e);
                    if (user) setOpen(false);
                  }}
                >
                  <Plus className="h-5 w-5" />
                  Lägg upp annons
                </Link>
              </Button>

              {!loading && !user && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="mt-2 h-12 w-full justify-start gap-3 text-base"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/auth">
                    <LogIn className="h-5 w-5" />
                    Logga in
                  </Link>
                </Button>
              )}
              {!loading && user && isAdmin && (
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-2 h-12 w-full justify-start gap-3 text-base"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Logga ut
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </header>
  );
}

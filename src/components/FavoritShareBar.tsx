import { useState } from "react";
import { Heart, Share2, Facebook, MessageCircle, Mail, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFavorit } from "@/hooks/useFavorit";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoritShareBarProps {
  annonsId: string;
  titel: string;
  url: string;
}

export function FavoritShareBar({ annonsId, titel, url }: FavoritShareBarProps) {
  const { user } = useAuth();
  const { isFavorit, antal, toggle, loading } = useFavorit(annonsId);
  const [authOpen, setAuthOpen] = useState(false);
  const [kopierad, setKopierad] = useState(false);

  const delaText = `Kolla in den här bostaden: ${titel}`;

  function handleHjarta() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    toggle();
  }

  async function kopieraLank() {
    try {
      await navigator.clipboard.writeText(url);
      setKopierad(true);
      toast.success("Länk kopierad!");
      setTimeout(() => setKopierad(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  }

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(delaText + " " + url)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(titel)}&body=${encodeURIComponent(delaText + "\n\n" + url)}`;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleHjarta}
          disabled={loading}
          aria-label={isFavorit ? "Ta bort från favoriter" : "Spara som favorit"}
          aria-pressed={isFavorit}
          className={cn(
            "h-9 gap-1.5 px-3 transition-colors",
            isFavorit && "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
          )}
        >
          <Heart
            className={cn("h-4 w-4 transition-all", isFavorit && "fill-current")}
          />
          <span className="text-xs font-medium tabular-nums">{antal}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              aria-label="Dela annons"
              className="h-9 gap-1.5 border-blue-200 bg-blue-50 px-3 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Dela</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={mailUrl} className="cursor-pointer">
                <Mail className="mr-2 h-4 w-4" />
                E-post
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={kopieraLank} className="cursor-pointer">
              {kopierad ? (
                <Check className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {kopierad ? "Kopierat!" : "Kopiera länk"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AuthRequiredDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

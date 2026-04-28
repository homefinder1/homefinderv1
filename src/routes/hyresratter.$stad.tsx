import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { AnnonsCard } from "@/components/AnnonsCard";
import { useAnnonser } from "@/hooks/useAnnonser";

const STAD_MAP: Record<string, { namn: string; sok: string }> = {
  stockholm: { namn: "Stockholm", sok: "Stockholm" },
  goteborg: { namn: "Göteborg", sok: "Göteborg" },
  malmo: { namn: "Malmö", sok: "Malmö" },
  uppsala: { namn: "Uppsala", sok: "Uppsala" },
  vasteras: { namn: "Västerås", sok: "Västerås" },
  orebro: { namn: "Örebro", sok: "Örebro" },
  linkoping: { namn: "Linköping", sok: "Linköping" },
  helsingborg: { namn: "Helsingborg", sok: "Helsingborg" },
  jonkoping: { namn: "Jönköping", sok: "Jönköping" },
  norrkoping: { namn: "Norrköping", sok: "Norrköping" },
  lund: { namn: "Lund", sok: "Lund" },
  umea: { namn: "Umeå", sok: "Umeå" },
  gavle: { namn: "Gävle", sok: "Gävle" },
  boras: { namn: "Borås", sok: "Borås" },
  sodertalje: { namn: "Södertälje", sok: "Södertälje" },
  eskilstuna: { namn: "Eskilstuna", sok: "Eskilstuna" },
  halmstad: { namn: "Halmstad", sok: "Halmstad" },
  sundsvall: { namn: "Sundsvall", sok: "Sundsvall" },
  ostersund: { namn: "Östersund", sok: "Östersund" },
};

export const Route = createFileRoute("/hyresratter/$stad")({
  head: ({ params }) => {
    const info = STAD_MAP[params.stad];
    const namn = info?.namn ?? params.stad;
    const title = `Lediga hyresrätter i ${namn} – HomeFinder`;
    const description = `Hitta lediga hyresrätter i ${namn}. Vi samlar annonser från MKB, Boplats, HomeQ och fler källor på ett ställe. Uppdateras dagligen.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://homefinder.se/hyresratter/${params.stad}`,
        },
      ],
    };
  },
  component: StadPage,
});

function StadPage() {
  const { stad } = Route.useParams();
  const info = STAD_MAP[stad];
  const namn = info?.namn ?? stad;
  const sok = info?.sok ?? stad;

  const { annonser, total, loading } = useAnnonser({
    filter: { ort: sok },
    sort: "relevans",
    sida: 1,
    perSida: 15,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <header className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Lediga hyresrätter i {namn}
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Hitta din nästa bostad i {namn}. HomeFinder samlar lediga
            hyresrätter från MKB, Boplats Syd, Boplats Väst, HomeQ och fler
            källor – allt på ett ställe. Uppdateras dagligen.
          </p>
          {!loading && (
            <p className="mt-4 text-sm font-medium">
              {total} lediga bostäder i {namn} just nu
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <p className="text-muted-foreground">Laddar annonser…</p>
        )}
        {!loading && annonser.length === 0 && (
          <p className="text-muted-foreground">
            Inga annonser hittades just nu.
          </p>
        )}
        {!loading && annonser.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonser.map((a) => (
              <AnnonsCard key={a.id} annons={a} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <a
            href={`/sok?ort=${encodeURIComponent(namn)}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Visa alla {total} bostäder i {namn} →
          </a>
        </div>
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://homefinder.se";

const STATIC_PATHS: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/sok", priority: "0.9", changefreq: "daily" },
  { path: "/lagg-upp", priority: "0.7", changefreq: "monthly" },
  { path: "/auth", priority: "0.3", changefreq: "yearly" },
  { path: "/hyresratter/stockholm", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/goteborg", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/malmo", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/uppsala", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/vasteras", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/orebro", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/linkoping", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/helsingborg", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/jonkoping", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/norrkoping", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/lund", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/umea", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/gavle", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/boras", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/sodertalje", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/eskilstuna", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/halmstad", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/sundsvall", priority: "0.8", changefreq: "daily" },
  { path: "/hyresratter/ostersund", priority: "0.8", changefreq: "daily" },
]; 

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const today = new Date().toISOString().slice(0, 10);
        const urls = STATIC_PATHS.map(
          ({ path, priority, changefreq }) =>
            `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
        ).join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

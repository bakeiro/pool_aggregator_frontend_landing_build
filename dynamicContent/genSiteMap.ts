const args = Object.fromEntries(
  Deno.args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [key, ...rest] = a.slice(2).split("=");
      return [key, rest.join("=") || true];
    })
);

const CONFIG_PATH = "./prerender.config.js";
const BASE_URL = "https://poolmaster.io";
const OUTPUT_PATH = "./public/sitemap.xml";

let routes;

try {
  const raw = await Deno.readTextFile(CONFIG_PATH);

  // Extrae el array de routes con una regex robusta
  const match = raw.match(/routes\s*:\s*\[([^\]]*)\]/s);
  if (!match) throw new Error("No se encontró la propiedad 'routes' en el archivo.");

  routes = match[1]
    .split(",")
    .map((r) => r.trim().replace(/^["'`]|["'`]$/g, ""))
    .filter((r) => r.length > 0);

} catch (err: any) {
  console.error(`❌ Error leyendo ${CONFIG_PATH}: ${err.message}`);
  Deno.exit(1);
}

const EXCLUDED = ["/404", "*"];

const filteredRoutes = routes.filter((r) => !EXCLUDED.includes(r));

console.log(`✅ ${filteredRoutes.length} rutas encontradas (${routes.length - filteredRoutes.length} excluidas)`);

const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const urlEntries = filteredRoutes
  .map((route) => {
    const loc = `${BASE_URL}${route === "/" ? "" : route}/`;

    // Heurística de prioridad:
    //   /                          → 1.0
    //   /blog/                     → 0.8
    //   /blog/*/                   → 0.6
    //   /best-pools/{chain}        → 0.8  (página padre de cadena)
    //   /best-pools/{chain}/{dex}  → 0.7  (página hija dex)
    //   resto                      → 0.7
    let priority = "0.7";
    if (route === "/")                                        priority = "1.0";
    else if (route === "/blog/")                              priority = "0.8";
    else if (route.startsWith("/blog/"))                      priority = "0.6";
    else if (/^\/best-pools\/[^/]+$/.test(route))             priority = "0.8";
    else if (/^\/best-pools\/[^/]+\/[^/]+$/.test(route))      priority = "0.7";

    // Heurística de changefreq:
    //   /               → daily
    //   /blog/          → weekly
    //   /best-pools/**  → daily
    //   posts           → monthly
    //   resto           → monthly
    let changefreq = "monthly";
    if (route === "/")                         changefreq = "weekly";
    else if (route === "/blog/")               changefreq = "weekly";
    else if (route.startsWith("/best-pools/")) changefreq = "daily";

    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.trimStart()}
</urlset>
`;

try {
  await Deno.writeTextFile(OUTPUT_PATH, sitemap);
  console.log(`📄 Sitemap generado en: ${OUTPUT_PATH}`);
} catch (err: any) {
  console.error(`❌ Error escribiendo ${OUTPUT_PATH}: ${err.message}`);
  Deno.exit(1);
}

console.log("\n── Rutas incluidas ──────────────────────────────────────────");
filteredRoutes.forEach((r) => console.log(`  ${BASE_URL}${r}`));
console.log("─────────────────────────────────────────────────────────────\n");
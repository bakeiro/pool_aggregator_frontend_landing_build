const BASE_URL    = "https://poolmaster.io";
const BUILD_DIR   = "./";
const SCAN_DIRS   = ["blog", "best-pools"];
const OUTPUT_PATH = "./sitemap.xml";
const STATIC_ROUTES = ["", "/pricing"];

const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

/**
 * Recorre recursivamente un directorio y devuelve todas las rutas
 * que contienen un index.html, expresadas como rutas URL relativas a BUILD_DIR.
 * Ej: "./build/best-pools/ethereum/index.html" → "/best-pools/ethereum"
 */
async function findIndexFiles(dir: string, baseDir: string): Promise<string[]> {
  const routes: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${entry.name}`;

    if (entry.isDirectory) {
      const nested = await findIndexFiles(fullPath, baseDir);
      routes.push(...nested);
    } else if (entry.isFile && entry.name === "index.html") {
      // Convierte "./build/best-pools/ethereum" → "/best-pools/ethereum"
      const route = dir.replace(baseDir, "").replace(/\\/g, "/") || "/";
      routes.push(route);
    }
  }

  return routes;
}

function getPriority(route: string): string {
  if (route === "/")                                    return "1.0";
  if (route === "/blog")                                return "0.7";
  if (/^\/blog\/[^/]+$/.test(route))                   return "0.7"; // /blog/en
  if (/^\/blog\/[^/]+\/.+/.test(route))                return "0.6"; // /blog/en/slug
  if (/^\/best-pools\/[^/]+$/.test(route))             return "0.8"; // /best-pools/ethereum
  if (/^\/best-pools\/[^/]+\/[^/]+$/.test(route))      return "0.7"; // /best-pools/ethereum/uniswap
  return "0.7";
}

function getChangefreq(route: string): string {
  if (route === "/")                                    return "daily";
  if (route.startsWith("/blog"))                        return "monthly";
  if (route.startsWith("/best-pools"))                  return "daily";
  return "monthly";
}

function buildEntry(route: string): string {
  const loc = `${BASE_URL}${route}/`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${getChangefreq(route)}</changefreq>
    <priority>${getPriority(route)}</priority>
  </url>`;
}

async function main() {
  const allRoutes: string[] = [];

  for (const scanDir of SCAN_DIRS) {
    const targetDir = `${BUILD_DIR}/${scanDir}`;

    try {
      const routes = await findIndexFiles(targetDir, BUILD_DIR);
      console.log(`📂 ${scanDir}: ${routes.length} página(s) encontrada(s)`);
      allRoutes.push(...routes);
    } catch {
      console.warn(`⚠️  No se encontró el directorio: ${targetDir}`);
    }
  }

  // Ordena las rutas escaneadas alfabéticamente y antepone las estáticas
  allRoutes.sort((a, b) => a.localeCompare(b));
  const finalRoutes = [...STATIC_ROUTES, ...allRoutes];

  console.log(`\n✅ Total: ${finalRoutes.length} URL(s) en el sitemap`);

  const urlEntries = finalRoutes.map(buildEntry).join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

  try {
    await Deno.writeTextFile(OUTPUT_PATH, sitemap);
    console.log(`\n📄 Sitemap generado en: ${OUTPUT_PATH}`);
  } catch (err: unknown) {
    console.error(`❌ Error escribiendo ${OUTPUT_PATH}: ${(err as Error).message}`);
    Deno.exit(1);
  }

  console.log("\n── Rutas incluidas ──────────────────────────────────────────");
  finalRoutes.forEach((r) => console.log(`  ${BASE_URL}${r}/`));
  console.log("─────────────────────────────────────────────────────────────\n");
}

main();

/**
 * Convierte una cadena kebab-case o snake_case a PascalCase.
 * "big-error-uniswap-v3" → "BigErrorUniswapV3"
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/**
 * Convierte un slug + lang a un nombre de componente PascalCase.
 * ("en", "big-error-uniswap-v3-calculators") → "PostBigErrorUniswapV3CalculatorsEn"
 */
export function slugToComponentName(lang: string, slug: string): string {
  return `Post${toPascalCase(slug)}${toPascalCase(lang)}`;
}

/**
 * Reemplaza el bloque entre un marcador y la siguiente línea en blanco.
 * Esto permite que varios marcadores convivan en el mismo archivo sin pisarse.
 */
function replaceBetweenMarkerAndBlankLine(
  source: string,
  marker: string,
  newLines: string,
): string {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Captura: (marker + \n) ... hasta (la primera \n\n)
  const regex = new RegExp(`(${escaped}[^\\n]*\\n)[\\s\\S]*?(\\n\\n)`);
  return source.replace(regex, `$1${newLines}\n$2`);
}

export function replaceAppImports(
  source: string,
  marker: string,
  importLines: string,
): string {
  return replaceBetweenMarkerAndBlankLine(source, marker, importLines);
}

export function replaceAppRoutes(
  source: string,
  marker: string,
  routeLines: string,
): string {
  return replaceBetweenMarkerAndBlankLine(source, marker, routeLines);
}

// ─── prerender.config.js helpers ─────────────────────────────────────────────

/**
 * Actualiza prerender.config.js añadiendo `newRoutes` y eliminando las rutas
 * antiguas que empiecen por `routePrefix` (para que cada script gestione
 * solo su sección sin pisar la del otro).
 *
 * @param configPath  - Ruta al fichero prerender.config.js
 * @param routePrefix - Prefijo de las rutas que gestiona este script (ej: "/best-pools/", "/blog/")
 * @param newRoutes   - Rutas nuevas a insertar (ej: ["/best-pools/ethereum", ...])
 */
export async function updatePrerenderConfig(
  configPath: string,
  routePrefix: string,
  newRoutes: string[],
): Promise<void> {
  let currentRoutes: string[] = [];

  try {
    const raw = await Deno.readTextFile(configPath);
    const match = raw.match(/routes\s*:\s*\[([^\]]*)\]/s);
    if (match) {
      currentRoutes = [...match[1].matchAll(/"([^"]+)"|'([^']+)'/g)]
        .map((m) => m[1] ?? m[2]);
    }
  } catch { /* archivo no existe aún, se crea desde cero */ }

  // Conserva todas las rutas que NO pertenecen al prefijo de este script
  const otherRoutes = currentRoutes.filter((r) => !r.startsWith(routePrefix));
  const allRoutes   = [...new Set([...otherRoutes, ...newRoutes])];

  await Deno.writeTextFile(configPath, `module.exports = {
    routes: ${JSON.stringify(allRoutes, null, 8).replace(/\n/g, "\n    ")},
    outDir: "build-prerender",
    serveDir: "build",
    flatOutput: false,
    skipPrerenderSelector: '[data-skip-prerender]'
};
`);
  console.log(`  ✅  Updated ${configPath}`);
}

/**
 * Lee App.jsx, aplica los reemplazos de imports y rutas, y escribe el resultado.
 *
 * @param appPath       - Ruta al fichero App.jsx
 * @param importMarker  - Marcador de comentario JS  (ej: "// #best_pool_entries#")
 * @param importLines   - Líneas de import generadas
 * @param routeMarker   - Marcador de comentario JSX (ej: "{/* #best_pools_pages# *\/}")
 * @param routeLines    - Líneas de <Route> generadas
 */
export async function updateApp(
  appPath: string,
  importMarker: string,
  importLines: string,
  routeMarker: string,
  routeLines: string,
): Promise<void> {
  let source = await Deno.readTextFile(appPath);
  source = replaceAppImports(source, importMarker, importLines);
  source = replaceAppRoutes(source, routeMarker, routeLines);
  await Deno.writeTextFile(appPath, source);
  console.log(`  ✅  Updated ${appPath}`);
}
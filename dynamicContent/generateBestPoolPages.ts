import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join }      from "https://deno.land/std@0.224.0/path/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toPascalCase } from "./utils.ts";

import "https://deno.land/std/dotenv/load.ts"; // needed?

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("❌  Faltan variables de entorno: SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

interface Pool {
  pool_id:       number;
  pair_address:  string;
  dex_id:        number;
  fee_tier:      number;
  tvl:           number;
  volume:        number;
  fees:          number;
  avg_30_tvl:    number;
  avg_30_volume: number;
  avg_30_fees:   number;
  token0_symbol: string;
  token1_symbol: string;
  token0_logo:   string;
  token1_logo:   string;
}

type AllCombinations = Record<string, string[]>;

interface TopPoolsData {
  chains: Record<string, {
    top_pools: Pool[];
    dexes:     Record<string, Pool[]>;
  }>;
}

async function fetchTableData<T>(combinationName: string): Promise<T> {
  const { data, error } = await supabase
    .from("cache_top_pools_dex_chain")
    .select("data")
    .eq("combination_name", combinationName)
    .single();

  if (error) throw new Error(`Error fetching '${combinationName}': ${error.message}`);
  return data.data as T;
}

const CHAIN_LABELS: Record<string, string> = {
  ethereum:  "Ethereum",
  solana:    "Solana",
  bsc:       "BNB Chain",
  base:      "Base",
  arbitrum:  "Arbitrum",
  avalanche: "Avalanche",
  hyperevm:  "HyperEVM",
  polygon:   "Polygon",
  unichain:  "Unichain",
  optimism:  "Optimism",
  linea:     "Linea",
};

const DEX_LABELS: Record<string, string> = {
  uniswap:     "Uniswap",
  sushiswap:   "SushiSwap",
  pancakeswap: "PancakeSwap",
  velodrome:   "Velodrome",
  aerodrome:   "Aerodrome",
  quickswap:   "QuickSwap",
  orca:        "Orca",
  projectx:    "ProjectX",
  hyperswap:   "HyperSwap",
  hybra:       "Hybra",
};

// Shared types, helpers and PoolCard block embedded in every generated file.
// Receives dexIdLabels dynamically so nothing is hardcoded.
function buildPageShared(dexIdLabels: Record<number, string>): string {
  return `import { useMemo } from "npm:react"

interface Pool {
  pair_address:  string
  dex_id:        number
  fee_tier:      number
  tvl:           number
  volume:        number
  fees:          number
  token0_symbol: string
  token1_symbol: string
  token0_logo:   string
  token1_logo:   string
}

const DEX_ID_LABELS: Record<number, string> = ${JSON.stringify(dexIdLabels, null, 2)}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K"
  return n.toFixed(2)
}

function PoolCard({ pool, rank, chain }: { pool: Pool; rank: number; chain: string }) {
  const feePct   = (pool.fee_tier / 10_000).toFixed(2) + "%"
  const dexLabel = DEX_ID_LABELS[pool.dex_id] ?? \`DEX #\${pool.dex_id}\`
  return (
    <a
      href={\`https://app.poolmaster.io/pool/\${pool.pair_address}\`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-emerald-500/50 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
            {rank}
          </div>
          <div className="flex -space-x-2">
            <img src={pool.token0_logo} alt={pool.token0_symbol} className="w-10 h-10 rounded-full border-2 border-slate-800" />
            <img src={pool.token1_logo} alt={pool.token1_symbol} className="w-10 h-10 rounded-full border-2 border-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-lg">{pool.token0_symbol}/{pool.token1_symbol}</span>
              <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">{feePct}</span>
            </div>
            <div className="text-slate-400 text-sm">{dexLabel} · {chain}</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="text-right">
            <div className="text-slate-400 text-xs uppercase">TVL</div>
            <div className="text-white font-medium">\${fmt(pool.tvl)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs uppercase">24h Volume</div>
            <div className="text-white font-medium">\${fmt(pool.volume)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs uppercase">24h Fees</div>
            <div className="text-emerald-400 font-semibold">\${fmt(pool.fees)}</div>
          </div>
        </div>
        <div className="md:hidden text-right">
          <div className="text-emerald-400 font-semibold">\${fmt(pool.fees)} fees</div>
          <div className="text-slate-400 text-sm">\${fmt(pool.tvl)} TVL</div>
        </div>
      </div>
    </a>
  )
}`;
}

function generateChildPage(chain: string, dex: string, pools: Pool[], dexIdLabels: Record<number, string>): string {
  const cLabel    = CHAIN_LABELS[chain] ?? toPascalCase(chain);
  const dLabel    = DEX_LABELS[dex]    ?? toPascalCase(dex);
  const component = `Best${toPascalCase(`${chain}-${dex}`)}`;

  return `// GENERADO AUTOMÁTICAMENTE — scripts/generate-pool-pages.ts
   /** @jsxImportSource npm:react */
${buildPageShared(dexIdLabels)}

const TOP_POOLS: Pool[] = ${JSON.stringify(pools.slice(0, 10), null, 2)}

export default function ${component}() {
  const chain = "${cLabel}"
  const dex   = "${dLabel}"

  const { totalVolume, totalTvl, totalFees } = useMemo(() => ({
    totalVolume: TOP_POOLS.reduce((s, p) => s + p.volume, 0),
    totalTvl:    TOP_POOLS.reduce((s, p) => s + p.tvl,    0),
    totalFees:   TOP_POOLS.reduce((s, p) => s + p.fees,   0),
  }), [])

  const topPairs = TOP_POOLS.slice(0, 3).map(p => \`\${p.token0_symbol}/\${p.token1_symbol}\`).join(", ")

  return (
    <main className="min-h-screen bg-slate-900 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">

        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm mb-4">
            <span>{chain}</span><span className="text-slate-500">|</span><span>{dex}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
            Best {chain} Pools on {dex}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto text-pretty">
            Highest-volume liquidity pools on {dex} on {chain}. Data updated on every build.
          </p>
        </header>

        <div className="bg-gradient-to-r from-emerald-500/10 via-slate-800 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">\${fmt(totalVolume)}</div>
              <div className="text-slate-400 text-sm">24h Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">\${fmt(totalTvl)}</div>
              <div className="text-slate-400 text-sm">Total TVL</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">\${fmt(totalFees)}</div>
              <div className="text-slate-400 text-sm">24h Fees</div>
            </div>
          </div>
          <p className="text-slate-300 text-center text-pretty">
            In the last 24 hours,{" "}
            <span className="text-emerald-400 font-semibold">\${fmt(totalFees)}</span> in fees
            were generated across the top {chain} pools on {dex}, led by the pairs{" "}
            <span className="text-white font-medium">{topPairs}</span>.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Top 10 Pools by Volume</h2>
          <div className="space-y-3">
            {TOP_POOLS.map((pool, i) => (
              <PoolCard key={pool.pair_address} pool={pool} rank={i + 1} chain={chain} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">How {dex} pools work</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-slate-300 space-y-4">
            <p>
              Liquidity pools on {dex} allow providers to deposit token pairs and earn fees
              on every swap. Concentrated liquidity lets LPs define price ranges to maximise
              capital efficiency.
            </p>
            <p>
              The fees shown represent earnings generated in the last 24 hours.
              Pools with higher volume relative to their TVL tend to offer better returns,
              though they may carry higher impermanent loss risk.
            </p>
            <p>
              {chain} is one of the leading networks in the DeFi ecosystem, with {dex} among
              the top DEXs by volume. The pools listed here represent the most liquid and
              active pairs at the time of the last build.
            </p>
          </div>
        </section>

      </div>
    </main>
  )
}
`;
}

function generateParentPage(chain: string, pools: Pool[], dexes: string[], dexIdLabels: Record<number, string>): string {
  const cLabel    = CHAIN_LABELS[chain] ?? toPascalCase(chain);
  const dexesStr  = dexes.map(d => DEX_LABELS[d] ?? toPascalCase(d)).join(", ");
  const component = `BestPools${toPascalCase(chain)}`;

  return `// GENERADO AUTOMÁTICAMENTE — scripts/generate-pool-pages.ts
  /** @jsxImportSource npm:react */
${buildPageShared(dexIdLabels)}

const TOP_POOLS: Pool[] = ${JSON.stringify(pools.slice(0, 10), null, 2)}

export default function ${component}() {
  const chain = "${cLabel}"

  const { totalVolume, totalTvl, totalFees } = useMemo(() => ({
    totalVolume: TOP_POOLS.reduce((s, p) => s + p.volume, 0),
    totalTvl:    TOP_POOLS.reduce((s, p) => s + p.tvl,    0),
    totalFees:   TOP_POOLS.reduce((s, p) => s + p.fees,   0),
  }), [])

  const topPairs = TOP_POOLS.slice(0, 3).map(p => \`\${p.token0_symbol}/\${p.token1_symbol}\`).join(", ")

  return (
    <main className="min-h-screen bg-slate-900 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">

        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm mb-4">
            <span>{chain}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
            Best Pools on {chain}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto text-pretty">
            Top liquidity pools on {chain} across the best DEXs: ${dexesStr}.
          </p>
        </header>

        <div className="bg-gradient-to-r from-emerald-500/10 via-slate-800 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">\${fmt(totalVolume)}</div>
              <div className="text-slate-400 text-sm">24h Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">\${fmt(totalTvl)}</div>
              <div className="text-slate-400 text-sm">Total TVL</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">\${fmt(totalFees)}</div>
              <div className="text-slate-400 text-sm">24h Fees</div>
            </div>
          </div>
          <p className="text-slate-300 text-center text-pretty">
            In the last 24 hours,{" "}
            <span className="text-emerald-400 font-semibold">\${fmt(totalFees)}</span> in fees
            were generated across the top {chain} pools, led by the pairs{" "}
            <span className="text-white font-medium">{topPairs}</span>.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Top 10 Pools by Volume</h2>
          <div className="space-y-3">
            {TOP_POOLS.map((pool, i) => (
              <PoolCard key={pool.pair_address} pool={pool} rank={i + 1} chain={chain} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">DeFi on {chain}</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-slate-300 space-y-4">
            <p>
              {chain} hosts some of the most important DEXs in the DeFi ecosystem.
              Liquidity pools allow providers to deposit token pairs and earn fees
              on every swap.
            </p>
            <p>
              The fees shown represent earnings generated in the last 24 hours.
              Pools with higher volume relative to their TVL tend to offer better returns,
              though they may carry higher impermanent loss risk.
            </p>
            <p>
              Explore each DEX individually to see their specific pools and find
              the best liquidity opportunities on {chain}.
            </p>
          </div>
        </section>

      </div>
    </main>
  )
}
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Crosses dex name (key from allCombinations) with the dex_id of the first pool
// in each entry to build Record<dex_id, label> dynamically.
function buildDexIdLabels(
  allCombinations: AllCombinations,
  topPoolsData: TopPoolsData,
): Record<number, string> {
  const map: Record<number, string> = {};

  for (const [chain, dexes] of Object.entries(allCombinations)) {
    for (const dex of dexes) {
      const firstPool = topPoolsData.chains?.[chain]?.dexes?.[dex]?.[0];
      if (firstPool && !(firstPool.dex_id in map)) {
        map[firstPool.dex_id] = DEX_LABELS[dex] ?? toPascalCase(dex);
      }
    }
  }

  return map;
}

async function main() {
  console.log("\n🔄  Fetching data from Supabase...\n");

  const [allCombinations, topPoolsData] = await Promise.all([
    fetchTableData<AllCombinations>("all_combinations"),
    fetchTableData<TopPoolsData>("top_pools_by_chain_dex"),
  ]);

  const dexIdLabels = buildDexIdLabels(allCombinations, topPoolsData);
  console.log(`🗺️   DEX ID map: ${JSON.stringify(dexIdLabels)}\n`);

  const BASE_DIR   = "./dynamicContent/best-pools/";
  await ensureDir(BASE_DIR);

  for (const [chain, dexes] of Object.entries(allCombinations)) {
    const chainDir  = join(BASE_DIR, chain);
    const chainData = topPoolsData.chains?.[chain];
    await ensureDir(chainDir);

    if (!chainData) {
      console.warn(`  ⚠️   No data for chain '${chain}' — skipping`);
      continue;
    }

    // Parent page (chain)
    const parentPools = chainData.top_pools ?? [];
    if (parentPools.length > 0) {
      const component = `BestPools${toPascalCase(chain)}`;
      const filePath  = join(chainDir, "index.tsx");

      await Deno.writeTextFile(filePath, generateParentPage(chain, parentPools, dexes, dexIdLabels));
    }

    // Child pages (chain + dex)
    for (const dex of dexes) {
      const dexPools = chainData.dexes?.[dex] ?? [];
      if (dexPools.length === 0) {
        console.warn(`  ⚠️   No pools for ${chain}/${dex} — skipping`);
        continue;
      }

      const filePath  = join(chainDir, `${dex}.tsx`);

      await Deno.writeTextFile(filePath, generateChildPage(chain, dex, dexPools, dexIdLabels));
    }
  }  
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  Deno.exit(1);
});

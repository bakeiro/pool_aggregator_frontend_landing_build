import{j as e}from"./index-RS4R0wWz.js";import{M as t,r as l,a as u,h as d,o as c}from"./one-dark-DhICR5IX.js";const b={title:"Error en los calculadores de Uniswap V3: por qué Poolfish y DeFiLabs muestran datos incorrectos y qué usar en su lugar",slug:"big-error-uniswap-v3-calculators",date:"2026-03-03",description:"Grandes errores en las calculadores de uniswap v3",author:"PoolMaster",cover:"/images/my-article/portada.jpg",lang:"es"},m=`
# Error en los calculadores de Uniswap V3: por qué Poolfish y DeFiLabs muestran datos incorrectos y qué usar en su lugar

> **TL;DR:** Una actualización de TheGraph en junio de 2024 desincronizó los datos que usan Poolfish y DeFiLabs. Más de un año después, ambas herramientas siguen mostrando cifras erróneas sin ningún aviso a sus usuarios. En este artículo te explicamos qué ocurrió, cuánto se desvían los datos y qué alternativas usar.

---

## ¿Para qué sirven los calculadores de Uniswap V3?

Si alguna vez has aportado liquidez en Uniswap V3, sabes que no es tan sencillo como en V2. En V3 tienes que elegir un rango de precios, decidir cuánto capital aportar y estimar qué comisiones podrías generar. Para facilitar esa toma de decisiones, existen los **calculadores de pools**: herramientas que, introduciendo el par de tokens y el rango elegido, te muestran una estimación de las comisiones que podrías ganar.

Son, en resumen, la herramienta más básica e importante antes de invertir en Pools. El problema es que dos de las más populares llevan más de un año dándote **datos completamente falsos y casi nadie se habia dado cuenta**.

---

## El origen del problema: TheGraph y su actualización silenciosa

Para entender qué falló, primero hay que entender cómo obtienen los datos estas herramientas.

Consultar la blockchain directamente es costoso y complejo. Por eso existe **[TheGraph](https://thegraph.com)**: un protocolo que indexa datos on-chain y los sirve a través de una API llamada *subgraph*. Cualquier aplicación puede hacer una consulta y obtener al instante el TVL de un pool, su volumen, las comisiones acumuladas... todo sin coste y sin tener que procesar los bloques manualmente.

Poolfish y DeFiLabs utilizan este sistema. El inconveniente es que en **[junio de 2024](https://github.com/DefiLab-xyz/uniswap-v3-simulator/issues/2)**, una actualización en la infraestructura de TheGraph provocó una desincronización en el subgraph oficial de Uniswap V3. Desde entonces, los datos que devuelve este subgraph son incorrectos.

Lo grave no es el fallo en sí — los bugs existen. Lo grave es lo que ocurrió después: **ni Poolfish ni DeFiLabs publicaron ningún comunicado**, no avisaron a sus usuarios y, a día de hoy, siguen consumiendo ese subgraph roto como si nada hubiera pasado.

---

## ¿Cuánto se desvían los datos? El tamaño real del problema

Veamos un ejemplo concreto comparando los datos que muestran ambas herramientas frente a los datos reales de la propia interfaz de Uniswap:

![defilabs](/images_blog/defilabs.png)
![poolfish](/images_blog/poolfish.png)
![uniswap](/images_blog/uniswap.png)

| Herramienta     | TVL    | Volumen (24h) | Fees estimadas |
|-----------------|--------|---------------|----------------|
| **Poolfish**    | ~12M   | ~690K         | ~$345          |
| **DeFiLabs**    | ~12M   | ~220K         | ~$113          |
| **Uniswap (real)** | ~730K | ~323K      | ~$150          |

"Solo" <span style="background-color: #00c951">**11 millones de diferencia en TVL**</span> Nada importante xd.

El sarcasmo aparte: si estás evaluando si entrar en un pool con $10.000 y la herramienta te muestra un TVL 16 veces mayor al real, tu cálculo de participación en el pool —y por tanto tu estimación de fees— estará completamente **erroneo**. **Las fees que muestra Poolfish son el doble de las reales.** Eso no es un margen de error, es una decisión de inversión basada en datos inventados.

Y lo más llamativo: este error lleva **más de un año activo**, sin que ningún influencer ni creador de contenido DeFi en español haya levantado la mano para avisarlo. Al contrario, siguen haciendo tutoriales con estas herramientas como si todo funcionara correctamente.

---

## Cómo verificar los datos tú mismo

La forma más directa de comprobar si los datos son correctos es ir directamente a la fuente: la interfaz oficial de **Uniswap**, **PancakeSwap** o cualquier DEX donde opere el pool que te interesa. Allí verás el TVL y el volumen real sin intermediarios.

El problema es que hacerlo pool por pool, comparando manualmente, consume muchísimo tiempo. Por suerte, existen herramientas que hacen ese trabajo de forma fiable.

---

## Alternativas que sí funcionan

### Metrix.finance
Una herramienta veterana, bien conocida en la comunidad DeFi. Sus datos son fiables y lleva tiempo siendo referencia para los LP managers más serios. El inconveniente es que su interfaz no es la más intuitiva, puede ir lenta en momentos de alta demanda y tiene un coste de **$50 al mes** la versión pro, lo que puede ser un filtro importante para usuarios retail.

<!-- Insertar captura de Metrix.finance aquí -->
![metrix.finance](/images_blog/metrix.finance.png)

### PoolMaster.io
La alternativa más reciente y, probablemente, la más interesante para la mayoría de usuarios. Su propuesta diferencial es que **agrupa los pools por par de tokens**, permitiéndote ver ese mismo par en distintas plataformas (Uniswap, PancakeSwap, etc.) en una sola vista — algo que, sorprendentemente, ninguna herramienta había hecho antes de forma clara.

La herramienta es **100% gratuita** en su versión base, y dispone de un plan PRO para usuarios avanzados.

<!-- Insertar captura de PoolMaster.io aquí -->
![poolmaster](/images_blog/poolmaster.png)

> 💡 **Descuento exclusivo:** Si quieres probar PoolMaster PRO, puedes usar el cupón **\`POOLMASTER_STARTER\`** para obtener un **25% de descuento**.

---

## Conclusión

Los calculadores de liquidez son una herramienta fundamental en DeFi, pero solo son útiles si los datos que muestran son reales. Poolfish y DeFiLabs llevan más de un año mostrando cifras erróneas gracias a un subgraph desincronizado, sin avisar a sus usuarios ni corregir el problema.

Antes de tomar cualquier decisión de inversión en Uniswap V3, verifica siempre los datos en la fuente original o usa herramientas que no dependan del subgraph afectado.

Si este artículo te ha resultado útil, compártelo — hay mucha gente tomando decisiones con datos falsos sin saberlo.

---

## Fuentes y referencias

- [Código fuente Uniswap V3 Info — poolData.ts (línea 198)](https://github.com/Uniswap/v3-info/blob/62bdb510d23996a3341a1c85cac92aa66b83d524/src/data/pools/poolData.ts#L198)
- [Código fuente Uniswap V3 Info — chartData.ts (línea 96)](https://github.com/Uniswap/v3-info/blob/0aaee3886cb944159d51043d23f56165132ffc06/src/data/pools/chartData.ts#L96)
- [Issue abierto en el repositorio de DeFiLabs](https://github.com/DefiLab-xyz/uniswap-v3-simulator/issues/2)`,p={code({node:o,inline:s,className:a,children:n,...r}){const i=/language-(\w+)/.exec(a||"");return!s&&i?e.jsx(d,{style:c,language:i[1],PreTag:"div",...r,children:String(n).replace(/\n$/,"")}):e.jsx("code",{className:a,...r,children:n})},img({src:o,alt:s,...a}){return e.jsx("img",{src:o,alt:s,loading:"lazy",style:{maxWidth:"100%",height:"auto",borderRadius:8},...a})}};function f(){return e.jsx("article",{className:"prose prose-lg max-w-none dark:prose-invert",children:e.jsx(t,{remarkPlugins:[u],rehypePlugins:[l],components:p,children:m})})}export{f as default,b as meta};

import publications from "../content/publications.json";
import pages from "../content/pages.json";
import academics from "../content/academics.json";
import boards from "../content/boards.json";
import site from "../content/site.json";
import type { RecordEntry, PageData, EntrySummary } from "./types";

const all = [
  ...publications,
  ...pages,
  ...academics,
  ...boards,
] as RecordEntry[];
const summarize = (record: RecordEntry): EntrySummary => {
  const { body, ...summary } = record;
  return summary;
};
const configs: Record<string, [string, string, string]> = {
  "/": ["home", "ABAMEV", site.description],
  "/academia/simbolos": [
    "symbols",
    "Símbolos",
    "A bandeira, o bóton e a medalha que representam a identidade e a tradição da ABAMEV.",
  ],
  "/academia/diretorias": [
    "boards",
    "Diretorias",
    "As gestões que ajudaram a construir a trajetória da Academia desde 1999.",
  ],
  "/academicos/cadeiras": [
    "academics",
    "Cadeiras e patronos",
    "Conheça os acadêmicos titulares e os patronos que dão nome a cada cadeira da Academia.",
  ],
  "/academicos/honorarios": [
    "members",
    "Membros honorários",
    "Personalidades reconhecidas por sua contribuição ao conhecimento e ao desenvolvimento da Medicina Veterinária.",
  ],
  "/academicos/correspondentes": [
    "members",
    "Membros correspondentes",
    "Contribuições e vínculos científicos que ampliam os horizontes da Academia.",
  ],
  "/academicos/falecidos": [
    "members",
    "Acadêmicos falecidos",
    "Em memória dos acadêmicos que ajudaram a construir a história da ABAMEV.",
  ],
  "/homenagens/agraciados": [
    "honors",
    "Agraciados",
    "Solenidades e personalidades reconhecidas pela Academia por sua contribuição à Medicina Veterinária na Bahia.",
  ],
  "/publicacoes": [
    "publications",
    "Publicações",
    "Artigos, livros e documentos sobre a história e o desenvolvimento da Medicina Veterinária.",
  ],
  "/noticias": [
    "news",
    "Notícias e vídeos",
    "Solenidades, encontros, palestras e acontecimentos da vida da Academia.",
  ],
  "/noticias/videos": [
    "videos",
    "Vídeos e palestras",
    "Palestras, entrevistas e encontros para assistir e revisitar.",
  ],
  "/noticias/eventos": [
    "events",
    "Eventos",
    "Encontros e solenidades promovidos ou acompanhados pela Academia.",
  ],
  "/busca": [
    "search",
    "Buscar",
    "Pesquise publicações, acadêmicos, documentos e notícias da ABAMEV.",
  ],
  "/404": [
    "404",
    "Página não encontrada",
    "Encontre publicações e documentos pela busca do site.",
  ],
};
export function getPage(path: string): PageData | null {
  const entry = all.find((x) => x.path === path);
  if (entry)
    return {
      path,
      title: entry.title,
      description: entry.summary.slice(0, 260),
      kind: "detail",
      entry,
      entries: all
        .filter((x) => x.id !== entry.id && x.category === entry.category)
        .slice(0, 3)
        .map(summarize),
      selected: [],
    };
  const config = configs[path];
  if (!config) return null;
  const [kind, title, description] = config;
  let entries: RecordEntry[] = [];
  if (kind === "publications")
    entries = all.filter((x) => x.path.startsWith("/publicacoes/"));
  if (kind === "news")
    entries = all.filter(
      (x) => x.path.startsWith("/noticias/") || x.id === "141",
    );
  if (kind === "events")
    entries = all.filter(
      (x) => x.categories.includes("Eventos") || x.id === "141",
    );
  if (kind === "videos") entries = all.filter((x) => x.videos.length);
  if (kind === "academics")
    entries = all.filter((x) => x.chair).sort((a, b) => a.chair! - b.chair!);
  if (kind === "members")
    entries = all.filter((x) =>
      path.endsWith("honorarios")
        ? x.categories.includes("Membros Honorários")
        : path.endsWith("correspondentes")
          ? x.categories.includes("Correspondentes")
          : x.categories.includes("Acadêmicos Falecidos"),
    );
  if (kind === "boards")
    entries = all
      .filter((x) => x.boardNumber)
      .sort((a, b) => b.boardNumber! - a.boardNumber!);
  if (kind === "symbols")
    entries = all.filter((x) => ["27", "28", "29"].includes(x.id));
  if (kind === "honors")
    entries = all.filter(
      (x) => x.path.startsWith("/homenagens/") && !x.id.startsWith("category-"),
    );
  if (["publications", "news", "events", "videos", "honors"].includes(kind))
    entries.sort((a, b) =>
      (b.sourcePublishedAt || "").localeCompare(a.sourcePublishedAt || ""),
    );
  const selectedIds = kind === "home"
    ? [site.home.heroId, ...site.home.academicIds, ...site.home.publicationIds, ...site.home.newsIds, ...site.home.videoIds]
    : [];
  const selected = all
    .filter((x) => selectedIds.includes(x.id))
    .map((x) => ({ ...x, body: "" }));
  return {
    path,
    kind,
    title,
    description,
    entries: entries.map(summarize),
    selected,
  };
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "./Navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
} from "./Icons";
import { Card, normalize, PersonCard, TextLink } from "./Content";
import { SearchForm } from "./Shell";
import type { PageData, EntrySummary } from "../types";
import s from "../styles/site.module.css";

const tabGroups: Record<string, [string, string][]> = {
  "/academicos": [
    ["Cadeiras e patronos", "/academicos/cadeiras"],
    ["Membros honorários", "/academicos/honorarios"],
    ["Correspondentes", "/academicos/correspondentes"],
    ["Acadêmicos falecidos", "/academicos/falecidos"],
  ],
  "/noticias": [
    ["Todas", "/noticias"],
    ["Vídeos e palestras", "/noticias/videos"],
    ["Eventos", "/noticias/eventos"],
  ],
};
const memberRole: Record<string, string> = {
  "/academicos/honorarios": "Membro honorário",
  "/academicos/correspondentes": "Membro correspondente",
};

function PageHeader({ data }: { data: PageData }) {
  const group = Object.keys(tabGroups).find(
    (prefix) => data.path === prefix || data.path.startsWith(`${prefix}/`),
  );
  const tabsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = tabsRef.current;
    const active = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !active) return;
    nav.scrollLeft =
      active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [data.path]);
  return (
    <div className={s.pageHero}>
      <div className={s.container}>
        <header className={s.pageHeader}>
          <h1>{data.title}</h1>
          {data.path !== "/academicos/falecidos" && <p>{data.description}</p>}
        </header>
        {group && (
          <nav aria-label="Seções" className={s.tabs} ref={tabsRef}>
            {tabGroups[group].map(([label, path]) => (
              <Link
                key={path}
                to={path}
                aria-current={path === data.path ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function Chair({ item }: { item: EntrySummary }) {
  const photo = item.occupant ? item.images[1] || item.images[0] : null;
  return (
    <PersonCard
      item={item}
      badge={`Cadeira ${String(item.chair).padStart(2, "0")}`}
      photo={photo}
      role={item.occupant ? "Acadêmico titular" : `Cadeira nº ${item.chair}`}
      name={
        item.occupant ||
        (item.vacancyInSource ? "Cadeira vaga" : "Ocupante não informado")
      }
      note={
        item.patron ? (
          <>
            Patrono: <strong>{item.patron}</strong>
          </>
        ) : undefined
      }
    />
  );
}

function FilteredCollection({ data }: { data: PageData }) {
  const [params, setParams] = useSearchParams();
  const chairs = data.kind === "academics";
  const query = params.get("q") || "",
    category = params.get("assunto") || "",
    format = params.get("formato") || "",
    year = params.get("ano") || "";
  const categories = [...new Set(data.entries.map((x) => x.category))].sort();
  const formats = [...new Set(data.entries.map((x) => x.format))].sort();
  const years = [
    ...new Set(
      data.entries.map((x) => x.sourcePublishedAt?.slice(0, 4)).filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  const numericChair = chairs
    ? query.trim().match(/^(?:cadeira\s*(?:n[º°o.]?\s*)?)?(\d+)$/i)
    : null;
  const filtered = data.entries.filter(
    (x) =>
      (!query ||
        (numericChair
          ? x.chair === Number(numericChair[1])
          : normalize(
              `${x.title} ${x.summary} ${x.occupant || ""} ${x.patron || ""} ${x.chair || ""}`,
            ).includes(normalize(query)))) &&
      (!category || x.category === category) &&
      (!format || x.format === format) &&
      (!year || x.sourcePublishedAt?.startsWith(year)),
  );
  const perPage = chairs ? 40 : 12;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = Math.max(1, Math.min(pages, Number(params.get("pagina")) || 1));
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "pagina") next.delete("pagina");
    setParams(next, { replace: key === "q", preventScrollReset: true });
  }
  return (
    <>
      <div className={s.filters}>
        <label className={s.filterSearch}>
          <Search size={19} />
          <input
            aria-label={
              chairs ? "Buscar por nome ou cadeira" : "Buscar nesta página"
            }
            placeholder={
              chairs
                ? "Nome, patrono ou número da cadeira"
                : "Buscar por título ou assunto"
            }
            value={query}
            onChange={(e) => change("q", e.target.value)}
          />
        </label>
        {!chairs && (
          <>
            {categories.length > 1 && (
              <label className={s.selectLabel}>
                <span>Assunto</span>
                <select
                  value={category}
                  onChange={(e) => change("assunto", e.target.value)}
                >
                  <option value="">Todos</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {formats.length > 1 && (
              <label className={s.selectLabel}>
                <span>Formato</span>
                <select
                  value={format}
                  onChange={(e) => change("formato", e.target.value)}
                >
                  <option value="">Todos</option>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f === "Documento" ? "PDF" : f}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {years.length > 1 && (
              <label className={s.selectLabel}>
                <span>Ano</span>
                <select
                  value={year}
                  onChange={(e) => change("ano", e.target.value)}
                >
                  <option value="">Todos</option>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
        {(query || category || format || year) && (
          <button
            className={s.clearFilters}
            onClick={() => setParams({}, { preventScrollReset: true })}
          >
            Limpar filtros
          </button>
        )}
      </div>
      <p className={s.resultSummary} role="status">
        {filtered.length}{" "}
        {chairs
          ? filtered.length === 1
            ? "cadeira"
            : "cadeiras"
          : filtered.length === 1
            ? "resultado"
            : "resultados"}
      </p>
      {filtered.length ? (
        <div className={chairs ? s.personGrid : s.cardGrid}>
          {filtered
            .slice((page - 1) * perPage, page * perPage)
            .map((item) =>
              chairs ? (
                <Chair key={item.id} item={item} />
              ) : (
                <Card key={item.id} item={item} />
              ),
            )}
        </div>
      ) : (
        <div className={s.empty}>
          <Search size={32} strokeWidth={1.4} />
          <h2>Nenhum resultado encontrado.</h2>
          <p>Tente outro termo ou remova os filtros selecionados.</p>
        </div>
      )}
      {pages > 1 && (
        <nav className={s.pagination} aria-label="Paginação">
          <button
            aria-label="Página anterior"
            disabled={page === 1}
            onClick={() => change("pagina", String(page - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              aria-label={`Página ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={p === page ? s.currentPage : ""}
              onClick={() => change("pagina", String(p))}
            >
              {p}
            </button>
          ))}
          <button
            aria-label="Próxima página"
            disabled={page === pages}
            onClick={() => change("pagina", String(page + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </>
  );
}

type SearchEntry = {
  id: string;
  title: string;
  path: string;
  category: string;
  text: string;
  summary: string;
};
function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/search-index.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("search");
        return r.json();
      })
      .then(setIndex)
      .catch((e) => {
        if (e.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, []);
  const results = useMemo(
    () =>
      index?.filter((x) =>
        normalize(query)
          .split(/\s+/)
          .filter(Boolean)
          .every((term) =>
            normalize(`${x.title} ${x.category} ${x.text}`).includes(term),
          ),
      ) || [],
    [index, query],
  );
  const pages = Math.max(1, Math.ceil(results.length / 12));
  const page = Math.max(1, Math.min(pages, Number(params.get("pagina")) || 1));
  return (
    <>
      <SearchForm initial={query} />
      <div className={s.searchResults} aria-live="polite">
        {!query ? (
          <div className={s.empty}>
            <BookOpen size={34} strokeWidth={1.4} />
            <h2>O que você procura?</h2>
            <p>Busque por um nome, assunto, publicação ou documento.</p>
            <div className={s.searchSuggestions}>
              {["Hans Merkt", "Estatuto", "História", "Vacinas"].map((q) => (
                <Link key={q} to={`/busca?q=${encodeURIComponent(q)}`}>
                  {q} <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        ) : failed ? (
          <p className={s.resultSummary}>
            Não foi possível carregar a busca. Recarregue esta página para
            tentar novamente.
          </p>
        ) : !index ? (
          <p className={s.resultSummary}>Carregando…</p>
        ) : (
          <>
            <p className={s.resultSummary}>
              {results.length}{" "}
              {results.length === 1 ? "resultado" : "resultados"} para “{query}”
            </p>
            {!results.length && (
              <div className={s.empty}>
                <Search size={30} strokeWidth={1.4} />
                <h2>Nenhum resultado encontrado.</h2>
                <p>Tente um termo mais curto ou outro assunto.</p>
              </div>
            )}
            <div className={s.searchList}>
              {results.slice((page - 1) * 12, page * 12).map((r) => (
                <Link key={r.id} to={r.path} className={s.searchResult}>
                  <span className={s.eyebrow}>{r.category}</span>
                  <h2>{r.title}</h2>
                  <p>{r.summary}</p>
                  <ArrowUpRight size={20} className={s.searchArrow} />
                </Link>
              ))}
            </div>
            {pages > 1 && (
              <div className={s.pagination}>
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setParams({ q: query, pagina: String(page - 1) })
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Página {page} de {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() =>
                    setParams({ q: query, pagina: String(page + 1) })
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function Landing({ data }: { data: PageData }) {
  const k = data.kind;
  let content;
  if (k === "search") content = <SearchPage />;
  else if (k === "404")
    content = (
      <div className={s.empty}>
        <BookOpen size={36} strokeWidth={1.3} />
        <h2>Há outras histórias para descobrir.</h2>
        <p>
          O endereço pode ter mudado. Use a busca para encontrar o que procura.
        </p>
        <TextLink to="/busca">Buscar no site</TextLink>
      </div>
    );
  else if (k === "boards")
    content = (
      <div className={s.boards}>
        {data.entries.map((item) => (
          <Link key={item.id} to={item.path}>
            <span className={s.boardNumber}>
              {String(item.boardNumber).padStart(2, "0")}
            </span>
            <div>
              <h2>{item.boardNumber}ª Diretoria</h2>
              {item.positions?.find((p) =>
                p.role.toLowerCase().includes("presidente"),
              ) && (
                <p>
                  Presidente:{" "}
                  <strong>
                    {
                      item.positions.find((p) =>
                        p.role.toLowerCase().includes("presidente"),
                      )!.name
                    }
                  </strong>
                </p>
              )}
            </div>
            <span className={s.boardArrow}>
              <ArrowRight size={20} />
            </span>
          </Link>
        ))}
      </div>
    );
  else if (k === "symbols")
    content = (
      <div className={s.symbolGrid}>
        {data.entries.map((item) => (
          <article key={item.id} className={s.symbol}>
            <div className={s.symbolMedia}>
              {item.cover && <img src={item.cover.src} alt="" loading="lazy" />}
            </div>
            <h2>
              <Link to={item.path} className={s.stretchedLink}>
                {item.title}
              </Link>
            </h2>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    );
  else if (k === "members")
    content = (
      <div className={s.personGrid}>
        {data.entries.map((item) => (
          <PersonCard
            key={item.id}
            item={item}
            photo={item.cover}
            role={memberRole[data.path]}
            name={item.title}
          />
        ))}
      </div>
    );
  else if (k === "honors")
    content = (
      <div className={s.cardGrid}>
        {data.entries.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
    );
  else content = <FilteredCollection data={data} />;
  return (
    <>
      <PageHeader data={data} />
      <div className={`${s.container} ${s.landing}`}>{content}</div>
    </>
  );
}

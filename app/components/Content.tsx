import { Children, isValidElement, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Link } from "./Navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Play,
  Download,
  ExternalLink,
  Check,
  Printer,
  Share2,
  UsersRound,
} from "./Icons";
import type { EntrySummary, RecordEntry } from "../types";
import redirects from "../../content/redirects.json";
import s from "../styles/site.module.css";

export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const dateLabel = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Bahia",
      }).format(new Date(value))
    : "";
export const headingId = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const childrenText = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) =>
      isValidElement(child)
        ? childrenText((child.props as { children?: ReactNode }).children)
        : String(child),
    )
    .join("");
const plainText = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>|\\]/g, "");
const compact = (text: string) => normalize(text).replace(/[^a-z0-9]/g, "");
const genericSummaries = [
  "Documento disponível para leitura em PDF.",
  "Assista ao vídeo.",
];
const TOC_MAX = 60;

// Lazy images above the target would load mid-scroll and push it down, so load them first.
async function scrollToAnchor(e: MouseEvent, href: string) {
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  e.preventDefault();
  const pending = [
    ...document.querySelectorAll<HTMLImageElement>("main img"),
  ].filter(
    (img) =>
      !img.complete &&
      img.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  pending.forEach((img) => (img.loading = "eager"));
  if (pending.length)
    await Promise.race([
      Promise.all(pending.map((img) => img.decode().catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(history.state, "", href);
}

/** Rótulo de tipo exibido nos cartões, de acordo com a seção do conteúdo. */
export function kindOf(item: EntrySummary) {
  if (item.videos.length)
    return { label: "Vídeo", cta: "Assistir", Icon: Play };
  if (item.format === "Documento")
    return { label: "PDF", cta: "Abrir documento", Icon: FileText };
  if (item.path.startsWith("/homenagens/"))
    return { label: "Homenagem", cta: "Saiba mais", Icon: BookOpen };
  if (item.path.startsWith("/noticias/"))
    return {
      label: item.category === "Eventos" ? "Evento" : "Notícia",
      cta: "Ler notícia",
      Icon: BookOpen,
    };
  if (item.path.startsWith("/academia/simbolos/"))
    return { label: "Símbolo", cta: "Saiba mais", Icon: BookOpen };
  if (item.path.startsWith("/academicos/"))
    return { label: "Acadêmico", cta: "Conhecer trajetória", Icon: UsersRound };
  return { label: "Artigo", cta: "Ler artigo", Icon: BookOpen };
}

export function TextLink({
  to,
  children,
  light = false,
}: {
  to: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link to={to} className={`${s.textLink} ${light ? s.lightLink : ""}`}>
      {children}
      <ArrowRight size={18} />
    </Link>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  to,
  link = "Ver todos",
}: {
  eyebrow?: string;
  title: string;
  to?: string;
  link?: string;
}) {
  return (
    <div className={s.sectionHeading}>
      <div>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {to && <TextLink to={to}>{link}</TextLink>}
    </div>
  );
}

export function Card({
  item,
  compact: small = false,
}: {
  item: EntrySummary;
  compact?: boolean;
}) {
  const image = item.cover && !item.chair ? item.cover : null;
  const { label, cta, Icon } = kindOf(item);
  const isVideo = label === "Vídeo";
  const isPdf = label === "PDF";
  return (
    <article className={s.card}>
      <div className={s.cardMedia} aria-hidden="true">
        {image ? (
          <>
            <img
              src={image.src}
              alt=""
              loading="lazy"
              width={image.width}
              height={image.height}
            />
            {isVideo && (
              <span className={s.cardPlay}>
                <Play size={18} fill="currentColor" />
              </span>
            )}
          </>
        ) : (
          <div
            className={s.cardCover}
            data-cover={isVideo ? "video" : isPdf ? "pdf" : "editorial"}
          >
            <span>
              <Icon
                size={36}
                strokeWidth={1.35}
                fill={isVideo ? "currentColor" : "none"}
              />
            </span>
          </div>
        )}
      </div>
      <div className={s.cardBody}>
        <div className={s.cardMeta}>
          <span className={s.cardType}>
            <span>
              <Icon size={15} strokeWidth={1.8} />
            </span>
            {label}
          </span>
          {item.sourcePublishedAt && (
            <time dateTime={item.sourcePublishedAt}>
              {item.sourcePublishedAt.slice(0, 4)}
            </time>
          )}
        </div>
        <h3 className={s.cardTitle}>
          <Link to={item.path} className={s.stretchedLink}>
            {item.title}
          </Link>
        </h3>
        {!small && !genericSummaries.includes(item.summary) && (
          <p className={s.cardExcerpt}>{item.summary}</p>
        )}
        <span className={s.cardMore} aria-hidden="true">
          {cta}
          <ArrowRight size={17} />
        </span>
      </div>
    </article>
  );
}

export function PersonCard({
  item,
  role,
  badge,
  photo,
  name,
  note,
}: {
  item: EntrySummary;
  role?: string;
  badge?: string;
  photo?: { src: string } | null;
  name: string;
  note?: ReactNode;
}) {
  return (
    <article className={s.person}>
      <div className={s.personPhoto}>
        {photo ? (
          <img src={photo.src} alt="" loading="lazy" />
        ) : (
          <span className={s.personPlaceholder}>
            <UsersRound size={34} strokeWidth={1.3} />
          </span>
        )}
        {badge && <span className={s.personBadge}>{badge}</span>}
      </div>
      <div className={s.personBody}>
        {role && <span className={s.personRole}>{role}</span>}
        <h2>
          <Link to={item.path} className={s.stretchedLink}>
            {name}
          </Link>
        </h2>
        {note && <p>{note}</p>}
      </div>
    </article>
  );
}

export function Video({ id, title }: { id: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={s.video}>
      {loaded ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setLoaded(true)} className={s.videoGate}>
          <span className={s.videoGateIcon}>
            <Play size={30} fill="currentColor" />
          </span>
          <strong>Assistir ao vídeo</strong>
          <span>O player do YouTube será carregado ao clicar.</span>
        </button>
      )}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
      >
        Abrir no YouTube <ExternalLink size={14} />
      </a>
    </div>
  );
}

export function Markdown({ body }: { body: string }) {
  const used = new Map<string, number>();
  const byNode = new Map<number, string>();
  // ReactMarkdown may render twice per pass; cache by source offset so ids stay stable.
  const id = (
    text: string,
    node?: { position?: { start: { offset?: number } } },
  ) => {
    const key = node?.position?.start.offset;
    if (key !== undefined && byNode.has(key)) return byNode.get(key)!;
    const base = headingId(text);
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const result = count ? `${base}-${count}` : base;
    if (key !== undefined) byNode.set(key, result);
    return result;
  };
  return (
    <div className={s.prose}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children, node }) => (
            <h2 id={id(childrenText(children), node)}>{children}</h2>
          ),
          h3: ({ children, node }) => (
            <h3 id={id(childrenText(children), node)}>{children}</h3>
          ),
          p: ({ children, node }) => {
            const article = childrenText(children).match(/^Art\.?\s*\d+/i)?.[0];
            const anchor = article ? id(article, node) : undefined;
            return (
              <p id={anchor}>
                {article && (
                  <a
                    className={s.articlePermalink}
                    href={`#${anchor}`}
                    aria-label={`Link para ${article}`}
                  >
                    §
                  </a>
                )}
                {children}
              </p>
            );
          },
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ""} loading="lazy" />
          ),
          table: ({ children }) => (
            <div
              className={s.tableScroll}
              tabIndex={0}
              role="region"
              aria-label="Tabela"
            >
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) => {
            let to = href || "";
            try {
              const u = new URL(to);
              if (u.hostname.replace("www.", "") === "abamev.org.br")
                to = (redirects as Record<string, string>)[u.pathname] || to;
            } catch {
              /* Relative URL. */
            }
            return to.startsWith("/") ? (
              <a href={to}>{children}</a>
            ) : (
              <a href={to} target="_blank" rel="noreferrer">
                {children}
                <ExternalLink size={12} />
              </a>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

export function ShareButtons() {
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function notify(text: string, ok = true) {
    setToast({ text, ok });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3000);
  }
  async function share() {
    const url = window.location.href;
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    if (mobile && navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify(
        "Link da página copiado. Agora é só colar onde quiser compartilhar.",
      );
    } catch {
      notify(
        "Não foi possível copiar. Copie o endereço na barra do navegador.",
        false,
      );
    }
  }
  return (
    <div className={s.share}>
      <button onClick={share}>
        <Share2 size={16} />
        Compartilhar página
      </button>
      <button className={s.printButton} onClick={() => window.print()}>
        <Printer size={16} />
        Imprimir
      </button>
      <div
        className={`${s.toast} ${toast ? s.toastVisible : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            {toast.ok && (
              <span className={s.toastIcon}>
                <Check size={16} strokeWidth={2.5} />
              </span>
            )}
            {toast.text}
          </>
        )}
      </div>
    </div>
  );
}

export function Detail({
  entry,
  related,
}: {
  entry: RecordEntry;
  related: EntrySummary[];
}) {
  const dated =
    entry.sourcePublishedAt &&
    /^\/(publicacoes|noticias|homenagens)\//.test(entry.path) &&
    !entry.id.startsWith("category-");
  const leadKey = compact(entry.summary.replace(/…$/, "")).slice(0, 60);
  const showLead =
    !entry.chair &&
    leadKey.length > 0 &&
    !compact(plainText(entry.body.slice(0, 3000))).includes(leadKey);
  const headings = [...entry.body.matchAll(/^##\s+(.+)$/gm)]
    .filter((m) => !m[1].includes("!["))
    .map((m) =>
      m[1]
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[*_`]/g, "")
        .replace(/\\(.)/g, "$1"),
    );
  const toc = [
    ...(headings.length
      ? headings.map((h, i) => {
          const repeat = headings.slice(0, i).filter((x) => x === h).length;
          return {
            label: h,
            href: `#${headingId(h)}${repeat ? `-${repeat}` : ""}`,
          };
        })
      : [
          {
            label: entry.chair ? "Biografia" : entry.title,
            href: "#secao-conteudo",
          },
        ]),
    ...(entry.videos.length ? [{ label: "Vídeo", href: "#secao-video" }] : []),
    ...(entry.attachments.length
      ? [{ label: "Arquivos", href: "#secao-arquivos" }]
      : []),
    ...(related.length
      ? [{ label: "Leia também", href: "#secao-leia-tambem" }]
      : []),
  ];
  return (
    <>
      <div className={s.articleHero}>
        <div className={s.container}>
          <header className={s.articleHeader}>
            {entry.chair && (
              <p className={s.eyebrow}>
                Cadeira nº {String(entry.chair).padStart(2, "0")}
              </p>
            )}
            <h1>{entry.title}</h1>
            {showLead && <p className={s.articleLead}>{entry.summary}</p>}
            <div className={s.articleMeta}>
              {dated && (
                <time dateTime={entry.sourcePublishedAt!}>
                  <CalendarDays size={17} />
                  {dateLabel(entry.sourcePublishedAt)}
                </time>
              )}
              {entry.author && <span>Por {entry.author}</span>}
              <ShareButtons />
            </div>
          </header>
        </div>
      </div>
      <div className={`${s.container} ${s.articleLayout}`}>
        <aside className={s.articleAside}>
          <nav aria-label="Nesta página">
            <p className={s.eyebrow}>Nesta página</p>
            {toc.map((item) => (
              <a
                key={item.href}
                href={item.href}
                title={item.label.length > TOC_MAX ? item.label : undefined}
                onClick={(e) => scrollToAnchor(e, item.href)}
              >
                {item.label.length > TOC_MAX
                  ? `${item.label.slice(0, TOC_MAX).replace(/[\s,.;:–—-]+\S*$/, "")}…`
                  : item.label}
              </a>
            ))}
          </nav>
        </aside>
        <article id="secao-conteudo" className={s.articleBody}>
          {entry.chair && (
            <div className={s.chairInfo}>
              <div>
                <span>Patrono</span>
                <strong>{entry.patron || "Não informado"}</strong>
              </div>
              <div>
                <span>Acadêmico titular</span>
                <strong>
                  {entry.occupant ||
                    (entry.vacancyInSource ? "Cadeira vaga" : "Não informado")}
                </strong>
              </div>
            </div>
          )}
          {entry.empty ? (
            <div className={s.empty}>
              <BookOpen size={32} strokeWidth={1.4} />
              <h2>Biografia em preparação.</h2>
              <p>Em breve, mais informações sobre esta cadeira.</p>
            </div>
          ) : (
            <Markdown body={entry.body} />
          )}
          {entry.videos.length > 0 && (
            <div id="secao-video">
              {entry.videos.map((video) => (
                <Video key={video.id} {...video} />
              ))}
            </div>
          )}
          {entry.attachments.length > 0 && (
            <section id="secao-arquivos" className={s.attachments}>
              <h2>Arquivos</h2>
              {entry.attachments.map((a) => (
                <div key={a.id}>
                  <span className={s.attachmentIcon}>
                    <FileText size={22} strokeWidth={1.5} />
                  </span>
                  <span>
                    <strong>{entry.title}</strong>
                    <small>
                      {a.status === "recovered"
                        ? `PDF${a.bytes ? ` · ${(a.bytes / 1024 / 1024).toFixed(1)} MB` : ""}`
                        : "Disponível em link externo"}
                    </small>
                  </span>
                  {a.status === "recovered" ? (
                    <a href={a.src} target="_blank" rel="noreferrer">
                      Abrir PDF <Download size={17} />
                    </a>
                  ) : (
                    <a href={a.originalUrl} target="_blank" rel="noreferrer">
                      Abrir link <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}
        </article>
      </div>
      {related.length > 0 && (
        <section id="secao-leia-tambem" className={s.related}>
          <div className={s.container}>
            <SectionHeading eyebrow="Continue lendo" title="Leia também" />
            <div className={s.cardGrid}>
              {related.map((item) => (
                <Card key={item.id} item={item} compact />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent, TouchEvent } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Play,
} from "./Icons";
import { Card, SectionHeading } from "./Content";
import type { PageData } from "../types";
import site from "../../content/site.json";
import s from "../styles/site.module.css";

type Slide = { key: string; label: string; node: ReactNode };
const AUTOPLAY_MS = 7000;

function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const go = (next: number) => setIndex((next + count) % count);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const timer = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced, count]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  };
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className={`${s.carousel} ${paused || reduced ? s.carouselPaused : ""}`}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={s.carouselTrack}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className={s.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${count}: ${slide.label}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            {slide.node}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className={s.carouselControls}>
          <div className={s.carouselDots}>
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Mostrar destaque ${i + 1}: ${slide.label}`}
                aria-current={i === index}
                className={i === index ? s.dotActive : ""}
                onClick={() => go(i)}
              >
                {i === index && (
                  <span
                    key={index}
                    style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={s.carouselArrow}
            aria-label="Destaque anterior"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={s.carouselArrow}
            aria-label="Próximo destaque"
            onClick={() => go(index + 1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export function Home({ data }: { data: PageData }) {
  const byId = (id: string) => data.selected.find((x) => x.id === id);
  const pick = (ids: string[]) =>
    ids.map(byId).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const hero = byId(site.home.heroId)!;
  const institutional = site.home.institutionalSlide;
  const portraits = pick(site.home.academicIds)
    .map((x) => x.cover)
    .filter(Boolean);

  const slides: Slide[] = [
    {
      key: "hans-merkt",
      label: "Hans Merkt",
      node: (
        <article className={s.slideFeature}>
          <div className={s.slideFeatureText}>
            <p className={s.heroQuote}>
              “A Veterinária brasileira tem duas histórias: antes e depois de{" "}
              <em>Hans Merkt.</em>”
            </p>
            <p className={s.heroDescription}>
              Um legado que aproximou países e transformou o ensino da Medicina
              Veterinária.
            </p>
            <Link className={s.heroButton} to={hero.path}>
              Conheça o legado <ArrowRight size={18} />
            </Link>
          </div>
          <div className={s.heroFigure} aria-hidden="true">
            <img
              src="/media/hans-merkt-cutout.webp"
              alt=""
              width="555"
              height="816"
              fetchPriority="high"
            />
          </div>
          <div className={s.portraitCaption}>
            <span>Professor</span>
            <strong>Hans Merkt</strong>
            <small>Membro honorário da ABAMEV</small>
          </div>
        </article>
      ),
    },
    {
      key: "sociedade-brasileira",
      label: institutional.title,
      node: (
        <article className={s.slideInstitutions}>
          <h2>{institutional.title}</h2>
          <ul className={s.institutionLogos} aria-label="Marcas institucionais">
            {institutional.logos.map((logo) => (
              <li key={logo.label}>
                <div className={s.institutionMark}>
                  <img src={logo.image} alt={logo.name} decoding="async" />
                </div>
                <span aria-hidden="true">{logo.label}</span>
              </li>
            ))}
          </ul>
        </article>
      ),
    },
    ...site.heroSlides.map((slide) => ({
      key: slide.link,
      label: slide.title,
      node: (
        <article className={s.slideImage}>
          {slide.portraits ? (
            <div className={s.slidePortraits}>
              {slide.portraits.map((portrait) => (
                <img
                  key={portrait.image}
                  src={portrait.image}
                  alt={portrait.alt}
                  decoding="async"
                />
              ))}
            </div>
          ) : (
            <img
              className={
                slide.imageAlign === "right" ? s.slideImageRight : undefined
              }
              src={slide.image}
              alt={slide.alt}
              decoding="async"
            />
          )}
          <div className={s.slideImageText}>
            <h2>{slide.title}</h2>
            <p>{slide.text}</p>
            {slide.link.startsWith("https://") ? (
              <a
                className={`${s.heroButton} ${s.stretchedLink}`}
                href={slide.link}
                target="_blank"
                rel="noreferrer"
              >
                {slide.cta} <ArrowUpRight size={18} />
              </a>
            ) : (
              <Link className={`${s.heroButton} ${s.stretchedLink}`} to={slide.link}>
                {slide.cta} <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </article>
      ),
    })),
  ];

  const highlights = [
    {
      to: "/academia/historia",
      kicker: "A Academia",
      title: "Conheça a nossa história",
      text: "Da fundação, em 1999, aos dias de hoje: a trajetória da ABAMEV.",
      media: (
        <img
          src="/media/dc619a904a25f858.webp"
          alt=""
          loading="lazy"
          width="600"
          height="448"
        />
      ),
    },
    {
      to: "/documentos/estatuto",
      kicker: "Documentos",
      title: "Documentos institucionais",
      text: "Estatuto, regimento interno e as normas que orientam a Academia.",
      media: (
        <img
          src="/images/bandeira.webp"
          alt=""
          loading="lazy"
          width="854"
          height="598"
        />
      ),
    },
    {
      to: "/academicos/cadeiras",
      kicker: "Acadêmicos",
      title: "Cadeiras e patronos",
      text: "Os acadêmicos titulares e os patronos que dão nome a cada cadeira.",
      media: (
        <div className={s.portraitStack}>
          {portraits.map((p) => (
            <img key={p!.src} src={p!.src} alt="" loading="lazy" />
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <h1 className={s.srOnly}>
        ABAMEV — Academia Baiana de Medicina Veterinária
      </h1>
      <section
        className={`${s.container} ${s.heroSection}`}
        aria-label="Destaques"
      >
        <HeroCarousel slides={slides} />
      </section>

      <section
        className={`${s.container} ${s.highlights}`}
        aria-label="Conheça a Academia"
      >
        {highlights.map((item) => (
          <article key={item.to} className={s.highlight}>
            <div className={s.highlightMedia}>{item.media}</div>
            <div className={s.highlightBody}>
              <span className={s.eyebrow}>{item.kicker}</span>
              <h2>
                <Link to={item.to} className={s.stretchedLink}>
                  {item.title}
                </Link>
              </h2>
              <p>{item.text}</p>
              <span className={s.highlightArrow} aria-hidden="true">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className={`${s.container} ${s.homeSection}`}>
        <SectionHeading
          title="Publicações"
          to="/publicacoes"
          link="Ver todas as publicações"
        />
        <div className={s.cardGrid}>
          {pick(site.home.publicationIds).map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section
        className={`${s.container} ${s.homeSection}`}
        aria-label="Leituras em Destaque"
      >
        <SectionHeading title="Leituras em Destaque" />
        <div className={s.readingGrid}>
          {site.home.readingCards.map((item) => (
            <article
              key={item.link}
              className={`${s.readingCard} ${item.kind === "portrait" ? s.readingPortrait : s.readingBook}`}
            >
              <div className={s.readingImage}>
                <img src={item.image} alt={item.alt} loading="lazy" decoding="async" />
              </div>
              <div className={s.readingBody}>
                <span className={s.eyebrow}>{item.kicker}</span>
                <h3>
                  <a href={item.link} target="_blank" rel="noreferrer" className={s.stretchedLink}>
                    {item.title}
                    <span className={s.srOnly}> (abre no Google Drive em nova aba)</span>
                  </a>
                </h3>
                <p>{item.text}</p>
                <span className={s.readingAction} aria-hidden="true">
                  {item.cta} <ArrowUpRight size={17} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${s.container} ${s.homeSection}`}>
        <SectionHeading
          title="Notícias"
          to="/noticias"
          link="Ver todas as notícias"
        />
        <div className={s.newsList}>
          {pick(site.home.newsIds).map((item) => (
            <article key={item.id} className={s.newsItem}>
              {item.sourcePublishedAt && (
                <time className={s.newsDate} dateTime={item.sourcePublishedAt}>
                  <strong>
                    {new Date(item.sourcePublishedAt)
                      .toLocaleDateString("pt-BR", {
                        month: "short",
                        timeZone: "America/Bahia",
                      })
                      .replace(".", "")}
                  </strong>
                  <span>{item.sourcePublishedAt.slice(0, 4)}</span>
                </time>
              )}
              <div>
                <h3>
                  <Link to={item.path} className={s.stretchedLink}>
                    {item.title}
                  </Link>
                </h3>
                <p>{item.summary}</p>
              </div>
              <span className={s.newsArrow} aria-hidden="true">
                <ArrowUpRight size={20} />
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className={s.homeVideos}>
        <div className={s.container}>
          <SectionHeading
            title="Vídeos e Palestras"
            to="/noticias/videos"
            link="Ver todos os vídeos"
          />
          <div className={s.videoCards}>
            {pick(site.home.videoIds).map((item) => (
              <article key={item.id} className={s.videoCard}>
                <div className={s.videoArt}>
                  <span className={s.videoPlay}>
                    <Play size={22} fill="currentColor" />
                  </span>
                </div>
                <h3>
                  <Link to={item.path} className={s.stretchedLink}>
                    {item.title.replace(/^PALESTRA: |^LIVE - /, "")}
                  </Link>
                </h3>
                <span className={s.cardMore} aria-hidden="true">
                  Assistir <ArrowRight size={17} />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

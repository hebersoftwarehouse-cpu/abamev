import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Search,
  Menu,
  X,
  Youtube,
  Instagram,
} from "./Icons";
import site from "../../content/site.json";
import s from "../styles/site.module.css";

type NavChild = { label: string; path: string; text: string };
type NavItem = {
  label: string;
  prefix: string;
  path?: string;
  children?: NavChild[];
};

export const navigation: NavItem[] = [
  {
    label: "A Academia",
    prefix: "/academia",
    children: [
      {
        label: "Nossa história",
        path: "/academia/historia",
        text: "A fundação e a trajetória da ABAMEV",
      },
      {
        label: "Diretorias",
        path: "/academia/diretorias",
        text: "As gestões que construíram a Academia",
      },
      {
        label: "Símbolos",
        path: "/academia/simbolos",
        text: "Bandeira, bóton e medalha",
      },
    ],
  },
  {
    label: "Documentos",
    prefix: "/documentos",
    children: [
      {
        label: "Estatuto",
        path: "/documentos/estatuto",
        text: "Finalidades, composição e organização",
      },
      {
        label: "Regimento interno",
        path: "/documentos/regimento",
        text: "Normas de funcionamento da Academia",
      },
    ],
  },
  {
    label: "Acadêmicos",
    prefix: "/academicos",
    children: [
      {
        label: "Cadeiras e patronos",
        path: "/academicos/cadeiras",
        text: "Os titulares e seus patronos",
      },
      {
        label: "Membros honorários",
        path: "/academicos/honorarios",
        text: "Personalidades reconhecidas pela Academia",
      },
      {
        label: "Correspondentes",
        path: "/academicos/correspondentes",
        text: "Vínculos científicos além da Bahia",
      },
      {
        label: "Acadêmicos falecidos",
        path: "/academicos/falecidos",
        text: "Em memória dos nossos acadêmicos",
      },
    ],
  },
  {
    label: "Homenagens",
    prefix: "/homenagens",
    children: [
      {
        label: "Ordem do Mérito",
        path: "/homenagens/ordem-do-merito",
        text: "A mais alta comenda da Academia",
      },
      {
        label: "Jubileu de Ouro",
        path: "/homenagens/jubileu-de-ouro",
        text: "Cinquenta anos de profissão",
      },
      {
        label: "Agraciados",
        path: "/homenagens/agraciados",
        text: "Solenidades e personalidades homenageadas",
      },
    ],
  },
  { label: "Publicações", prefix: "/publicacoes", path: "/publicacoes" },
  { label: "Notícias e vídeos", prefix: "/noticias", path: "/noticias" },
];

export function Brand({
  onDark = false,
}: {
  onDark?: boolean;
}) {
  return (
    <Link
      to="/"
      className={`${s.brand} ${onDark ? s.brandOnDark : ""}`}
      aria-label="ABAMEV — início"
    >
      <img className={s.crest} src="/images/brands/abamev.png" alt="" width="230" height="234" />
      <span className={s.brandText}>
        <strong>ABAMEV</strong>
        <span>
          Academia Baiana de <br />
          Medicina Veterinária
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(location.pathname);
  const isActive = (prefix: string) =>
    location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);

  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
    if (previousPath.current !== location.pathname)
      document.getElementById("main")?.focus({ preventScroll: true });
    previousPath.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenu(null);
      setDrawerOpen((open) => {
        if (open) menuButton.current?.focus();
        return false;
      });
    };
    const onPointer = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const current = navigation.find(
      (item) => item.children && isActive(item.prefix),
    );
    setDrawerSection(current?.label ?? null);
    document.documentElement.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <header className={s.header}>
      <div className={s.utility}>
        <div className={s.container}>
          <span>Memória e conhecimento a serviço da Medicina Veterinária.</span>
          <a href={site.youtube} target="_blank" rel="noreferrer">
            <Youtube size={16} /> Nosso canal no YouTube{" "}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className={`${s.container} ${s.masthead}`}>
        <Brand />
        <span className={s.mastheadNote}>
          Ciência que conecta.
          <br />
          <em>História que permanece.</em>
        </span>
        <div className={s.mobileActions}>
          <Link to="/busca" className={s.iconButton} aria-label="Buscar">
            <Search size={20} />
          </Link>
          <button
            ref={menuButton}
            type="button"
            className={s.menuButton}
            aria-expanded={drawerOpen}
            aria-controls="mobile-menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </div>
      </div>
      <div className={s.navBar}>
        <div className={`${s.container} ${s.navWrap}`}>
          <nav
            ref={nav}
            aria-label="Navegação principal"
            className={s.navigation}
          >
            <ul>
              {navigation.map((item, i) => {
                const active = isActive(item.prefix);
                if (!item.children)
                  return (
                    <li key={item.label}>
                      <NavLink
                        to={item.path!}
                        className={`${s.navLink} ${active ? s.navActive : ""}`}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  );
                const open = openMenu === item.label;
                return (
                  <li key={item.label} className={s.navItem}>
                    <button
                      type="button"
                      className={`${s.navLink} ${active ? s.navActive : ""} ${open ? s.navOpen : ""}`}
                      aria-expanded={open}
                      aria-controls={`submenu-${i}`}
                      onClick={() => setOpenMenu(open ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={s.navChevron}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`submenu-${i}`}
                      className={`${s.dropdown} ${open ? s.dropdownOpen : ""}`}
                    >
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={({ isActive: current }) =>
                                current ? s.dropdownCurrent : ""
                              }
                            >
                              <strong>{child.label}</strong>
                              <span>{child.text}</span>
                              <ArrowRight
                                size={16}
                                className={s.dropdownArrow}
                                aria-hidden="true"
                              />
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link className={s.searchLink} to="/busca">
            <Search size={18} />
            <span>Buscar</span>
          </Link>
        </div>
      </div>

      <div
        className={`${s.drawerBackdrop} ${drawerOpen ? s.drawerBackdropOpen : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <div
        id="mobile-menu"
        className={`${s.drawer} ${drawerOpen ? s.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!drawerOpen}
      >
        <div className={s.drawerTop}>
          <Brand onDark />
          <button
            ref={closeButton}
            type="button"
            className={s.drawerClose}
            aria-label="Fechar menu"
            onClick={() => {
              setDrawerOpen(false);
              menuButton.current?.focus();
            }}
          >
            <X size={22} />
          </button>
        </div>
        <Form action="/busca" method="get" className={s.drawerSearch}>
          <Search size={18} />
          <input
            name="q"
            aria-label="Buscar no site"
            placeholder="Buscar no site"
          />
        </Form>
        <nav aria-label="Menu" className={s.drawerNav}>
          <ul>
            {navigation.map((item, i) => {
              if (!item.children)
                return (
                  <li key={item.label}>
                    <Link
                      to={item.path!}
                      className={`${s.drawerLink} ${isActive(item.prefix) ? s.drawerActive : ""}`}
                    >
                      {item.label}
                      <ArrowRight size={20} />
                    </Link>
                  </li>
                );
              const open = drawerSection === item.label;
              return (
                <li key={item.label} className={open ? s.drawerItemOpen : ""}>
                  <button
                    type="button"
                    className={`${s.drawerLink} ${isActive(item.prefix) ? s.drawerActive : ""}`}
                    aria-expanded={open}
                    aria-controls={`drawer-${i}`}
                    onClick={() => setDrawerSection(open ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown
                      size={22}
                      className={s.drawerChevron}
                      aria-hidden="true"
                    />
                  </button>
                  <div id={`drawer-${i}`} className={s.drawerPanel}>
                    <div>
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={({ isActive: current }) =>
                                current ? s.drawerCurrent : ""
                              }
                            >
                              <strong>{child.label}</strong>
                              <span>{child.text}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={s.drawerFoot}>
          <a href={site.youtube} target="_blank" rel="noreferrer">
            <Youtube size={18} /> Nosso canal no YouTube{" "}
            <ArrowUpRight size={14} />
          </a>
          <span>Salvador · Bahia · Desde 1999</span>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerTop}>
          <div className={s.footerBrand}>
            <Brand onDark />
            <p>
              Preservar a memória. Valorizar a ciência. Reconhecer quem faz a
              nossa história.
            </p>
          </div>
          <div>
            <h2>A Academia</h2>
            <Link to="/academia/historia">Nossa história</Link>
            <Link to="/academia/diretorias">Diretorias</Link>
            <Link to="/academia/simbolos">Símbolos</Link>
            <Link to="/documentos/estatuto">Estatuto</Link>
            <Link to="/documentos/regimento">Regimento interno</Link>
          </div>
          <div>
            <h2>Acadêmicos</h2>
            <Link to="/academicos/cadeiras">Cadeiras e patronos</Link>
            <Link to="/academicos/honorarios">Membros honorários</Link>
            <Link to="/academicos/correspondentes">Correspondentes</Link>
            <Link to="/academicos/falecidos">Acadêmicos falecidos</Link>
            <Link to="/homenagens/agraciados">Homenagens</Link>
          </div>
          <div>
            <h2>Conteúdo</h2>
            <Link to="/publicacoes">Publicações</Link>
            <Link to="/noticias">Notícias</Link>
            <Link to="/noticias/videos">Vídeos e palestras</Link>
            <Link to="/busca">Buscar no site</Link>
          </div>
          <div>
            <h2>Acompanhe</h2>
            <a href={site.youtube} target="_blank" rel="noreferrer">
              <Youtube size={18} /> YouTube <ArrowUpRight size={14} />
            </a>
            {site.instagram && (
              <a href={site.instagram} target="_blank" rel="noreferrer">
                <Instagram size={18} /> Instagram
              </a>
            )}
            <span className={s.footerPlace}>Salvador · Bahia · Brasil</span>
            <span className={s.footerSince}>Desde 9 de setembro de 1999</span>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>
            © {new Date().getFullYear()} Academia Baiana de Medicina
            Veterinária. Todos os direitos reservados.
          </span>
          <Link to="/privacidade">Privacidade</Link>
          <a href="#top">Voltar ao topo ↑</a>
        </div>
      </div>
    </footer>
  );
}

export function SearchForm({
  initial = "",
  autoFocus = false,
}: {
  initial?: string;
  autoFocus?: boolean;
}) {
  return (
    <Form action="/busca" method="get" className={s.bigSearch}>
      <Search size={22} />
      <input
        key={initial}
        name="q"
        aria-label="Buscar no site"
        placeholder="O que você procura?"
        defaultValue={initial}
        autoFocus={autoFocus}
      />
      <button type="submit">
        Buscar <ArrowRight size={18} />
      </button>
    </Form>
  );
}

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "react-router";
import { HelmetProvider } from "react-helmet-async";
import type { ReactNode } from "react";
import { Header, Footer } from "./components/Shell";
import "./styles/fonts.css";
import "./styles/global.css";
import s from "./styles/site.module.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#173f35" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Meta />
        <Links />
      </head>
      <body id="top">
        <a href="#main" className={s.skipLink}>
          Pular para o conteúdo
        </a>
        <HelmetProvider>{children}</HelmetProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function App() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <>
      <Header />
      <main id="main" className={`${s.container} ${s.errorPage}`}>
        <p className={s.eyebrow}>
          {missing
            ? "Página não encontrada"
            : "Não foi possível abrir esta página"}
        </p>
        <h1>
          {missing
            ? "Há outras histórias para descobrir."
            : "Tente novamente em instantes."}
        </h1>
        <p>
          {missing
            ? "O endereço pode ter mudado. Use a busca para encontrar o que procura."
            : "Você pode voltar à página inicial ou tentar recarregar o conteúdo."}
        </p>
        <div className={s.errorActions}>
          <Link className={s.button} to="/">
            Voltar ao início
          </Link>
          <Link className={s.textLink} to="/busca">
            Buscar no site →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

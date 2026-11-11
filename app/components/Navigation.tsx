import { useEffect, useState } from "react";
import type { AnchorHTMLAttributes, FormHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  children?: ReactNode;
};

// Native links keep every route independently loadable as static HTML.
export function Link({ to, ...props }: LinkProps) {
  return <a href={to} {...props} />;
}

export function NavLink({ to, className, currentPath, ...props }: Omit<LinkProps, "className"> & {
  className?: string | ((state: { isActive: boolean }) => string);
  currentPath?: string;
}) {
  const active = currentPath === to;
  return <a href={to} className={typeof className === "function" ? className({ isActive: active }) : className} {...props} aria-current={props["aria-current"] ?? (active ? "page" : undefined)} />;
}

export function Form({ action, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form action={action} {...props} />;
}

type SearchParamsInput = URLSearchParams | Record<string, string>;
export function useSearchParams(): [URLSearchParams, (next: SearchParamsInput, options?: { replace?: boolean; preventScrollReset?: boolean }) => void] {
  const [params, setLocalParams] = useState(() => new URLSearchParams());
  useEffect(() => {
    const sync = () => setLocalParams(new URLSearchParams(window.location.search));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const setParams = (next: SearchParamsInput, options?: { replace?: boolean; preventScrollReset?: boolean }) => {
    const updated = new URLSearchParams(next);
    const url = `${window.location.pathname}${updated.size ? `?${updated}` : ""}${window.location.hash}`;
    window.history[options?.replace ? "replaceState" : "pushState"](window.history.state, "", url);
    setLocalParams(updated);
    if (!options?.preventScrollReset) window.scrollTo(0, 0);
  };
  return [params, setParams];
}

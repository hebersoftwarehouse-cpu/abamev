import { useLoaderData } from "react-router";
import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { getPage } from "../data.server";
import { Seo } from "../components/Seo";
import { Detail } from "../components/Content";
import { Home } from "../components/Home";
import { Landing } from "../components/Landing";
import type { PageData } from "../types";

export async function loader({ params }: LoaderFunctionArgs) {
  const path = "/" + (params["*"] || "").replace(/\/$/, "");
  const page = getPage(path);
  if (!page) throw new Response("Página não encontrada", { status: 404 });
  return page;
}
export function shouldRevalidate({
  currentUrl,
  nextUrl,
}: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname !== nextUrl.pathname;
}
export default function Site() {
  const data = useLoaderData<PageData>();
  return (
    <main id="main" tabIndex={-1}>
      <Seo data={data} />
      {data.kind === "home" ? (
        <Home data={data} />
      ) : data.entry ? (
        <Detail entry={data.entry} related={data.entries} />
      ) : (
        <Landing data={data} />
      )}
    </main>
  );
}

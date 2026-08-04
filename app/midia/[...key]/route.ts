import { env } from "cloudflare:workers";

interface Env {
  MIDIA: R2Bucket;
}

// Serve objetos do R2 com suporte a Range (essencial para o player de áudio
// permitir arrastar a barra de progresso). As chaves já são caminhos
// aninhados sob um UUID de leitura + UUID de momento, então não são
// enumeráveis — v1 não faz verificação extra de autorização aqui.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const r2Key = key.join("/");
  const { MIDIA } = env as unknown as Env;

  const range = request.headers.get("range");
  const object = await MIDIA.get(r2Key, range ? { range: parseRange(range) } : undefined);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "private, max-age=31536000");

  if (range && "range" in object) {
    const r = object.range as { offset: number; length: number };
    headers.set("content-range", `bytes ${r.offset}-${r.offset + r.length - 1}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
}

function parseRange(header: string) {
  const match = /bytes=(\d+)-(\d*)/.exec(header);
  if (!match) return undefined;
  const offset = Number(match[1]);
  const end = match[2] ? Number(match[2]) : undefined;
  return end !== undefined ? { offset, length: end - offset + 1 } : { offset };
}

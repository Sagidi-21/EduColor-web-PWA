/**
 * Comportamiento de `public/sw.js`.
 *
 * El service worker es un script de worker estático, no un módulo del
 * grafo de imports: se sirve tal cual desde `public/` y no se puede
 * importar en un test. Para cubrirlo se lee el fichero y se evalúa con
 * `self`, `caches` y `fetch` inyectados, que es exactamente el contrato
 * que el navegador le ofrece.
 *
 * Cubre los cuatro defectos que motivaron DT-015: el documento servido
 * desde caché para siempre, las respuestas de `/api` cacheadas, el
 * crecimiento sin límite de la caché de runtime y la limpieza de cachés
 * antiguas.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://app.test";
const SW_PATH = path.resolve(process.cwd(), "public/sw.js");

type FetchListener = (event: {
  request: Request;
  respondWith: (p: Promise<Response>) => void;
}) => void;

class FakeCache {
  readonly entries = new Map<string, Response>();
  putOrder: string[] = [];

  private key(request: RequestInfo): string {
    const raw = typeof request === "string" ? request : request.url;
    return new URL(raw, ORIGIN).href;
  }

  async match(request: RequestInfo): Promise<Response | undefined> {
    const hit = this.entries.get(this.key(request));
    return hit ? hit.clone() : undefined;
  }

  async put(request: RequestInfo, response: Response): Promise<void> {
    const key = this.key(request);
    if (!this.entries.has(key)) this.putOrder.push(key);
    this.entries.set(key, response);
  }

  async addAll(urls: string[]): Promise<void> {
    for (const url of urls) await this.put(url, new Response(`precache:${url}`));
  }

  async keys(): Promise<Request[]> {
    return this.putOrder.map((href) => new Request(href));
  }

  async delete(request: RequestInfo): Promise<boolean> {
    const key = this.key(request);
    this.putOrder = this.putOrder.filter((k) => k !== key);
    return this.entries.delete(key);
  }
}

class FakeCacheStorage {
  readonly stores = new Map<string, FakeCache>();

  async open(name: string): Promise<FakeCache> {
    let store = this.stores.get(name);
    if (!store) {
      store = new FakeCache();
      this.stores.set(name, store);
    }
    return store;
  }

  async keys(): Promise<string[]> {
    return [...this.stores.keys()];
  }

  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name);
  }
}

interface LoadedSw {
  listeners: Record<string, ((event: unknown) => void)[]>;
  caches: FakeCacheStorage;
  fetchMock: ReturnType<typeof vi.fn>;
  dispatch: (type: string, event: unknown) => Promise<void>;
  fireFetch: (request: Request) => Promise<Response | undefined>;
}

function loadServiceWorker(options?: { fetchImpl?: () => Promise<Response> }): LoadedSw {
  const source = readFileSync(SW_PATH, "utf8");
  const listeners: Record<string, ((event: unknown) => void)[]> = {};
  const caches = new FakeCacheStorage();
  const fetchMock = vi.fn(options?.fetchImpl ?? (() => Promise.resolve(new Response("network"))));

  const self = {
    addEventListener: (type: string, handler: (event: unknown) => void) => {
      (listeners[type] ??= []).push(handler);
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    location: new URL(`${ORIGIN}/`),
  };

  new Function("self", "caches", "fetch", source)(self, caches, fetchMock);

  const dispatch = async (type: string, event: unknown) => {
    for (const handler of listeners[type] ?? []) handler(event);
  };

  const fireFetch = async (request: Request) => {
    let responded: Promise<Response> | undefined;
    const listenersForFetch = listeners.fetch as FetchListener[] | undefined;
    for (const handler of listenersForFetch ?? []) {
      handler({
        request,
        respondWith: (p: Promise<Response>) => {
          responded = p;
        },
      });
    }
    return responded ? await responded : undefined;
  };

  return { listeners, caches, fetchMock, dispatch, fireFetch };
}

function withWaitUntil(): { waitUntil: (p: Promise<unknown>) => void; done: Promise<unknown> } {
  const pending: Promise<unknown>[] = [];
  return {
    waitUntil: (p) => {
      pending.push(p);
    },
    done: Promise.all(pending),
  };
}

// happy-dom no admite `mode: "navigate"` en el constructor de Request,
// así que se define como propiedad propia para simular la navegación.
function navigate(): Request {
  const request = new Request(`${ORIGIN}/`);
  Object.defineProperty(request, "mode", { value: "navigate" });
  return request;
}

const asset = (name: string) => new Request(`${ORIGIN}/assets/${name}`);

describe("service worker de EduColor (public/sw.js)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sirve el documento desde la red y refresca la caché del shell", async () => {
    const sw = loadServiceWorker({
      fetchImpl: () => Promise.resolve(new Response("indice-v2")),
    });

    const response = await sw.fireFetch(navigate());
    expect(await response?.text()).toBe("indice-v2");

    const shell = await sw.caches.open("educolor-shell-v2");
    expect(await (await shell.match("/"))?.text()).toBe("indice-v2");
    expect(await (await shell.match("/index.html"))?.text()).toBe("indice-v2");
  });

  it("usa el documento cacheado cuando no hay red", async () => {
    const sw = loadServiceWorker({
      fetchImpl: () => Promise.reject(new Error("offline")),
    });

    const install = withWaitUntil();
    await sw.dispatch("install", install);
    await install.done;

    const response = await sw.fireFetch(navigate());
    expect(await response?.text()).toBe("precache:/");
  });

  it("no vuelve a pedir un recurso con hash que ya está en caché", async () => {
    const sw = loadServiceWorker({
      fetchImpl: () => Promise.resolve(new Response("index-js")),
    });

    const first = await sw.fireFetch(asset("index-a1b2.js"));
    expect(await first?.text()).toBe("index-js");

    const second = await sw.fireFetch(asset("index-a1b2.js"));
    expect(await second?.text()).toBe("index-js");
    expect(sw.fetchMock).toHaveBeenCalledTimes(1);
  });

  it("no intercepta ni cachea las respuestas de /api", async () => {
    const sw = loadServiceWorker({
      fetchImpl: () => Promise.resolve(new Response("modelo-sano")),
    });

    const request = new Request(`${ORIGIN}/api/mascot/health-hf`);
    expect(await sw.fireFetch(request)).toBeUndefined();

    const runtime = await sw.caches.open("educolor-runtime-v1");
    expect(runtime.putOrder).toEqual([]);
  });

  it("no intercepta otros orígenes", async () => {
    const sw = loadServiceWorker();
    const response = await sw.fireFetch(new Request("https://otro.test/x.js"));
    expect(response).toBeUndefined();
    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it("no intercepta métodos que no son GET", async () => {
    const sw = loadServiceWorker();
    const response = await sw.fireFetch(
      new Request(`${ORIGIN}/api/mascot/preview`, { method: "POST" }),
    );
    expect(response).toBeUndefined();
    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it("acota la caché de runtime al evitar que crezca sin límite", async () => {
    const sw = loadServiceWorker();
    const runtime = await sw.caches.open("educolor-runtime-v1");

    for (let i = 0; i < 320; i++) {
      await sw.fireFetch(asset(`img-${i}.webp`));
    }

    expect(runtime.putOrder.length).toBe(300);
    // Se descarta lo más antiguo, que es lo que ya no referencia ningún despliegue.
    expect(await runtime.match("/assets/img-0.webp")).toBeUndefined();
    expect(await runtime.match("/assets/img-319.webp")).toBeDefined();
  });

  it("borra las cachés antiguas del prefijo y conserva las actuales", async () => {
    const sw = loadServiceWorker();
    await sw.caches.open("educolor-shell-v1");
    await sw.caches.open("educolor-shell-v2");
    await sw.caches.open("educolor-runtime-v1");
    await sw.caches.open("otra-cosa");

    const activate = withWaitUntil();
    await sw.dispatch("activate", activate);
    await activate.done;

    const names = await sw.caches.keys();
    expect(names).toContain("educolor-shell-v2");
    expect(names).toContain("educolor-runtime-v1");
    expect(names).not.toContain("educolor-shell-v1");
    expect(names).toContain("otra-cosa");
  });
});

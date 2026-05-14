"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { PRODUCT_ENDPOINTS, type ProductEndpoint } from "@/app/contest/product-json-site-data";

type ResultMap = Partial<Record<ProductEndpoint, string>>;

export function ProductJsonSitePanel({ embedded = false }: { embedded?: boolean }) {
  const { language } = useSiteLanguage();
  const [results, setResults] = useState<ResultMap>({});

  const copy = {
    zh: {
      eyebrow: "Product JSON Site",
      title: "产品分类 JSON 接口",
      intro:
        "下面这块是把原来的 product_json_site 直接嵌进来了。三条接口都能点，返回值会随机变化。",
      note:
        "返回值已经压缩成最小结构，例如 {\"code\":200,\"result\":\"苹果\"}。每次点击刷新都会重新请求。",
      endpoint: "接口",
      sample: "示例返回",
      refresh: "刷新",
      open: "打开接口",
    },
    en: {
      eyebrow: "Product JSON Site",
      title: "Product Category JSON APIs",
      intro:
        "This is the original product_json_site embedded directly below the smart-car block. All three endpoints are clickable and return random values.",
      note:
        "The payload is simplified to the smallest structure, for example {\"code\":200,\"result\":\"Apple\"}. Each refresh fetches again.",
      endpoint: "Endpoint",
      sample: "Sample response",
      refresh: "Refresh",
      open: "Open API",
    },
  }[language];

  async function load(endpoint: ProductEndpoint) {
    const response = await fetch(endpoint, { cache: "no-store" });
    const json = (await response.json()) as { code: number; result: string };
    setResults((current) => ({ ...current, [endpoint]: JSON.stringify(json, null, 2) }));
  }

  useEffect(() => {
    PRODUCT_ENDPOINTS.forEach((item) => {
      void load(item.endpoint);
    });
  }, []);

  return (
    <section className={embedded ? "" : "rounded-[28px] border border-white/8 bg-white/[0.02] p-6 md:p-8"}>
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/30">{copy.eyebrow}</p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45 md:text-base">{copy.intro}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/40">
        {copy.note}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PRODUCT_ENDPOINTS.map((item) => {
          const result = results[item.endpoint] ?? "{}";

          return (
            <div key={item.endpoint} className="rounded-[22px] border border-white/8 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/25">{copy.endpoint}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{item.title[language]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">{item.intro[language]}</p>

              <Link
                href={item.endpoint}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/60 transition-colors hover:border-white/25 hover:text-white"
              >
                {copy.open}
              </Link>

              <div className="mt-5 rounded-2xl border border-white/8 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/25">{copy.sample}</p>
                <pre className="mt-3 overflow-auto text-xs leading-6 text-white/80">{result}</pre>
              </div>

              <button
                type="button"
                onClick={() => void load(item.endpoint)}
                className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white/65 transition-colors hover:border-white/25 hover:text-white"
              >
                {copy.refresh}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

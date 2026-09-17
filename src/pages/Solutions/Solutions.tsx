import { useState } from "react";
import { Link } from "react-router-dom";
import { useRagQuery } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { DemoBadge } from "@/components/Badges";

const QUESTIONS = [
  "Would trees or cool roofs work better here?",
  "What evidence supports increasing canopy cover?",
  "How have comparable cities reduced heat?",
  "What are the risks of high-albedo pavement here?",
];

export default function Solutions() {
  const rag = useRagQuery();
  const ask = useAppStore((s) => s.climate);
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const result = rag.data;
  const gradeColor = (g: string) => (g === "HIGH" ? "#4CAF50" : g === "MEDIUM" ? "#FFD43B" : "#FF5A1F");

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">UrbanFlux CLIMATE RAG · ASK UrbanFlux</p>
        <h1 className="display-xl mt-2 text-[clamp(2.2rem,5vw,4.5rem)]">
          EVIDENCE,<br />NOT <span className="text-heat">OPINIONS.</span>
        </h1>
        <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-bone/60">
          Retrieval-augmented answers over a curated corpus of urban-climate
          literature. Every claim cites a real study with DOI. When evidence is
          thin, UrbanFlux says <span className="font-mono2 text-heat">INSUFFICIENT EVIDENCE</span> — it never invents.
        </p>
      </div>

      <section className="border border-bone/12 p-6" aria-label="Ask UrbanFlux">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
          {QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className={`border px-3 py-1.5 font-mono2 text-[10px] ${question === q ? "border-heat text-heat" : "border-bone/20 text-bone/55 hover:text-bone"}`}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Your question"
            className="w-full border border-bone/25 bg-ink px-4 py-3 font-mono2 text-sm outline-none focus:border-heat"
          />
          <button
            onClick={() => rag.mutate(question)}
            disabled={rag.isPending || question.trim().length < 5}
            className="shrink-0 bg-heat px-6 py-3 font-mono2 text-[11px] tracking-[0.2em] text-ink hover:bg-solar disabled:opacity-50"
          >
            {rag.isPending ? "RETRIEVING…" : "ASK"}
          </button>
        </div>
        <p className="mt-2 font-mono2 text-[9px] text-bone/35">context: AOI · climate={ask} · drivers from selected hotspot · retrieval: BM25 + evidence-grade rerank</p>
      </section>

      {result && (
        result.status === "OK" ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {result.recommendations.map((rec) => (
                <article key={rec.intervention} className="border border-bone/15 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-2xl uppercase">{rec.intervention}</h2>
                    <span
                      className="badge"
                      style={{ color: gradeColor(rec.evidence_confidence), borderColor: gradeColor(rec.evidence_confidence) }}
                    >
                      EVIDENCE {rec.evidence_confidence}
                    </span>
                  </div>
                  <p className="mt-3 font-body text-sm leading-relaxed text-bone/75">{rec.why_it_fits}</p>
                  <p className="mt-3 font-mono2 text-[11px] leading-relaxed text-bone/55">
                    <span className="text-solar">MECHANISM ·</span> {rec.expected_mechanism}
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 font-mono2 text-[11px] text-bone/55">
                    {rec.implementation_considerations.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  <p className="mt-3 font-mono2 text-[10px] leading-relaxed text-bone/40">LIMITATIONS: {rec.limitations.join(" · ")}</p>
                  <div className="mt-4 border-t border-bone/10 pt-3">
                    <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">SUPPORTING EVIDENCE</p>
                    <ol className="mt-2 space-y-2">
                      {rec.citations.map((c) => (
                        <li key={c.doc_id} className="font-mono2 text-[11px] leading-relaxed">
                          <a
                            href={c.url ?? `https://doi.org/${c.doi}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-solar hover:underline"
                          >
                            {c.ref}
                          </a>{" "}
                          <span className="text-bone/75">{c.title}</span>{" "}
                          <span className="text-bone/40">({c.publication} {c.year}{c.doi ? ` · doi:${c.doi}` : ""})</span>
                          <span className="ml-2" style={{ color: gradeColor(c.evidence_grade) }}>[{c.evidence_grade}]</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              ))}
            </div>

            <section className="demo-watermark p-5">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-heat">ARCHITECTURE NOTE</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-bone/70">
                RAG proposes evidence-backed candidates. It does not estimate numbers.
                The <Link to="../scenario" className="text-solar underline underline-offset-4">scenario model</Link> computes
                thermal impact; the <Link to="../optimize" className="text-solar underline underline-offset-4">optimizer</Link> allocates
                spatially. The LLM never overrides numerical output.
              </p>
              <div className="mt-3"><DemoBadge /></div>
            </section>
          </>
        ) : (
          <div className="demo-watermark p-8 text-center">
            <p className="font-display text-3xl text-heat">INSUFFICIENT EVIDENCE</p>
            <p className="mx-auto mt-3 max-w-lg font-body text-sm text-bone/60">{result.message}</p>
          </div>
        )
      )}
    </div>
  );
}

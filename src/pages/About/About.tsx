import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="border-b border-bone/10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl text-heat">UrbanFlux</Link>
          <Link to="/explore" className="font-mono2 text-[11px] tracking-[0.2em] text-bone/60 hover:text-heat">EXPLORE →</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-5 py-16">
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">ABOUT</p>
        <h1 className="display-xl mt-3 text-[clamp(2.4rem,6vw,5rem)]">
          CLIMATE INTELLIGENCE<br /><span className="text-heat">INFRASTRUCTURE.</span>
        </h1>

        <div className="mt-10 space-y-6 font-body text-base leading-relaxed text-bone/70">
          <p>
            UrbanFlux is built on a simple conviction: cities deserve heat analysis
            that can answer <span className="text-bone">why</span>, not just{" "}
            <span className="text-bone">where</span> — and every answer should show
            its receipts.
          </p>
          <p>
            The platform is designed as infrastructure, not a demo. AOI-first
            architecture, adapter-based data sources, a model registry with
            validity guards, and a retrieval system that would rather say
            "insufficient evidence" than fabricate a citation.
          </p>
          <p>
            Urban heat today; the same spine extends to flood risk, air quality,
            energy and carbon — a digital twin of the urban climate, one variable
            at a time.
          </p>
        </div>

        <section className="mt-14" aria-label="Limitations">
          <h2 className="font-mono2 text-[11px] tracking-[0.3em] text-bone/50">STATED LIMITATIONS</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 font-body text-sm leading-relaxed text-bone/60">
            <li>This build ships a synthetic demonstration dataset (Delhi) — clearly labelled, never presented as observation.</li>
            <li>Earth Engine ingestion, global model training and LLM generation are adapter-gated; they activate with credentials configured.</li>
            <li>Scenario physics is first-order and documented — directional guidance, not calibrated prediction.</li>
            <li>No authentication in the research MVP; roles are architected for later.</li>
            <li>3D morphology and mean radiant temperature modeling are roadmap items.</li>
          </ul>
        </section>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link to="/research" className="bg-heat px-6 py-3.5 font-mono2 text-[11px] tracking-[0.2em] text-ink hover:bg-solar">READ THE METHODOLOGY</Link>
          <Link to="/datasets" className="border border-bone/25 px-6 py-3.5 font-mono2 text-[11px] tracking-[0.2em] hover:border-heat hover:text-heat">BROWSE THE DATA</Link>
        </div>
      </div>
    </div>
  );
}

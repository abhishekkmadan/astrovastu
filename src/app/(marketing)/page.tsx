import Link from "next/link";

const features = [
  {
    title: "Upload Floor Plans",
    desc: "Upload any floor plan image and define boundaries with precision polygon tools.",
    icon: "🏠",
  },
  {
    title: "Shakti Chakra Overlay",
    desc: "Automatically overlay the 16-direction Vastu compass and rotate it to match true North.",
    icon: "🧭",
  },
  {
    title: "Object & Activity Marking",
    desc: "Mark rooms, appliances, and activities to get instant Vastu verdicts with remedies.",
    icon: "📍",
  },
  {
    title: "PDF Reports",
    desc: "Generate professional PDF reports with all markings, verdicts, and remedies for your clients.",
    icon: "📄",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Professional{" "}
          <span className="text-primary">Vastu Analysis</span>{" "}
          Software
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
          Upload floor plans, overlay the Shakti Chakra, mark objects and
          activities, get verdicts with remedies, and generate PDF reports — all
          in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/demo"
            className="rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-dark transition-colors"
          >
            Try core product (demo)
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-surface-border px-6 py-3 font-medium text-text hover:bg-surface-dim transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      <section className="border-t border-surface-border bg-surface-dim py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">
            Everything you need for Vastu analysis
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-surface-border bg-surface p-6"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

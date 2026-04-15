import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    features: ["1 project", "Basic Vastu Chakra", "Manual boundary", "Community support"],
    cta: "Get Started",
    href: "/auth/signup",
    highlight: false,
  },
  {
    name: "Professional",
    price: "₹999",
    period: "/month",
    features: [
      "Unlimited projects",
      "All Vastu overlays",
      "Object marking & remedies",
      "PDF report export",
      "Priority support",
    ],
    cta: "Subscribe Now",
    href: "/auth/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Everything in Professional",
      "Team collaboration",
      "Custom branding on PDFs",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Us",
    href: "mailto:hello@astrovastusoftware.com",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <h1 className="text-center text-3xl font-bold">Simple, transparent pricing</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-text-muted">
        Choose a plan that fits your practice. Upgrade or cancel anytime.
      </p>
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 flex flex-col ${
              plan.highlight
                ? "border-primary shadow-lg shadow-primary/10 scale-105"
                : "border-surface-border"
            }`}
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-text-muted">{plan.period}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-text-muted">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                plan.highlight
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "border border-surface-border hover:bg-surface-dim"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

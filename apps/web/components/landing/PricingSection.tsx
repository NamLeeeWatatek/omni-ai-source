"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FiCheck } from "react-icons/fi";

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  cta: string;
  featured: boolean;
  features: string[];
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: 0,
    description: "Perfect for trying out WataOmi",
    cta: "Try for free",
    featured: false,
    features: [
      "1 bot",
      "100 conversations/month",
      "2 channels",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: 49,
    description: "For growing businesses",
    cta: "Try Pro",
    featured: true,
    features: [
      "10 bots",
      "10,000 conversations/month",
      "Unlimited channels",
      "Advanced analytics",
      "n8n integration",
      "Priority support",
      "Brand customization",
    ],
  },
  {
    name: "Enterprise",
    price: 299,
    description: "For large organizations",
    cta: "Contact sales",
    featured: false,
    features: [
      "Unlimited bots",
      "Unlimited conversations",
      "Unlimited channels",
      "Advanced AI features",
      "Dedicated account management",
      "SLA guarantee",
      "Custom integrations",
      "On-premise deployment",
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-slate-600">
            No setup fees, no hidden costs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-8 border ${
                plan.featured
                  ? "border-indigo-600 shadow-2xl scale-105 z-10 bg-white"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {plan.featured && (
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  ${plan.price}
                </span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="text-slate-600 mb-8">{plan.description}</p>
              <Button
                className={`w-full mb-8 h-12 rounded-full font-semibold ${
                  plan.featured
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {plan.cta}
              </Button>
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <FiCheck className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

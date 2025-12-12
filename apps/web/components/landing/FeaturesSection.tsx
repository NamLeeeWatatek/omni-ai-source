"use client";

import { motion } from "framer-motion";
import {
  FiMessageSquare,
  FiZap,
  FiBarChart2,
  FiShield,
  FiGitMerge,
  FiGlobe,
  FiSmartphone,
} from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";
import { IconType } from "react-icons";
import DesktopFlowMockup from "./DesktopFlowMockup";

interface Feature {
  icon: IconType;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: FiMessageSquare,
    title: "Unified Multi-Channel",
    description:
      "Connect WhatsApp, Messenger, Instagram, Telegram and other channels in a single platform.",
  },
  {
    icon: FiZap,
    title: "No-Code Flow Builder",
    description:
      "Create complex conversation flows with the visual drag-and-drop WataFlow tool.",
  },
  {
    icon: MdAutoAwesome,
    title: "AI-Powered Auto Response",
    description:
      "Let AI intelligently handle customer questions with contextual understanding.",
  },
  {
    icon: FiGitMerge,
    title: "n8n Integration",
    description:
      "Seamlessly connect with n8n workflows to expand unlimited automation capabilities.",
  },
  {
    icon: FiBarChart2,
    title: "Analytics & Reporting",
    description:
      "Track performance, measure interactions and optimize customer experience.",
  },
  {
    icon: FiShield,
    title: "Enterprise Security",
    description:
      "Bank-level encryption and compliance with GDPR, SOC 2, ISO standards.",
  },
  {
    icon: FiSmartphone,
    title: "Mobile Optimized",
    description:
      "Manage your business anytime, anywhere with fully responsive dashboard.",
  },
  {
    icon: FiGlobe,
    title: "Global Infrastructure",
    description:
      "Deploy on global edge network to ensure fast response times.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-indigo-600 font-semibold mb-2 tracking-wide uppercase text-sm">
              Unified Platform
            </h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">
              Comprehensive solution for <br />
              automated customer care
            </h3>
            <p className="text-xl text-slate-600 leading-relaxed">
              Reduce costs, increase revenue and operate your business more efficiently
              with the fully integrated AI platform. Use WataOmi to manage all
              communication channels, automate sales processes and customer care
              24/7.
            </p>
          </div>
          <div className="relative flex justify-center">
            <DesktopFlowMockup showDesktop={true} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">
                {feature.title}
              </h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

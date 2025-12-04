"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import HeroDeviceMockup from "./HeroDeviceMockup";

export default function HeroSection() {
  return (
    <section className="relative bg-stripe-hero pt-32 pb-48 lg:pt-48 lg:pb-64 clip-diagonal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white z-10"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Nền tảng AI Chatbot
              <br />
              <span className="text-teal-200">đa kênh thông minh</span>
            </h1>

            <p className="text-xl text-indigo-100 max-w-xl mb-10 leading-relaxed">
              Kết nối tất cả kênh giao tiếp của bạn - WhatsApp, Facebook,
              Instagram, Telegram - trong một nền tảng duy nhất. Tự động hóa chăm
              sóc khách hàng với AI và tăng doanh số bán hàng.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-slate-900 text-white hover:bg-slate-800 border-0 rounded-full px-8 h-12 text-base font-semibold"
                >
                  Bắt đầu miễn phí
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white/30 hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold"
              >
                Liên hệ tư vấn
              </Button>
            </div>
          </motion.div>

          {}
          <HeroDeviceMockup />
        </div>
      </div>
    </section>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-6">
          Sẵn sàng bắt đầu?
        </h2>
        <p className="text-xl text-slate-600 mb-10">
          Khám phá nền tảng hoặc tạo tài khoản để bắt đầu tự động hóa chăm sóc
          khách hàng ngay hôm nay.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-12 font-semibold"
            >
              Bắt đầu ngay
              <FiArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full px-8 h-12 font-semibold"
          >
            Liên hệ tư vấn
          </Button>
        </div>
      </div>
    </section>
  );
}

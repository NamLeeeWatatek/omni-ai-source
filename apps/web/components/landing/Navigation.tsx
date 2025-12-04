"use client";

import { Button } from "@/components/ui/button";
import { MdAutoAwesome } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";

interface NavigationProps {
  scrolled: boolean;
}

export default function Navigation({ scrolled }: NavigationProps) {
  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MdAutoAwesome
              className={`w-8 h-8 ${scrolled ? "text-primary" : "text-white"}`}
            />
            <span
              className={`text-2xl font-bold ${
                scrolled ? "text-slate-900" : "text-white"
              }`}
            >
              WataOmi
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className={`text-sm font-medium hover:opacity-80 transition-colors ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
            >
              Tính năng
            </a>
            <a
              href="#pricing"
              className={`text-sm font-medium hover:opacity-80 transition-colors ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
            >
              Bảng giá
            </a>
            <a
              href="#"
              className={`text-sm font-medium hover:opacity-80 transition-colors ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
            >
              Tài liệu
            </a>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={scrolled ? "text-slate-700" : "text-white hover:bg-white/10"}
              >
                Đăng nhập
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className={
                  scrolled
                    ? "bg-primary text-white"
                    : "bg-white text-primary hover:bg-white/90"
                }
              >
                Bắt đầu
                <FiArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

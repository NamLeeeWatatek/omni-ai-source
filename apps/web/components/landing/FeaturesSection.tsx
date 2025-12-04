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
    title: "Đa kênh thống nhất",
    description:
      "Kết nối WhatsApp, Messenger, Instagram, Telegram và nhiều kênh khác trong một nền tảng duy nhất.",
  },
  {
    icon: FiZap,
    title: "Xây dựng Flow không code",
    description:
      "Tạo các luồng hội thoại phức tạp với công cụ kéo thả trực quan WataFlow.",
  },
  {
    icon: MdAutoAwesome,
    title: "Trả lời tự động bằng AI",
    description:
      "Để AI xử lý câu hỏi khách hàng một cách thông minh với khả năng hiểu ngữ cảnh.",
  },
  {
    icon: FiGitMerge,
    title: "Tích hợp n8n",
    description:
      "Kết nối liền mạch với n8n workflows để mở rộng khả năng tự động hóa không giới hạn.",
  },
  {
    icon: FiBarChart2,
    title: "Phân tích & Báo cáo",
    description:
      "Theo dõi hiệu suất, đo lường tương tác và tối ưu hóa trải nghiệm khách hàng.",
  },
  {
    icon: FiShield,
    title: "Bảo mật doanh nghiệp",
    description:
      "Mã hóa cấp ngân hàng và tuân thủ các tiêu chuẩn GDPR, SOC 2, ISO.",
  },
  {
    icon: FiSmartphone,
    title: "Tối ưu di động",
    description:
      "Quản lý doanh nghiệp mọi lúc mọi nơi với dashboard responsive hoàn toàn.",
  },
  {
    icon: FiGlobe,
    title: "Hạ tầng toàn cầu",
    description:
      "Triển khai trên mạng lưới edge toàn cầu để đảm bảo tốc độ phản hồi nhanh chóng.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-indigo-600 font-semibold mb-2 tracking-wide uppercase text-sm">
              Nền tảng thống nhất
            </h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">
              Giải pháp toàn diện cho <br />
              chăm sóc khách hàng tự động
            </h3>
            <p className="text-xl text-slate-600 leading-relaxed">
              Giảm chi phí, tăng doanh thu và vận hành doanh nghiệp hiệu quả hơn
              với nền tảng AI tích hợp đầy đủ. Sử dụng WataOmi để quản lý tất cả
              kênh giao tiếp, tự động hóa quy trình bán hàng và chăm sóc khách
              hàng 24/7.
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

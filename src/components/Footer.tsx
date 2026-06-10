interface Props {
  locale: string;
}

export default function Footer({ locale }: Props) {
  const isEn = locale === "en";

  const links = isEn
    ? [
        { label: "Schedule", href: "/en" },
        { label: "Standings", href: "#" },
        { label: "Teams", href: "#" },
        { label: "About", href: "#about" },
        { label: "Privacy", href: "#privacy" },
        { label: "Contact", href: "#contact" },
      ]
    : [
        { label: "Lịch thi đấu", href: "/" },
        { label: "Bảng xếp hạng", href: "#" },
        { label: "Đội tuyển", href: "#" },
        { label: "Giới thiệu", href: "#about" },
        { label: "Chính sách", href: "#privacy" },
        { label: "Liên hệ", href: "#contact" },
      ];

  return (
    <footer className="mt-20 bg-slate-900 text-slate-400">
      {/* ── Top section ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white text-base font-semibold">
              ⚽ World Cup 2026 Live
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isEn
              ? "Real-time scores, schedules and match previews for all 104 FIFA World Cup 2026 matches. Auto-updated every 15 seconds."
              : "Tỉ số trực tiếp, lịch thi đấu và nhận định cho cả 104 trận World Cup 2026. Tự động cập nhật mỗi 15 giây."}
          </p>
          <p className="text-xs text-slate-500 mt-3">
            {isEn
              ? "Jun 11 – Jul 19, 2026 · USA · Canada · Mexico"
              : "11/06 – 19/07/2026 · Mỹ · Canada · Mexico"}
          </p>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
            {isEn ? "Navigation" : "Điều hướng"}
          </p>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="text-sm text-slate-400 hover:text-white transition"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div id="contact">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
            {isEn ? "Advertise with us" : "Hợp tác quảng cáo"}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            {isEn
              ? "Reach millions of football fans during the biggest sporting event of 2026. We offer banner, native and sponsored-content placements."
              : "Tiếp cận hàng triệu fan bóng đá trong sự kiện thể thao lớn nhất 2026. Chúng tôi cung cấp các vị trí banner, native và sponsored content."}
          </p>

          {/* Traffic badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              isEn ? "104 match pages" : "104 trang trận đấu",
              isEn ? "Auto-updated" : "Cập nhật tự động",
              isEn ? "VI + EN" : "Tiếng Việt + Anh",
            ].map((badge) => (
              <span
                key={badge}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-700 text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Contact card */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs font-semibold text-slate-300 mb-3">
              {isEn ? "Contact for advertising" : "Liên hệ hợp tác"}
            </p>
            <div className="space-y-2">
              <a
                href="mailto:minhtritt01@gmail.com"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition group"
              >
                <span className="w-6 h-6 bg-slate-700 rounded-md flex items-center justify-center text-xs group-hover:bg-slate-600 transition">
                  ✉
                </span>
                minhtritt01@gmail.com
              </a>
              <a
                href="https://t.me/minhtritt01"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition group"
              >
                <span className="w-6 h-6 bg-slate-700 rounded-md flex items-center justify-center text-xs group-hover:bg-slate-600 transition">
                  ✈
                </span>
                Telegram: @minhtritt01
              </a>
              <a
                href="https://wa.me/84834790997"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition group"
              >
                <span className="w-6 h-6 bg-slate-700 rounded-md flex items-center justify-center text-xs group-hover:bg-slate-600 transition">
                  📱
                </span>
                WhatsApp/Zalo: (+84) 834 790 997
              </a>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              {isEn
                ? "Response within 24 hours · Ad rates available on request"
                : "Phản hồi trong 24h · Báo giá theo yêu cầu"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────── */}
      <div className="border-t border-slate-800" />

      {/* ── Bottom bar ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          © 2026 WorldCup2026Live.vn ·{" "}
          {isEn
            ? "Football information site — no broadcast rights infringed"
            : "Trang thông tin bóng đá — không vi phạm bản quyền phát sóng"}
        </p>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:text-slate-300 transition">
            {isEn ? "Privacy policy" : "Chính sách bảo mật"}
          </a>
          <a href="#contact" className="hover:text-slate-300 transition">
            {isEn ? "Contact" : "Liên hệ"}
          </a>
          <span className="text-slate-700">·</span>
          <span>{isEn ? "Updated every 15s" : "Cập nhật mỗi 15 giây"}</span>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { FiBook, FiGithub, FiZap } from "react-icons/fi";

export default function Navbar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    {
      name: "Docs",
      href: "https://movo-payment.gitbook.io/movo-hedera/",
      icon: FiBook,
    },
    {
      name: "GitHub",
      href: "https://github.com/ggalangswt/movo-hedera",
      icon: FiGithub,
    },
    { name: "Features", href: "#features", icon: FiZap },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer"
            onMouseEnter={() => setHoveredItem("logo")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-all duration-300 ${
                hoveredItem === "logo"
                  ? "scale-110 shadow-lg shadow-blue-500/50"
                  : ""
              }`}
            >
              <Image
                src="/movo non-text.png"
                alt="Movo Logo"
                width={48}
                height={48}
                className="object-contain scale-200"
              />
            </div>
            <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
              movo.
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                target={
                  item.name === "Docs" || item.name === "GitHub"
                    ? "_blank"
                    : "_self"
                }
                rel={
                  item.name === "Docs" || item.name === "GitHub"
                    ? "noopener noreferrer"
                    : ""
                }
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300">
                  <item.icon className="text-lg text-white" />
                  <span className="text-gray-300 group-hover:text-white font-medium transition-colors duration-300">
                    {item.name}
                  </span>
                </div>

                {/* Futuristic hover effects */}
                <div
                  className={`absolute inset-0 rounded-lg bg-linear-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    hoveredItem === item.name ? "animate-pulse" : ""
                  }`}
                />

                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-blue-400/50 transition-all duration-300" />

                {/* Bottom glow line */}
                <div
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-linear-to-r from-transparent via-blue-400 to-transparent transition-all duration-300 ${
                    hoveredItem === item.name
                      ? "w-full opacity-100"
                      : "w-0 opacity-0"
                  }`}
                />

                {/* Scanning line effect */}
                <div
                  className={`absolute top-0 left-0 h-full w-0.5 bg-linear-to-b from-transparent via-blue-400 to-transparent transition-all duration-500 ${
                    hoveredItem === item.name ? "animate-scan" : ""
                  }`}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
      {/* Additional futuristic elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
    </nav>
  );
}

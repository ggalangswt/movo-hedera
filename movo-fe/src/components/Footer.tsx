"use client";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "/#features" },
      { name: "X402 Protocol", href: "/#features" },
      { name: "IDRX Settlement", href: "/#features" },
      { name: "API Documentation", href: "/docs" },
      { name: "Pricing", href: "/pricing" },
    ],
    resources: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Legal", href: "/legal" },
      { name: "FAQ", href: "/faq" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/contact" },
    ],
    social: [
      { name: "Twitter", href: "https://twitter.com/movo" },
      { name: "GitHub", href: "https://github.com/movo" },
    ],
  };

  return (
    <footer className="relative border-t border-gray-900/90 from-[#0A1929]">
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* 1st block */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block">
                <div className="flex items-center gap-5 mb-4">
                  <Image
                    src="/movo non-text.png"
                    alt="Movo Logo"
                    width={35}
                    height={35}
                    className="object-contain scale-200"
                  />
                  <span className="text-2xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    movo.
                  </span>
                </div>
              </Link>
              <div className="text-gray-400 text-xs text-left mb-4">
                © {new Date().getFullYear()} Movo. All rights reserved. Powered
                by X402 Protocol.
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Transform your payment experience with Movo's cutting-edge Web3
                technology. Powered by X402 Protocol for seamless multi-chain
                transactions and IDRX Settlement for instant, stable value
                transfers with minimal fees.
              </p>
            </div>

            {/* 3rd blocks */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4th blocks */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">
                Resources
              </h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 5th block */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6th block */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.social.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* bottom bar */}
          <div className="py-6 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Social Links */}
              {/* <div className="flex items-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                    aria-label={social.name}
                  >
                  </a>
                ))}
              </div> */}

              {/* Additional Info */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-gray-400">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";

// Dynamic imports for client-only components
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const CountUp = dynamic(() => import("@/components/animations/CountUp"), {
  ssr: false,
});
const StarBorder = dynamic(() => import("@/components/animations/StarBorder"), {
  ssr: false,
});
const ScrollReveal = dynamic(
  () => import("@/components/animations/ScrollReveal"),
  { ssr: false }
);
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

const World = dynamic(
  () => import("@/components/ui/globe").then((mod) => mod.World),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ),
  }
);

const globeConfig = {
  pointSize: 4,
  globeColor: "#062038",
  showAtmosphere: true,
  atmosphereColor: "#FFFFFF",
  atmosphereAltitude: 0.1,
  emissive: "#062038",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#ffffff",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};
const colors = ["#0A4D68", "#2E8BC0", "#BFD7ED"];
const globeData = [
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -22.9068,
    endLng: -43.1729,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 1,
    startLat: 28.6139,
    startLng: 77.209,
    endLat: 3.139,
    endLng: 101.6869,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -1.303396,
    endLng: 36.852443,
    arcAlt: 0.5,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 2,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 2,
    startLat: 51.5072,
    startLng: -0.1276,
    endLat: 3.139,
    endLng: 101.6869,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 2,
    startLat: -15.785493,
    startLng: -47.909029,
    endLat: 36.162809,
    endLng: -115.119411,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 3,
    startLat: -33.8688,
    startLng: 151.2093,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 3,
    startLat: 21.3099,
    startLng: -157.8581,
    endLat: 40.7128,
    endLng: -74.006,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 3,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 4,
    startLat: 11.986597,
    startLng: 8.571831,
    endLat: -15.595412,
    endLng: -56.05918,
    arcAlt: 0.5,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 4,
    startLat: -34.6037,
    startLng: -58.3816,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.7,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 4,
    startLat: 51.5072,
    startLng: -0.1276,
    endLat: 48.8566,
    endLng: -2.3522,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 5,
    startLat: 14.5995,
    startLng: 120.9842,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 5,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: -33.8688,
    endLng: 151.2093,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 5,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 48.8566,
    endLng: -2.3522,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 6,
    startLat: -15.432563,
    startLng: 28.315853,
    endLat: 1.094136,
    endLng: -63.34546,
    arcAlt: 0.7,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 6,
    startLat: 37.5665,
    startLng: 126.978,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 6,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 7,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -15.595412,
    endLng: -56.05918,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 7,
    startLat: 48.8566,
    startLng: -2.3522,
    endLat: 52.52,
    endLng: 13.405,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 7,
    startLat: 52.52,
    startLng: 13.405,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 8,
    startLat: -8.833221,
    startLng: 13.264837,
    endLat: -33.936138,
    endLng: 18.436529,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 8,
    startLat: 49.2827,
    startLng: -123.1207,
    endLat: 52.3676,
    endLng: 4.9041,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 8,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: 40.7128,
    endLng: -74.006,
    arcAlt: 0.5,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 9,
    startLat: 51.5072,
    startLng: -0.1276,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 9,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: -22.9068,
    endLng: -43.1729,
    arcAlt: 0.7,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 9,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: -34.6037,
    endLng: -58.3816,
    arcAlt: 0.5,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 10,
    startLat: -22.9068,
    startLng: -43.1729,
    endLat: 28.6139,
    endLng: 77.209,
    arcAlt: 0.7,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 10,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 31.2304,
    endLng: 121.4737,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 10,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 52.3676,
    endLng: 4.9041,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 11,
    startLat: 41.9028,
    startLng: 12.4964,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 11,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 31.2304,
    endLng: 121.4737,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 11,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 1.3521,
    endLng: 103.8198,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 12,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 37.7749,
    endLng: -122.4194,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 12,
    startLat: 35.6762,
    startLng: 139.6503,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 12,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 34.0522,
    endLng: -118.2437,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 13,
    startLat: 52.52,
    startLng: 13.405,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 13,
    startLat: 11.986597,
    startLng: 8.571831,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 13,
    startLat: -22.9068,
    startLng: -43.1729,
    endLat: -34.6037,
    endLng: -58.3816,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
  {
    order: 14,
    startLat: -33.936138,
    startLng: 18.436529,
    endLat: 21.395643,
    endLng: 39.883798,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * (colors.length - 1))],
  },
];

const features = [
  {
    title: "X402 Protocol Integration",
    description:
      "Seamless cross-chain payment infrastructure with automated settlement and routing",
  },
  {
    title: "IDRX Settlement System",
    description:
      "Instant settlement in Indonesian Rupiah stablecoin with automated conversion and local currency support",
  },
  {
    title: "Low Transaction Fees",
    description: "Competitive rates for all transactions",
  },
  {
    title: "Multiple Cryptocurrency",
    description: "Support for various digital currencies",
  },
];

const stats = [
  {
    value: "2458932.47",
    label: "Total Revenue",
    prefix: "$",
  },
  {
    value: "1847265,89",
    label: "USDC Payments",
    prefix: "$",
  },
  {
    value: "9876543210",
    label: "IDR Payments",
    prefix: "Rp",
  },
  {
    value: "15847",
    label: "Transactions",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  // Preload pages when component mounts
  React.useEffect(() => {
    // Preload dashboard and related pages
    router.prefetch("/dashboard");
    router.prefetch("/faq");
    router.prefetch("/invoices");
    router.prefetch("/kyc");
    router.prefetch("/payout");
  }, [router]);

  const handleGetStarted = () => {
    // Prefetch additional pages when user clicks get started
    router.prefetch("/faq");
    router.prefetch("/invoices");
    router.prefetch("/kyc");
    router.prefetch("/payout");

    if (isConnected) {
      router.push("/dashboard");
    } else {
      router.push("/dashboard"); // Will show connect wallet modal on dashboard
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0A0A0A] via-[#062038] to-[#0A0A0A]">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0">
          <World data={globeData} globeConfig={globeConfig} />
        </div>
        <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            Cross-Border Crypto Payments Powered by X402
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Web3 Payments Made Simple with the X402 Protocol. Simplify
            cryptocurrency transactions and cross-border settlements using our
            secure, fast, and reliable payment platform.
          </p>
          <div className="flex items-center justify-center">
            <StarBorder
              as="button"
              color="cyan"
              speed="3s"
              onClick={handleGetStarted}
              className="relative group text-white px-10 py-4 font-semibold cursor-pointer text-lg
                bg-linear-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10
                hover:from-cyan-500/20 hover:via-blue-500/20 hover:to-cyan-500/20
                backdrop-blur-sm
                shadow-[0_0_20px_rgba(6,182,212,0.3)]
                hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]
                transition-all duration-500 ease-out
                hover:scale-105 active:scale-95
                overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-500/20 to-transparent 
                  animate-shimmer"
                  style={{
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite",
                  }}
                />
              </div>
            </StarBorder>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <ScrollReveal y={80}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="count-up-text text-2xl md:text-3xl font-bold text-white">
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <CountUp
                    from={0}
                    to={parseFloat(stat.value)}
                    duration={1}
                    direction="up"
                    separator=","
                  ></CountUp>
                </div>
                <div className="text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal y={60}>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Powerful Web3 Payment Features
            </h2>
          </ScrollReveal>
          <ScrollReveal y={60}>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
              Everything you need to accept and manage cryptocurrency payments
              for your business with Movo.
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={index} y={80} delay={0.1 * index}>
                <div key={index} className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <ScrollReveal y={80}>
        <Footer />
      </ScrollReveal>

      {/* Hidden preload links for better prefetching */}
      <div className="hidden">
        <Link href="/dashboard" prefetch={true}>
          Dashboard
        </Link>
        <Link href="/faq" prefetch={true}>
          FAQ
        </Link>
        <Link href="/invoices" prefetch={true}>
          Invoices
        </Link>
        <Link href="/kyc" prefetch={true}>
          KYC
        </Link>
        <Link href="/payout" prefetch={true}>
          Payout
        </Link>
      </div>
    </div>
  );
}

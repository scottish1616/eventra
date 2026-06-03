"use client";

import React from "react";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  search: string;
  setSearch: (s: string) => void;
}

export default function GlassHero({ search, setSearch }: Props) {
  return (
    <div className="relative overflow-hidden py-32 px-6 min-h-[650px] bg-gradient-to-br from-purple-700 to-blue-700">
      {/* Background image with overlay - concert image blended with gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/concert-hero.jpg'), linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(88, 28, 135, 0.5) 50%, rgba(30, 58, 138, 0.6) 100%)`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Animated glass gradient overlay with stage lighting effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-purple-900/50 to-blue-400/20 backdrop-blur-sm" />
      
      {/* Decorative glass morphism shapes - simulate stage lights */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-400/15 rounded-full filter blur-3xl opacity-60 animate-pulse" />
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full filter blur-3xl opacity-50" />
      <div className="absolute -bottom-32 left-1/4 w-full h-96 bg-purple-400/10 rounded-full filter blur-3xl opacity-40" />

      {/* Animated light beam effect */}
      <div className="absolute top-0 left-1/3 w-1 h-full bg-gradient-to-b from-cyan-300/0 via-cyan-300/20 to-cyan-300/0 transform skew-x-12 opacity-50" />
      <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-blue-300/0 via-blue-300/20 to-blue-300/0 transform -skew-x-12 opacity-40" />

      {/* Dot and wave pattern */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '50px 50px'}} />

      {/* Main content */}
      <div className="relative max-w-4xl mx-auto text-center z-10">
        {/* Glassmorphic title container */}
        <div className="mb-8 backdrop-blur-lg bg-white/8 border border-white/15 rounded-3xl p-8 shadow-2xl hover:bg-white/12 transition-all duration-300">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight drop-shadow-2xl">
            Discover futuristic events
          </h1>
          <p className="text-blue-100 mb-0 max-w-2xl mx-auto text-lg leading-relaxed">Premium ticketing with instant M-Pesa payments. Beautifully designed, fast, and accessible.</p>
        </div>

        {/* Glassmorphic search container */}
        <div className="glass mx-auto max-w-xl rounded-2xl p-2 flex items-center gap-2 shadow-2xl border border-white/20 backdrop-blur-xl hover:border-white/40 transition-all duration-300">
          <div className="flex-1 flex items-center gap-3 px-4">
            <Search className="w-5 h-5 text-white/90 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by name or city..."
              className="flex-1 text-sm text-white bg-transparent focus:outline-none placeholder-white/70 font-medium"
            />
          </div>
          <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-semibold">Search</Button>
        </div>

        {/* Event stats with glass cards */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          {[
            { number: '500+', label: 'Live Events' },
            { number: '50K+', label: 'Happy Attendees' },
            { number: '24/7', label: 'Support' }
          ].map((stat, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/8 border border-white/15 rounded-xl p-4 hover:bg-white/15 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mb-1">{stat.number}</div>
              <div className="text-xs md:text-sm text-white/80 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated wave bottom with glass effect */}
      <div className="absolute -bottom-1 left-0 right-0 backdrop-blur-sm">
        <svg viewBox="0 0 1440 60" className="w-full fill-white/5">
          <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </div>
  );
}

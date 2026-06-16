import React from "react";
import { Calendar, MapPin, Users, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    slug: string;
    coverImage?: string;
    ticketTypes: { price: number }[];
    description?: string;
    attendeeCount?: number;
    rating?: number;
  };
  onPreview?: () => void;
  onClick?: () => void;
  index?: number;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);

const minPrice = (ticketTypes: { price: number }[]) => {
  if (!ticketTypes || ticketTypes.length === 0) return 0;
  return Math.min(...ticketTypes.map((t) => t.price));
};

export default function ProfessionalEventCard({
  event,
  onPreview,
  onClick,
  index = 0,
}: EventCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      viewport={{ once: true }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        {event.coverImage ? (
          <>
            <img
              src={event.coverImage}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 opacity-80" />
        )}

        {/* Overlay effects */}
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)`,
          }}
        />

        {/* Badge - Category or Status */}
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-block bg-white/95 backdrop-blur-sm text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            🔴 Live
          </span>
        </div>

        {/* Preview Button */}
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="absolute left-4 top-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all duration-200 shadow-lg"
            title="Quick preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {/* Attendee count - positioned bottom */}
        {event.attendeeCount && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {event.attendeeCount}+ attending
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="relative p-6 bg-white">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors">
          {event.title}
        </h3>

        {/* Rating if available */}
        {event.rating && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.floor(event.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
            <span className="text-xs text-gray-600 ml-1">({event.rating})</span>
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-2.5 mb-5">
          {/* Date */}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">{formatDate(event.date)}</p>
              <p className="text-xs text-gray-500">
                {new Date(event.date).toLocaleTimeString("en-KE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-100">
              <MapPin className="w-4 h-4 text-pink-600" />
            </div>
            <span className="font-semibold line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 mb-5" />

        {/* Footer - Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium">Starting from</p>
            <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatCurrency(minPrice(event.ticketTypes))}
            </p>
          </div>

          {/* CTA Button */}
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
            Book
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Decorative gradient border */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
        background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))",
      }} />
    </motion.article>
  );
}

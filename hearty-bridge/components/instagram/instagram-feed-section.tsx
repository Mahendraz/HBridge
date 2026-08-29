"use client";

import { InstagramIcon } from "@/components/icons/instagram-icon";
import { InstagramPostEmbed } from "./instagram-post-embed";

const FEATURED_POSTS = [
  {
    url: "https://instagram.com/p/DPVVUvBDwqM",
    label: "Testimoni orang tua — postingan paling banyak disukai",
  },
  {
    url: "https://instagram.com/p/Dbmnz4BvpCU",
    label: "Miss Adea, Terapis Okupasional, menjelaskan anak aktif & stimulasi sensori",
  },
  {
    url: "https://instagram.com/p/Da6zYOcvFWc",
    label: "Video paling banyak ditonton di Instagram Hearty Bridge",
  },
];

export function InstagramFeedSection() {
  return (
    <section className="relative py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-coral-tint border border-brand-coral-light px-4 py-1.5 text-sm font-semibold text-brand-coral mb-4">
            <InstagramIcon className="h-4 w-4" />
            @heartybridge_
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Cerita &amp; Edukasi dari Instagram Kami
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Tips parenting, cerita orang tua, dan keseharian terapi anak di Hearty Bridge — ikuti terus untuk update terbaru.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {FEATURED_POSTS.map((post) => (
            <InstagramPostEmbed key={post.url} url={post.url} fallbackLabel={post.label} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <a
            href="https://www.instagram.com/heartybridge_/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-coral px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <InstagramIcon className="h-5 w-5" />
            Ikuti @heartybridge_ di Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HeartIcon,
  UserCheckIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UsersIcon,
  StarIcon,
  ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { PageHero } from "@/components/layout/page-hero";
import { PageCta } from "@/components/layout/page-cta";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <PageHero
        badge="Pusat Terapi Anak & Tumbuh Kembang • Batam"
        title="Tentang"
        highlight="Hearty Bridge"
        subtitle={t('hero.subtitle')}
      />

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('mission.title')}</h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('mission.p1')}
              </p>
              <p className="text-lg text-gray-600 mb-8">
                {t('mission.p2')}
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="bg-brand-coral hover:opacity-90">
                  {t('mission.cta')}
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  <NumberTicker value={6} />+
                </h3>
                <p className="text-gray-600">{t('stats.families')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Batam</h3>
                <p className="text-gray-600">{t('stats.therapists')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUpIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  <NumberTicker value={360} />+
                </h3>
                <p className="text-gray-600">{t('stats.successRate')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  <NumberTicker value={679} />
                </h3>
                <p className="text-gray-600">{t('stats.avgRating')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('values.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('values.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <HeartIcon className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>{t('values.compassion.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('values.compassion.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>{t('values.trust.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('values.trust.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <UserCheckIcon className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>{t('values.quality.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('values.quality.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('team.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('team.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 p-6 text-center">
              <BorderBeam colorFrom="#2fa8a0" colorTo="#c41e34" size={60} duration={8} />
              <div className="w-24 h-24 bg-teal-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <UserCheckIcon className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Miss Adea</h3>
              <p className="text-teal-700 mb-2">Terapis Okupasional</p>
              <p className="text-sm text-gray-600">
                Mendampingi anak-anak menyalurkan kebutuhan stimulasi sensori melalui aktivitas
                keseharian yang menyenangkan dan sesuai kebutuhan tumbuh kembangnya.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-gray-200 p-6 text-center">
              <BorderBeam colorFrom="#2fa8a0" colorTo="#c41e34" size={60} duration={8} delay={2} />
              <div className="w-24 h-24 bg-teal-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <HeartIcon className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tim Terapi Wicara</h3>
              <p className="text-teal-700 mb-2">Speech Therapist</p>
              <p className="text-sm text-gray-600">
                Mendukung kemampuan komunikasi anak — dari pelafalan, kelancaran bicara, hingga
                interaksi sosial — dengan pendekatan yang menyenangkan.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-gray-200 p-6 text-center">
              <BorderBeam colorFrom="#2fa8a0" colorTo="#c41e34" size={60} duration={8} delay={4} />
              <div className="w-24 h-24 bg-teal-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <UsersIcon className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tim Konsultasi Keluarga</h3>
              <p className="text-teal-700 mb-2">Family Consultant</p>
              <p className="text-sm text-gray-600">
                Membantu Ayah &amp; Bunda memahami kebutuhan tumbuh kembang si kecil dan
                menciptakan lingkungan rumah yang kondusif untuk terapi.
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Lihat keseharian tim kami mendampingi anak-anak di{" "}
            <a
              href="https://www.instagram.com/heartybridge_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-coral font-medium hover:underline"
            >
              @heartybridge_
            </a>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <PageCta title={t('cta.title')} subtitle={t('cta.subtitle')}>
        <Link href="/auth/register">
          <ShimmerButton background="rgba(196, 30, 52, 1)" className="text-base px-6 py-3 font-semibold">
            {t('cta.getStarted')}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </ShimmerButton>
        </Link>
        <Link href="/services">
          <Button size="lg" variant="outline" className="border-brand-coral text-brand-coral hover:bg-brand-coral-tint">
            {t('cta.services')}
          </Button>
        </Link>
      </PageCta>
    </div>
  );
}

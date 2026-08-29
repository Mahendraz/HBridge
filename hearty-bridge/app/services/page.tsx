"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HeartIcon,
  UserCheckIcon,
  BrainIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  CalendarIcon,
  VideoIcon,
  ShieldCheckIcon,
  CheckIcon
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { PageHero } from "@/components/layout/page-hero";
import { PageCta } from "@/components/layout/page-cta";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { ArrowRightIcon } from "lucide-react";

export default function ServicesPage() {
  const t = useTranslations('services');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <PageHero
        badge="Pusat Terapi Anak & Tumbuh Kembang • Batam"
        title="Layanan"
        highlight="Kami"
        subtitle={t('hero.subtitle')}
      />

      {/* Main Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('specializations.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('specializations.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BrainIcon className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle className="text-xl">{t('specializations.autism.title')}</CardTitle>
                <Badge variant="secondary">{t('specializations.popular')}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {t('specializations.autism.description')}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.autism.aba')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.autism.social')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.autism.communication')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquareIcon className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t('specializations.speech.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {t('specializations.speech.description')}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.speech.articulation')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.speech.language')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.speech.fluency')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardListIcon className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">{t('specializations.adhd.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {t('specializations.adhd.description')}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.adhd.attention')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.adhd.executive')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.adhd.behavioral')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <HeartIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">{t('specializations.emotional.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {t('specializations.emotional.description')}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.emotional.anxiety')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.emotional.regulation')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.emotional.coping')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <BrainIcon className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">{t('specializations.learning.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {t('specializations.learning.description')}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.learning.reading')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.learning.math')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.learning.study')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <UserCheckIcon className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle className="text-xl">{t('specializations.developmental.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {t('specializations.developmental.description')}
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.developmental.early')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.developmental.milestone')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('specializations.developmental.family')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('platform.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('platform.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('platform.scheduling.title')}</h3>
              <p className="text-gray-600">
                {t('platform.scheduling.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('platform.telehealth.title')}</h3>
              <p className="text-gray-600">
                {t('platform.telehealth.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardListIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('platform.progress.title')}</h3>
              <p className="text-gray-600">
                {t('platform.progress.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquareIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('platform.messaging.title')}</h3>
              <p className="text-gray-600">
                {t('platform.messaging.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('platform.verified.title')}</h3>
              <p className="text-gray-600">
                {t('platform.verified.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('platform.familySupport.title')}</h3>
              <p className="text-gray-600">
                {t('platform.familySupport.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <PageCta title={t('cta.title')} subtitle={t('cta.subtitle')}>
        <Link href="/auth/register">
          <ShimmerButton background="rgba(196, 30, 52, 1)" className="text-base px-6 py-3 font-semibold">
            {t('cta.findTherapist')}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </ShimmerButton>
        </Link>
        <Link href="/contact">
          <Button size="lg" variant="outline" className="border-brand-coral text-brand-coral hover:bg-brand-coral-tint">
            {t('cta.contactUs')}
          </Button>
        </Link>
      </PageCta>
    </div>
  );
}

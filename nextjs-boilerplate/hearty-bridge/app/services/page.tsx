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

export default function ServicesPage() {
  const t = useTranslations('services');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('hero.title')}</h1>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('pricing.individual.title')}</CardTitle>
                <div className="text-3xl font-bold text-gray-900 mt-2">{t('pricing.individual.price')}</div>
                <p className="text-gray-500">{t('pricing.individual.period')}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.individual.oneOnOne')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.individual.treatment')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.individual.tracking')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.individual.communication')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white">{t('pricing.monthly.popular')}</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('pricing.monthly.title')}</CardTitle>
                <div className="text-3xl font-bold text-gray-900 mt-2">{t('pricing.monthly.price')}</div>
                <p className="text-gray-500">{t('pricing.monthly.period')}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.monthly.everything')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.monthly.priority')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.monthly.reports')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.monthly.resources')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-green-600 font-medium">{t('pricing.monthly.save')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('pricing.insurance.title')}</CardTitle>
                <div className="text-3xl font-bold text-gray-900 mt-2">{t('pricing.insurance.price')}</div>
                <p className="text-gray-500">{t('pricing.insurance.period')}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.insurance.accept')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.insurance.billing')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.insurance.verification')}
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {t('pricing.insurance.authorization')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="bg-white text-teal-600 hover:bg-gray-100">
                {t('cta.findTherapist')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-green-700">
                {t('cta.contactUs')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

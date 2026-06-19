"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  MessageSquareIcon,
  HeartIcon,
  SendIcon
} from "lucide-react";
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('contact');

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const successAlert = t('form.successAlert');

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert(successAlert);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <MessageSquareIcon className="h-16 w-16 text-green-200 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('hero.title')}</h1>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('info.title')}</h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('info.subtitle')}
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailIcon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('info.email.label')}</h3>
                    <p className="text-gray-600">{t('info.email.address')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('info.email.note')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('info.phone.label')}</h3>
                    <p className="text-gray-600">{t('info.phone.number')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('info.phone.hours')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('info.emergency.label')}</h3>
                    <p className="text-gray-600">{t('info.emergency.availability')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('info.emergency.note')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('info.office.label')}</h3>
                    <p className="text-gray-600">
                      {t('info.office.address')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HeartIcon className="h-5 w-5 text-teal-600 mr-2" />
                  {t('form.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.fullName')} *
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t('form.fullNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.email')} *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t('form.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.phone')}
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t('form.phonePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.subject')} *
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                      >
                        <option value="">{t('form.subjectPlaceholder')}</option>
                        <option value="general">{t('form.subjects.general')}</option>
                        <option value="therapist">{t('form.subjects.therapist')}</option>
                        <option value="platform">{t('form.subjects.platform')}</option>
                        <option value="billing">{t('form.subjects.billing')}</option>
                        <option value="technical">{t('form.subjects.technical')}</option>
                        <option value="feedback">{t('form.subjects.feedback')}</option>
                        <option value="partnership">{t('form.subjects.partnership')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.message')} *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder={t('form.messagePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 resize-vertical"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      t('form.sending')
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        {t('form.send')}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    {t('form.privacy')}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('faq.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('faq.q1.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('faq.q1.answer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('faq.q2.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('faq.q2.answer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('faq.q3.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('faq.q3.answer')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('faq.q4.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('faq.q4.answer')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Notice */}
      <section className="bg-red-50 border-t-4 border-red-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">{t('crisis.title')}</h3>
            <p className="text-red-700 mb-4">
              {t('crisis.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6">
              <p className="text-red-800 font-medium">
                {t('crisis.emergency')}
              </p>
              <p className="text-red-800 font-medium">
                {t('crisis.hotline')}
              </p>
              <p className="text-red-800 font-medium">
                {t('crisis.text')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

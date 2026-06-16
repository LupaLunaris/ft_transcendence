/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* LoginPage.tsx                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { useToast } from '@/components/ui/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@ft/shared';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading)
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" className="text-deep-400" />
      </div>
    );
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = (err as ApiError).error ?? t('login_page.login_error');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Language selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>      
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-fantasy text-deep-300 text-3xl tracking-widest mb-2">
            Guilds of the Deep
          </h1>
          <p className="text-white/50 text-sm">
            {t('common.welcome')}
          </p>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">
            {t('common.login')}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('common.mail_placeholder')}
              required
              autoComplete="email"
            />
            <Input
              label={t('common.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              {t('common.connect')}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-white/50">
            {t('login_page.no_account')}{' '}
            <Link
              to="/register"
              className="text-deep-300 hover:text-deep-200 transition-colors font-medium"
            >
              {t('common.to_register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

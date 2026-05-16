/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* RegisterPage.tsx                                     :+:      :+:    :+:   */
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

export function RegisterPage() {
  const { user, register, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (authLoading)
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" className="text-deep-400" />
      </div>
    );
  if (user) return <Navigate to="/" replace />;

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!/^[a-zA-Z0-9]{3,20}$/.test(username))
      next.username = 'Doit contenir entre 3 et 20 caractères alphanumériques';
    if (!email.includes('@'))
      next.email = 'Email invalide';
    if (password.length < 8)
      next.password = 'Au moins 8 caractères requis';
    if (password !== confirm)
      next.confirm = 'Les mots de passe ne correspondent pas';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err) {
      const msg = (err as ApiError).error ?? 'Échec de l\'inscription';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-fantasy text-deep-300 text-3xl tracking-widest mb-2">
            Guilds of the Deep
          </h1>
          <p className="text-white/50 text-sm">Rejoignez l'aventure</p>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Inscription</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Nom d'aventurier"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="HeroOfTheDeep"
              error={errors.username}
              autoComplete="username"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aventurier@exemple.com"
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              error={errors.confirm}
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Créer mon compte
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-white/50">
            Déjà inscrit ?{' '}
            <Link
              to="/login"
              className="text-deep-300 hover:text-deep-200 transition-colors font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

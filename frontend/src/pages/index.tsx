import Head from 'next/head'
import { useState } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'

import SignInForm from '@/components/user/SignInForm'
import SignUpForm from '@/components/user/SignUpForm'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export default function Home() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')

  return (
    <>
      <Head>
        <title>Paggo OCR Case</title>
        <meta name="description" content="Upload de nota fiscal com OCR e LLM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Wrapper que centraliza apenas a página de login/signup */}
        <div className="auth-wrapper">
          <div className="auth-card">
            {/* Lado esquerdo */}
            <div className="auth-card__info">
              <h1>Paggo OCR Case</h1>
              <h2>Faça login ou cadastre-se para continuar</h2>
              <div className="auth-card__tabs">
                <div
                  className={`tab ${mode === 'signIn' ? 'tab--active-signin' : ''}`}
                  onClick={() => setMode('signIn')}
                >
                  Sign In
                </div>
                <div
                  className={`tab ${mode === 'signUp' ? 'tab--active-signup' : ''}`}
                  onClick={() => setMode('signUp')}
                >
                  Sign Up
                </div>
              </div>
            </div>

            {/* Lado direito */}
            <div className="auth-card__form">
              {mode === 'signIn' ? (
                <SignInForm />
              ) : (
                <SignUpForm onSuccess={() => setMode('signIn')} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
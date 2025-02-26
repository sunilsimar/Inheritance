'use client'

import { AppHero } from '../ui/ui-layout'
import React from 'react';
import { Shield, Clock, Coins, ArrowRight, ChevronDown, ChevronUp, Lock, Wallet, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const links: { label: string; href: string }[] = [
  { label: 'Solana Docs', href: 'https://docs.solana.com/' },
  { label: 'Solana Faucet', href: 'https://faucet.solana.com/' },
  { label: 'Solana Cookbook', href: 'https://solanacookbook.com/' },
  { label: 'Solana Stack Overflow', href: 'https://solana.stackexchange.com/' },
  { label: 'Solana Developers GitHub', href: 'https://github.com/solana-developers/' },
]

export default function DashboardFeature() {
  return (
    <div>
      <LandingPage/>
    </div>
  )
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const router = useRouter();

  const faqs = [
    {
      question: "How does the inheritance system work?",
      answer: "Our platform enables you to delegate SPL tokens and Token-2022 tokens (including Wrapped SOL) to designated beneficiaries. You set a time duration and maintain control through regular check-ins. The transfer only occurs if you miss your check-in period."
    },
    {
      question: "What happens if I miss a check-in?",
      answer: "If you miss a check-in, you still retain control over your assets during the grace period. You can either perform a check-in to reset the timer or remove the delegation entirely, ensuring complete control over your assets."
    },
    {
      question: "Can I modify my delegation plan?",
      answer: "Yes, you have full control over your delegations. You can update beneficiaries, adjust check-in periods, modify token amounts, or remove delegations entirely at any time while your account is active."
    },
    {
      question: "What types of tokens can I delegate?",
      answer: "Currently, our platform supports all SPL tokens, Token-2022 tokens, and Wrapped SOL. You can create multiple delegations with different tokens and beneficiaries."
    },
    {
      question: "Is my delegation secure?",
      answer: "Yes, our Programs(Smart Contracts) are built on Solana's secure blockchain. You maintain full control through manual check-ins, and delegations can be removed even after expiry. Beneficiaries can only claim tokens after the set duration has passed."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        {/* Enhanced Background Gradients */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-sky-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-600/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-medium bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                Powered by Solana
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
              The Future of Digital Asset Inheritance
            </h1>
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
            A secure platform for delegating your Solana tokens with time-based transfer controls, ensuring your digital assets reach their intended beneficiaries.
            </p>
            {/* <div className="flex items-center justify-center gap-4">
              <button className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                Launch App <ArrowUpRight className="w-4 h-4" />
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/10">
                View Documentation
              </button>
            </div> */}
          </div>

          {/* Stats Section */}
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-sky-400">$10M+</div>
              <div className="text-xs text-gray-400 mt-1">Assets Secured</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-sky-400">5,000+</div>
              <div className="text-xs text-gray-400 mt-1">Active Users</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-sky-400">99.9%</div>
              <div className="text-xs text-gray-400 mt-1">Uptime</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5">
              <div className="text-2xl font-bold text-sky-400">0.1s</div>
              <div className="text-xs text-gray-400 mt-1">Avg. Transaction</div>
            </div>
          </div> */}

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-20">
            <div className="group bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                Secure Inheritance
                <Lock className="w-4 h-4 text-sky-400" />
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
              Set up token delegations with customizable time-locks and beneficiary assignments.
              </p>
            </div>

            <div className="group bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors">
                <Clock className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                Time-Based Transfer
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
              Maintain control with manual check-ins and flexible duration settings for each delegation.
              </p>
            </div>

            <div className="group bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors">
                <Wallet className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                Asset Management
                <Coins className="w-4 h-4 text-sky-400" />
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
              Delegate SPL tokens, Token-2022 tokens, and Wrapped SOL with full control over your assets.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-400 text-sm max-w-xl mx-auto">
                Our platform simplifies digital inheritance through a secure, automated process
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Make sure all boxes have consistent height and padding */}
              <div className="relative h-full">
                <div className="bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300 h-full">
                  <div className="absolute -top-3 left-4 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <h3 className="text-base font-semibold mb-2 mt-2">Set Up Inheritance</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                  Connect your wallet and create token delegations with chosen beneficiaries and durations.
                  </p>
                </div>
              </div>

              <div className="relative h-full">
                <div className="bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300 h-full">
                  <div className="absolute -top-3 left-4 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="text-base font-semibold mb-2 mt-2">Regular Check-ins</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                  Maintain control with regular check-ins or remove delegations at any time.
                  </p>
                </div>
              </div>

              <div className="relative h-full">
                <div className="bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300 h-full">
                  <div className="absolute -top-3 left-4 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <h3 className="text-base font-semibold mb-2 mt-2">Secure Transfer</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                  Beneficiaries can claim tokens only after the set duration has passed without a check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-400 text-sm max-w-xl mx-auto">
                Everything you need to know about our digital inheritance platform
              </p>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[#0A0B0F] rounded-lg border border-gray-800/50 overflow-hidden transition-all duration-200 hover:border-sky-500/50"
                >
                  <button
                    className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-800/50"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 py-4 border-t border-gray-800/50">
                      <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24">
            <div className="bg-[#0A0B0F] rounded-xl p-8 border border-gray-800/50 relative overflow-hidden group hover:border-sky-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent opacity-50 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Set Up Your Token Delegation?</h2>
                <p className="text-sm text-gray-400 mb-6 max-w-xl mx-auto leading-relaxed">
                Create secure, time-locked token delegations on Solana with full control over your assets.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                   onClick={() => router.push('/inheritance')}>
                    Get Started 
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-24 pt-6 border-t border-gray-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Proudly Built on Solana</span>
              </div>
              <div className="flex gap-4 text-gray-400">
                {/* <a href="#" className="text-xs hover:text-sky-400 transition-colors">Terms</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Privacy</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Documentation</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Security</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Contact</a> */}
                <a href="https://github.com/sunilsimar/inheritance" className="text-xs hover:text-sky-400 transition-colors">GitHub</a>

              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} Digital Legacy. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

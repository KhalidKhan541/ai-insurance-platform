import Link from 'next/link';
import { Shield } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">
              Insure<span className="text-cyan-300">AI</span>
            </span>
          </Link>

          <h1 className="text-4xl font-bold leading-tight mb-6">
            Smart insurance
            <br />
            powered by AI
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-md">
            Join over 2 million people who trust InsureAI for faster claims,
            better coverage, and instant quotes.
          </p>

          <div className="mt-12 space-y-6">
            {[
              'Get covered in under 60 seconds',
              'AI claims processed in minutes',
              'Save up to 35% vs traditional insurers',
              '24/7 intelligent support',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-4">
            <div className="flex -space-x-2">
              {['bg-blue-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-purple-400'].map(
                (color, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full ${color} border-2 border-blue-700 flex items-center justify-center text-xs font-semibold text-white`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                )
              )}
            </div>
            <div>
              <div className="text-sm font-medium">2M+ happy customers</div>
              <div className="text-xs text-blue-200">Join them today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-center py-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Insure<span className="text-blue-600">AI</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md animate-fade-in">
            {children}
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center py-6 border-t border-slate-200 text-xs text-slate-500">
          <p>© 2024 InsureAI. Protected by 256-bit encryption.</p>
        </div>
      </div>
    </div>
  );
}

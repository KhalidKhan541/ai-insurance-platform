import Link from 'next/link';
import {
  Shield,
  Zap,
  Brain,
  Clock,
  ChevronRight,
  Star,
  CheckCircle2,
  ArrowRight,
  Heart,
  Car,
  Home,
  TrendingUp,
  Users,
  Award,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Claims',
    description:
      'Our AI reviews and processes claims in minutes, not weeks. Upload documents and get instant decisions.',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    icon: Zap,
    title: 'Instant Quotes',
    description:
      'Get personalized insurance quotes in under 60 seconds. No paperwork, no waiting on hold.',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  {
    icon: Shield,
    title: 'Smart Coverage',
    description:
      'AI analyzes your lifestyle to recommend the perfect coverage. Overpaying? We\'ll find you savings.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description:
      'Always-on AI assistant plus human experts when you need them. File claims anytime, anywhere.',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
];

const insuranceTypes = [
  {
    icon: Car,
    title: 'Auto Insurance',
    description: 'Comprehensive coverage for your vehicle with AI-assisted accident reporting.',
    premium: 'From $45/mo',
  },
  {
    icon: Home,
    title: 'Home Insurance',
    description: 'Protect your home and belongings with smart risk assessment technology.',
    premium: 'From $65/mo',
  },
  {
    icon: Heart,
    title: 'Life Insurance',
    description: 'Secure your family\'s future with personalized life insurance plans.',
    premium: 'From $25/mo',
  },
  {
    icon: TrendingUp,
    title: 'Business Insurance',
    description: 'Scalable coverage that grows with your business. From startups to enterprises.',
    premium: 'Custom',
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Small Business Owner',
    content:
      'Filed a claim on Sunday night, approved by Monday morning. The AI processed everything while I slept. Incredible experience.',
    rating: 5,
    avatar: 'SM',
  },
  {
    name: 'James Rodriguez',
    role: 'Software Engineer',
    content:
      'Switched from my old insurer and saved $120/month. The quote process took 45 seconds. I wish I had done this sooner.',
    rating: 5,
    avatar: 'JR',
  },
  {
    name: 'Emily Chen',
    role: 'Marketing Director',
    content:
      'The AI recommended exactly the right coverage for my situation. No upselling, just honest, smart advice.',
    rating: 5,
    avatar: 'EC',
  },
];

const stats = [
  { value: '2M+', label: 'Policies Managed' },
  { value: '< 4min', label: 'Average Claim Time' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '35%', label: 'Average Savings' },
];

const steps = [
  {
    step: '01',
    title: 'Answer a Few Questions',
    description:
      'Our AI asks smart questions about your needs. Takes less than a minute.',
  },
  {
    step: '02',
    title: 'Get Your AI Quote',
    description:
      'Receive a personalized quote instantly, with coverage recommendations tailored to you.',
  },
  {
    step: '03',
    title: 'Get Covered',
    description:
      'Accept your quote and you\'re covered immediately. Digital policy delivered to your inbox.',
  },
];

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Insure<span className="text-blue-600">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#insurance" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Insurance
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Testimonials
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary btn-sm"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-60" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
            <Zap className="w-4 h-4" />
            Powered by Advanced AI Technology
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Insurance that{' '}
            <span className="text-gradient">thinks ahead</span> for you
          </h1>

          <p className="mt-6 text-lg text-slate-600 text-pretty max-w-2xl mx-auto">
            Get instant quotes, file claims in seconds, and let our AI find you the best coverage.
            No paperwork. No phone trees. Just smart insurance that works.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/quotes" className="btn-primary btn-lg">
              Get Your Free Quote
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary btn-lg">
              See How It Works
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-lg mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
            Why choose InsureAI?
          </h2>
          <p className="mt-4 text-slate-600">
            We combine cutting-edge AI with insurance expertise to deliver a
            completely new experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card group hover:shadow-lg transition-all duration-300"
            >
              <div className="card-body">
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsuranceTypesSection() {
  return (
    <section id="insurance" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
            Coverage for everything that matters
          </h2>
          <p className="mt-4 text-slate-600">
            From your car to your family, we've got you covered with AI-optimized policies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insuranceTypes.map((type) => (
            <div
              key={type.title}
              className="card group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <type.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  {type.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600">
                    {type.premium}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
            Get covered in 3 simple steps
          </h2>
          <p className="mt-4 text-slate-600">
            Our AI-powered process makes getting insurance as easy as ordering coffee.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.step} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-blue-100" />
              )}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-6 shadow-lg shadow-blue-600/30">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
            Loved by thousands
          </h2>
          <p className="mt-4 text-slate-600">
            See what our customers have to say about their experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="card">
              <div className="card-body">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-md bg-blue-600 text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 lg:p-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to save on insurance?
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
              Join over 2 million customers who trust InsureAI for smarter, faster, and more
              affordable insurance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quotes"
                className="btn bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              >
                Get Your Free Quote
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/register"
                className="btn bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = {
    Products: [
      { label: 'Auto Insurance', href: '#' },
      { label: 'Home Insurance', href: '#' },
      { label: 'Life Insurance', href: '#' },
      { label: 'Business Insurance', href: '#' },
    ],
    Company: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Blog', href: '#' },
    ],
    Support: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'File a Claim', href: '/claims' },
      { label: 'FAQs', href: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'License', href: '#' },
      { label: 'Security', href: '#' },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Insure<span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              AI-powered insurance that's faster, smarter, and more affordable. Get covered in
              minutes, not days.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <span className="text-xs font-medium">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider mt-12 mb-8 border-slate-800" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2024 InsureAI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              SOC 2 Compliant
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Award className="w-4 h-4 text-blue-500" />
              A+ BBB Rating
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="w-4 h-4 text-purple-500" />
              2M+ Customers
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <InsuranceTypesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Landmark,
  FileText,
  Receipt,
  Calculator,
  Users,
  Building2,
  Percent,
  BarChart3,
  Shield,
  Clock,
  Globe,
  Smartphone,
  Check,
  ArrowRight,
} from 'lucide-react'

const features = [
  {
    icon: Receipt,
    title: 'UAE VAT Compliant',
    description: 'Full VAT support with FTA-compliant invoices, Form 201 reporting, and FAF export functionality.',
  },
  {
    icon: Calculator,
    title: 'Corporate Tax Ready',
    description: 'Built-in corporate tax calculations with 9% rate support, threshold exemptions, and provision entries.',
  },
  {
    icon: Users,
    title: 'WPS Payroll',
    description: 'Complete payroll management with WPS SIF file generation, gratuity calculations, and payslip generation.',
  },
  {
    icon: FileText,
    title: 'Professional Invoicing',
    description: 'Create bilingual invoices with QR codes, automatic VAT calculations, and PDF export.',
  },
  {
    icon: Building2,
    title: 'Banking & Reconciliation',
    description: 'Connect bank accounts, import transactions, and reconcile with AI-powered categorization.',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    description: 'Comprehensive reporting with P&L, Balance Sheet, Cash Flow, and custom reports.',
  },
  {
    icon: Percent,
    title: 'Multi-Tax Support',
    description: 'Handle VAT, withholding tax, and custom tax rates with detailed tracking and reporting.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with encrypted data storage and automatic backups.',
  },
]

const industries = [
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Retail', icon: '🛒' },
  { name: 'Trading', icon: '📦' },
  { name: 'Construction', icon: '🏗️' },
  { name: 'Real Estate', icon: '🏢' },
  { name: 'Hospitality', icon: '🏨' },
  { name: 'Professional Services', icon: '💼' },
  { name: 'Manufacturing', icon: '🏭' },
]

const pricing = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For small businesses just getting started',
    features: [
      '1 Company',
      '100 Invoices/month',
      'Basic reporting',
      'Email support',
      'UAE VAT support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Business',
    price: 'AED 149',
    period: '/month',
    description: 'For growing businesses',
    features: [
      '3 Companies',
      'Unlimited invoices',
      'Advanced reporting',
      'Payroll (10 employees)',
      'Bank integration',
      'Priority support',
    ],
    cta: 'Start Trial',
    popular: true,
  },
  {
    name: 'Professional',
    price: 'AED 299',
    period: '/month',
    description: 'For established businesses',
    features: [
      '5 Companies',
      'Unlimited invoices',
      'Full reporting suite',
      'Payroll (50 employees)',
      'Multi-currency',
      'API access',
      'Dedicated support',
    ],
    cta: 'Start Trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'AED 599',
    period: '/month',
    description: 'For large organizations',
    features: [
      'Unlimited companies',
      'Unlimited everything',
      'White-label option',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const testimonials = [
  {
    quote: "UAE Books transformed our accounting workflow. The VAT reporting is incredibly accurate and saves us hours every month.",
    author: "Ahmed Al Rashid",
    role: "CFO, Dubai Trading Co.",
    avatar: "AR",
  },
  {
    quote: "The WPS payroll integration is seamless. We process 200+ employees in minutes instead of days.",
    author: "Sarah Johnson",
    role: "HR Director, Healthcare Group",
    avatar: "SJ",
  },
  {
    quote: "Best investment we made this year. The bilingual invoices impress our clients across the region.",
    author: "Mohammed Hassan",
    role: "Owner, Construction Services",
    avatar: "MH",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Landmark className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">UAE Books</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4" variant="secondary">
              🇦🇪 Built for UAE Businesses
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The Only Accounting Software{' '}
              <span className="text-primary">Built for UAE Businesses</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              VAT-compliant invoicing, Corporate Tax calculations, WPS payroll, and comprehensive
              financial reporting — all in one powerful platform designed for the UAE market.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  See Features
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        </div>
      </section>

      {/* Industry Selection */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Industry-Specific Solutions</h2>
            <p className="text-muted-foreground">
              Pre-configured Chart of Accounts and templates for your industry
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {industries.map((industry) => (
              <Card
                key={industry.name}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              >
                <CardContent className="flex flex-col items-center gap-2 p-4">
                  <span className="text-3xl">{industry.icon}</span>
                  <span className="text-sm font-medium text-center">{industry.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Manage Your Finances</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive accounting features designed specifically for UAE businesses,
              with full compliance to local regulations.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-all hover:shadow-md">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">
              Choose the plan that fits your business needs
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by UAE Businesses</h2>
            <p className="text-muted-foreground">
              See what our customers have to say about UAE Books
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author}>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Accounting?</h2>
          <p className="mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
            Join thousands of UAE businesses already using UAE Books to streamline their
            financial operations and stay compliant with local regulations.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Landmark className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">UAE Books</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} UAE Books. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

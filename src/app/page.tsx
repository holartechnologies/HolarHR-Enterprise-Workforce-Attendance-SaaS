import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Shield, BarChart3, Users, Brain, CreditCard, Menu, X, Check } from "lucide-react";

const features = [
  { icon: Clock, title: "Time Tracking", description: "Clock in/out with GPS, QR codes, and break management" },
  { icon: Users, title: "Employee Management", description: "Complete employee lifecycle management" },
  { icon: BarChart3, title: "Reports & Analytics", description: "Real-time attendance reports and insights" },
  { icon: Shield, title: "Multi-tenant Security", description: "Enterprise-grade data isolation and RBAC" },
  { icon: Brain, title: "AI-Powered Insights", description: "Smart attendance predictions and HR analytics" },
  { icon: CreditCard, title: "Simple Billing", description: "Flexible plans that scale with your business" },
];

const plans = [
  { name: "Free", price: "$0", desc: "Perfect for small teams", features: ["3 employees", "1 branch", "Basic reports", "Email support"] },
  { name: "Starter", price: "$29", desc: "For growing businesses", features: ["25 employees", "2 branches", "Advanced reports", "Email support"] },
  { name: "Business", price: "$99", desc: "For established orgs", features: ["250 employees", "10 branches", "QR & GPS attendance", "API access"] },
  { name: "Enterprise", price: "$299", desc: "For large enterprises", features: ["Unlimited employees", "Unlimited branches", "AI features", "Priority support"] },
];

const faqs = [
  { q: "How does the free trial work?", a: "Start with our Free plan — no credit card required. Upgrade anytime as your team grows." },
  { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately." },
  { q: "Is my data secure?", a: "Enterprise-grade security with data isolation, encryption, and RBAC permissions." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Clock className="h-6 w-6 text-primary" />
            <span>HolarHR</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About</Link>
            <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/register"><Button>Register</Button></Link>
          </div>
        </div>
      </header>

      <section id="home" className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Enterprise Workforce<br />
          <span className="text-primary">Attendance Platform</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Track attendance, manage employees, generate reports, and get AI-powered insights.
          All in one secure, multi-tenant platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">Start Free Trial</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">Sign In</Button>
          </Link>
        </div>
      </section>

      <section id="features" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage attendance</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-xl border bg-background">
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Choose the plan that fits your team. Upgrade anytime.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className="p-6 rounded-xl border bg-background flex flex-col">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                <div className="text-3xl font-bold mb-6">{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full" variant={plan.name === "Free" ? "outline" : "default"}>
                    {plan.name === "Free" ? "Get Started" : "Subscribe"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">About HolarHR</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            HolarHR is a modern workforce attendance platform built for enterprises that need reliable,
            secure, and scalable time tracking. We combine real-time clocking, AI-powered insights,
            and flexible integrations to help businesses of all sizes manage their workforce efficiently.
          </p>
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div><div className="text-3xl font-bold text-primary">99.9%</div><div className="text-sm text-muted-foreground">Uptime</div></div>
            <div><div className="text-3xl font-bold text-primary">10k+</div><div className="text-sm text-muted-foreground">Users</div></div>
            <div><div className="text-3xl font-bold text-primary">50+</div><div className="text-sm text-muted-foreground">Countries</div></div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24">
        <div className="container mx-auto px-4 text-center max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Get in touch</h2>
          <p className="text-muted-foreground mb-8">Have questions? Reach out to our team.</p>
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-lg border">
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">hello@holarhr.com</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="font-medium">Address</p>
              <p className="text-sm text-muted-foreground">123 Business Ave, Suite 100, Lagos, Nigeria</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <span>HolarHR</span>
              </div>
              <p className="text-sm text-muted-foreground">Enterprise workforce attendance platform.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#about" className="hover:text-primary transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/" className="hover:text-primary transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Register</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HolarHR. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

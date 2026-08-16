import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Droplets,
  FileImage,
  HeartPulse,
  Info,
  Leaf,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  ScanLine,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  UserRound,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Profile = {
  age: string;
  gender: string;
  height: string;
  weight: string;
  conditions: string[];
  allergies: string[];
  restrictions: string[];
  dietPreference: string;
  avoidFoods: string[];
  preferredFoods: string[];
};

type Nutrition = {
  calories: string;
  carbs: string;
  sugar: string;
  protein: string;
  fat: string;
  saturatedFat: string;
  sodium: string;
  fiber: string;
  portion: string;
};

type Alternative = {
  name: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  sodium: string;
  rationale: string;
  tags: string[];
};

type Scan = {
  image: string | null;
  detectedFood: string;
  confidence: number;
  nutrition: Nutrition;
  ingredients: string[];
  status: 'ready' | 'analyzing' | 'complete';
};

const DISCLAIMER =
  'Food Health Advisor provides AI-generated general nutrition information and is not a medical diagnostic or treatment tool. Nutritional information obtained from an image is an estimate and may vary based on ingredients, preparation method, and portion size. If you have a medical condition, food allergy, or medically prescribed diet, consult a qualified healthcare professional before making dietary changes.';

const CONDITION_OPTIONS = [
  'Diabetes',
  'High blood pressure',
  'High cholesterol',
  'Heart disease',
  'Weight management',
  'Kidney-related dietary restrictions',
  'Food allergies',
  'Other dietary restrictions',
];

const TAG_OPTIONS = ['Dairy', 'Nuts', 'Shellfish', 'Gluten', 'Soy', 'Added sugar'];
const RESTRICTION_OPTIONS = ['Low sodium', 'Gluten-free', 'Dairy-free', 'Low carb', 'Halal', 'Kosher'];

const demoProfile: Profile = {
  age: '38',
  gender: '',
  height: '',
  weight: '',
  conditions: ['Diabetes', 'High blood pressure', 'Weight management'],
  allergies: [],
  restrictions: ['Low sodium'],
  dietPreference: 'Non-vegetarian',
  avoidFoods: ['Sugary drinks'],
  preferredFoods: ['Chicken', 'Leafy greens'],
};

const demoNutrition: Nutrition = {
  calories: '640 kcal',
  carbs: '72 g',
  sugar: '5 g',
  protein: '29 g',
  fat: '24 g',
  saturatedFat: '6 g',
  sodium: '780 mg',
  fiber: '4 g',
  portion: '1 large plate · about 420 g',
};

const demoScan: Scan = {
  image: 'demo',
  detectedFood: 'Chicken Biryani',
  confidence: 91,
  nutrition: demoNutrition,
  ingredients: ['Rice', 'Chicken', 'Oil or ghee', 'Salt', 'Spices', 'Fried onions', 'Yogurt'],
  status: 'complete',
};

const alternatives: Alternative[] = [
  {
    name: 'Boiled egg + vegetable salad',
    calories: '310 kcal',
    carbs: '16 g',
    protein: '20 g',
    fat: '18 g',
    sodium: '220 mg',
    rationale: 'Higher protein and a lower carbohydrate load than a rice-heavy meal, with vegetables and fiber to round it out.',
    tags: ['Lower carb', 'High protein'],
  },
  {
    name: 'Grilled chicken + vegetables',
    calories: '380 kcal',
    carbs: '18 g',
    protein: '36 g',
    fat: '16 g',
    sodium: '290 mg',
    rationale: 'A protein-forward plate that can be prepared with little added salt and plenty of non-starchy vegetables.',
    tags: ['Lower sodium', 'High protein'],
  },
  {
    name: 'Chicken salad with greens',
    calories: '340 kcal',
    carbs: '20 g',
    protein: '31 g',
    fat: '17 g',
    sodium: '260 mg',
    rationale: 'Keeps the familiar chicken while adding volume and fiber without relying on a large rice portion.',
    tags: ['Fiber-rich', 'Balanced'],
  },
];

const conditionNotes: Record<string, { status: string; tone: string; explanation: string }> = {
  Diabetes: {
    status: 'Caution',
    tone: 'amber',
    explanation: 'The rice portion may provide a high carbohydrate load, especially in a large serving.',
  },
  'High blood pressure': {
    status: 'Caution',
    tone: 'amber',
    explanation: 'Sodium content can vary considerably depending on preparation, seasoning and sides.',
  },
  'Weight management': {
    status: 'Caution',
    tone: 'amber',
    explanation: 'Large portions can be calorie-dense even when the meal includes a useful protein source.',
  },
  'High cholesterol': {
    status: 'Watch',
    tone: 'blue',
    explanation: 'Oil, ghee and fried onions can change the total fat profile from one recipe to another.',
  },
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
      <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary shadow-sm">
        <Leaf size={19} strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-semibold tracking-tight">Food Health</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Advisor</span>
        </span>
      )}
    </Link>
  );
}

function Header() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { href: '/', label: 'Overview', icon: Activity },
    { href: '/scan', label: 'Scan food', icon: ScanLine },
    { href: '/profile', label: 'Health profile', icon: UserRound },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${location === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:flex"
            data-testid="link-profile-summary"
          >
            <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-accent-foreground"><UserRound size={13} /></span>
            Your profile
            <ChevronRight size={14} />
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            data-testid="button-toggle-menu"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-border bg-card px-5 py-3 md:hidden" aria-label="Mobile navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 border-b border-border/70 py-3 text-sm font-semibold last:border-0"
              data-testid={`link-mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
            >
              <Icon size={17} className="text-accent-foreground" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-[100dvh] text-foreground">
      <Header />
      <main>{children}</main>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-4 border-t border-border/70 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="flex items-center gap-2"><Leaf size={14} className="text-accent-foreground" /> Guidance for everyday food decisions.</div>
        <div className="flex items-center gap-4"><Link href="/profile" className="hover:text-foreground" data-testid="link-footer-profile">Edit profile</Link><span>Private by design · Demo mode</span></div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 font-mono-ui text-[10px] font-bold uppercase tracking-[0.22em] text-accent-foreground">{eyebrow}</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
        {detail && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function ButtonLink({ href, children, secondary = false, className = '', testId }: { href: string; children: ReactNode; secondary?: boolean; className?: string; testId: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${secondary ? 'border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90'} ${className}`}
      data-testid={testId}
    >
      {children}
    </Link>
  );
}

function HomePage({ profile, scan }: { profile: Profile; scan: Scan }) {
  const hasProfile = profile.conditions.length > 0 || profile.age.length > 0;
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
      <section className="relative grid overflow-hidden border-x border-border/60 lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative z-10 flex flex-col justify-center px-1 py-16 sm:py-24 lg:px-8 lg:py-28">
          <div className="animate-in-up mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-foreground">
            <Sparkles size={14} /> A little more clarity, every meal
          </div>
          <h1 className="animate-in-up text-balance max-w-3xl font-display text-[clamp(3.35rem,8vw,7.5rem)] font-semibold leading-[.91] tracking-[-.065em]">
            Feel good<br /><span className="text-accent-foreground">about your</span><br />next bite.
          </h1>
          <p className="animate-in-up-delay mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Scan a meal, see the nutrition estimate, and understand how it may fit your health profile — without the fear or guesswork.
          </p>
          <div className="animate-in-up-delay mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/scan" testId="button-home-scan"><Camera size={18} /> Scan your food <ArrowRight size={16} /></ButtonLink>
            <ButtonLink href="/profile" secondary testId="button-home-profile">{hasProfile ? 'Edit health profile' : 'Create health profile'}</ButtonLink>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck size={17} className="text-accent-foreground" />
            <span>Evidence-aware guidance. Never a diagnosis.</span>
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden bg-primary lg:min-h-[650px]">
          <div className="scan-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-28 -top-20 size-80 rounded-full border border-secondary/30" />
          <div className="absolute -right-16 -top-8 size-56 rounded-full border border-secondary/25" />
          <div className="absolute bottom-7 left-6 right-6 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 text-primary-foreground backdrop-blur-md sm:left-12 sm:right-12">
            <div className="mb-5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-bold"><span className="size-2 rounded-full bg-secondary" /> Scan insight</span>
              <span className="font-mono-ui opacity-70">01 / 03</span>
            </div>
            <div className="flex gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><UtensilsCrossed size={20} /></div>
              <div>
                <p className="font-display text-xl">Chicken biryani</p>
                <p className="mt-1 text-xs leading-5 text-primary-foreground/70">Caution · rice portion and sodium can vary</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-primary-foreground/15 pt-4 text-xs">
              <span className="text-primary-foreground/70">Image confidence</span><strong className="font-mono-ui text-secondary">91%</strong>
            </div>
          </div>
          <div className="food-art absolute left-1/2 top-[34%] w-[76%] -translate-x-1/2 rounded-[50%] opacity-90 shadow-2xl shadow-black/20 sm:w-[58%]" />
        </div>
      </section>

      <section className="grid gap-4 border-x border-b border-border/60 p-4 sm:grid-cols-3 sm:p-6">
        {[
          { icon: ScanLine, number: '01', title: 'Point & scan', body: 'Use a meal photo or try the demo plate.' },
          { icon: HeartPulse, number: '02', title: 'Make it personal', body: 'Your profile shapes what the insight focuses on.' },
          { icon: Salad, number: '03', title: 'Choose with context', body: 'See practical alternatives, not food rules.' },
        ].map(({ icon: Icon, number, title, body }) => (
          <div key={number} className="group flex gap-4 rounded-2xl p-4 transition hover:bg-card">
            <span className="font-mono-ui text-xs font-bold text-accent-foreground">{number}</span>
            <div><Icon size={19} className="mb-3 text-primary" /><h2 className="font-display text-xl">{title}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{body}</p></div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 py-16 lg:grid-cols-[.72fr_1.28fr] lg:py-24">
        <div>
          <p className="mb-2 font-mono-ui text-[10px] font-bold uppercase tracking-[0.22em] text-accent-foreground">Your corner of calm</p>
          <h2 className="font-display text-4xl font-semibold leading-tight">A dashboard that remembers what matters to you.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Keep your health context close, so every scan starts from a more useful place.</p>
          <ButtonLink href="/profile" secondary className="mt-7" testId="button-home-edit-profile"><Pencil size={15} /> {hasProfile ? 'Review your profile' : 'Start your profile'}</ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="soft-shadow rounded-3xl bg-card p-6 sm:col-span-2">
            <div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Health profile</p><h3 className="mt-2 font-display text-2xl">{hasProfile ? 'A thoughtful starting point' : 'Nothing saved yet'}</h3></div><span className="grid size-10 place-items-center rounded-2xl bg-secondary/30 text-primary"><HeartPulse size={19} /></span></div>
            {hasProfile ? <div className="mt-6 flex flex-wrap gap-2">{profile.conditions.map((condition) => <Pill key={condition} tone="green">{condition}</Pill>)}{profile.restrictions.map((item) => <Pill key={item} tone="sand">{item}</Pill>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Add a few details to make the advice more relevant.</p>}
          </div>
          <Link href="/results" className="lift rounded-3xl border border-border bg-card p-6" data-testid="link-home-last-scan">
            <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-2xl bg-accent/15 text-accent-foreground"><Clock3 size={18} /></span><ArrowRight size={18} className="text-muted-foreground" /></div>
            <p className="mt-8 font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Last scan</p><h3 className="mt-2 font-display text-2xl">{scan.detectedFood}</h3><p className="mt-1 text-sm text-muted-foreground">Eat with caution · {scan.confidence}% confidence</p>
          </Link>
          <div className="rounded-3xl bg-secondary p-6 text-secondary-foreground"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-2xl bg-secondary-foreground/10"><ClipboardList size={18} /></span><span className="font-mono-ui text-xs">TODAY</span></div><p className="mt-8 font-display text-3xl">1 insight</p><p className="mt-1 text-sm opacity-70">Small choices add up.</p></div>
        </div>
      </section>
    </div>
  );
}

function Pill({ children, tone = 'green', removable, onRemove }: { children: ReactNode; tone?: 'green' | 'amber' | 'sand' | 'blue'; removable?: boolean; onRemove?: () => void }) {
  const tones = { green: 'bg-primary/10 text-primary', amber: 'bg-secondary/35 text-secondary-foreground', sand: 'bg-muted text-muted-foreground', blue: 'bg-sky-100 text-sky-800' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${tones[tone]}`}>{children}{removable && <button type="button" onClick={onRemove} aria-label={`Remove ${String(children)}`} className="opacity-60 hover:opacity-100" data-testid={`button-remove-${String(children).toLowerCase().replaceAll(' ', '-')}`}><X size={12} /></button>}</span>;
}

function TagEditor({ label, items, onChange, placeholder, tone = 'green' }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string; tone?: 'green' | 'amber' | 'sand' }) {
  const [value, setValue] = useState('');
  const add = () => { const next = value.trim(); if (next && !items.includes(next)) onChange([...items, next]); setValue(''); };
  return <div><label className="text-sm font-bold">{label}</label><div className="mt-2 flex min-h-12 flex-wrap gap-2 rounded-2xl border border-input bg-card p-2.5 focus-within:border-accent"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} placeholder={items.length ? 'Add another…' : placeholder} className="min-w-[150px] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground/60" data-testid={`input-${label.toLowerCase().replaceAll(' ', '-')}`} /><button type="button" onClick={add} className="grid size-7 place-items-center rounded-lg bg-muted text-foreground hover:bg-secondary" aria-label={`Add ${label}`} data-testid={`button-add-${label.toLowerCase().replaceAll(' ', '-')}`}><Plus size={15} /></button>{items.map((item) => <Pill key={item} tone={tone} removable onRemove={() => onChange(items.filter((current) => current !== item))}>{item}</Pill>)}</div></div>;
}

function ProfilePage({ profile, onSave }: { profile: Profile; onSave: (profile: Profile) => void }) {
  const [draft, setDraft] = useState(profile);
  const setField = (field: keyof Profile, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const toggle = (field: 'conditions' | 'allergies' | 'restrictions', item: string) => setDraft((current) => ({ ...current, [field]: current[field].includes(item) ? current[field].filter((value) => value !== item) : [...current[field], item] }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); };
  const isEmpty = draft.conditions.length === 0 && !draft.age;
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 lg:py-20">
      <SectionHeading eyebrow="Your context" title={isEmpty ? 'Let’s make this personal.' : 'Your health profile.'} detail="A little context helps us focus each scan on what may matter to you. Optional fields can stay blank." action={<Link href="/" className="hidden items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground sm:flex" data-testid="link-profile-back"><ArrowRight size={16} className="rotate-180" /> Back to overview</Link>} />
      {isEmpty && <div className="mb-8 flex gap-3 rounded-2xl border border-secondary/50 bg-secondary/20 p-4 text-sm leading-6 text-secondary-foreground"><Sparkles size={18} className="mt-0.5 shrink-0" /><p><strong>You’re in control.</strong> This profile stays in this demo session and helps us explain food choices in context — it never makes a diagnosis.</p></div>}
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="soft-shadow rounded-3xl bg-card p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">About you</p><h2 className="mt-2 font-display text-2xl">The basics</h2></div><span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound size={19} /></span></div>
            <div className="space-y-5">
              <label className="block text-sm font-bold">Age <span className="font-normal text-muted-foreground">(required)</span><input required type="number" min="1" max="120" value={draft.age} onChange={(event) => setField('age', event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" placeholder="e.g. 38" data-testid="input-age" /></label>
              <label className="block text-sm font-bold">Gender <span className="font-normal text-muted-foreground">(optional)</span><select value={draft.gender} onChange={(event) => setField('gender', event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-accent" data-testid="select-gender"><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold">Height <span className="font-normal text-muted-foreground">(optional)</span><input value={draft.height} onChange={(event) => setField('height', event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-accent" placeholder="cm" data-testid="input-height" /></label><label className="text-sm font-bold">Weight <span className="font-normal text-muted-foreground">(optional)</span><input value={draft.weight} onChange={(event) => setField('weight', event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-accent" placeholder="kg" data-testid="input-weight" /></label></div>
            </div>
          </div>
          <div className="soft-shadow rounded-3xl bg-card p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">What to keep in mind</p><h2 className="mt-2 font-display text-2xl">Health conditions</h2></div><span className="grid size-10 place-items-center rounded-2xl bg-accent/15 text-accent-foreground"><HeartPulse size={19} /></span></div>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">Choose all that are relevant. This does not replace advice from your care team.</p>
            <div className="grid gap-2 sm:grid-cols-2">{CONDITION_OPTIONS.map((item) => <button type="button" key={item} onClick={() => toggle('conditions', item)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${draft.conditions.includes(item) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/35'}`} data-testid={`button-condition-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}<span className={`grid size-5 place-items-center rounded-full border ${draft.conditions.includes(item) ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{draft.conditions.includes(item) && <Check size={12} />}</span></button>)}</div>
          </div>
        </div>
        <div className="soft-shadow grid gap-8 rounded-3xl bg-card p-6 sm:p-8 lg:grid-cols-2">
          <div className="space-y-6"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">Boundaries</p><h2 className="mt-2 font-display text-2xl">Allergies & restrictions</h2></div><TagEditor label="Allergies" items={draft.allergies} onChange={(items) => setDraft({ ...draft, allergies: items })} placeholder="e.g. peanuts" tone="amber" /><div><label className="text-sm font-bold">Dietary restrictions</label><div className="mt-3 flex flex-wrap gap-2">{RESTRICTION_OPTIONS.map((item) => <button type="button" key={item} onClick={() => toggle('restrictions', item)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${draft.restrictions.includes(item) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`} data-testid={`button-restriction-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div></div></div>
          <div className="space-y-6"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">Your way</p><h2 className="mt-2 font-display text-2xl">Preferences</h2></div><div><label className="text-sm font-bold">Vegetarian / non-vegetarian</label><div className="mt-3 grid grid-cols-2 gap-2">{['Vegetarian', 'Non-vegetarian'].map((item) => <button type="button" key={item} onClick={() => setField('dietPreference', item)} className={`rounded-2xl border px-3 py-3 text-sm font-bold ${draft.dietPreference === item ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`} data-testid={`button-diet-${item.toLowerCase()}`}>{item}</button>)}</div></div><TagEditor label="Foods you want to avoid" items={draft.avoidFoods} onChange={(items) => setDraft({ ...draft, avoidFoods: items })} placeholder="e.g. sugary drinks" tone="sand" /><TagEditor label="Foods you prefer" items={draft.preferredFoods} onChange={(items) => setDraft({ ...draft, preferredFoods: items })} placeholder="e.g. leafy greens" /></div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/" className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="link-profile-cancel">Cancel</Link><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90" data-testid="button-save-profile"><Check size={17} /> Save profile <ArrowRight size={16} /></button></div>
      </form>
    </div>
  );
}

function ScanPage({ scan, onChoose, onAnalyze }: { scan: Scan; onChoose: (image: string) => void; onAnalyze: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => onChoose(String(reader.result)); reader.readAsDataURL(file); };
  const analyze = () => { setBusy(true); onAnalyze(); };
  useEffect(() => { if (scan.status === 'complete') setBusy(false); }, [scan.status]);
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 lg:py-20">
      <SectionHeading eyebrow="The daily ritual" title="What’s on your plate?" detail="Take a photo from above for the clearest read. We’ll identify the meal, estimate its nutrition, then add your health context." action={<div className="hidden items-center gap-2 text-xs font-bold text-muted-foreground sm:flex"><ShieldCheck size={15} className="text-accent-foreground" /> Private demo session</div>} />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="soft-shadow overflow-hidden rounded-[2rem] bg-primary p-3 text-primary-foreground sm:p-5">
          <div className="scan-grid relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[1.4rem] border border-primary-foreground/15 px-6 text-center sm:min-h-[510px]">
            {scan.image ? (
              scan.image === 'demo' ? <div className="food-art w-full max-w-[470px] rounded-[50%] shadow-2xl shadow-black/20" data-testid="image-demo-meal" /> : <img src={scan.image} alt="Uploaded meal preview" className="max-h-[390px] max-w-full rounded-3xl object-cover shadow-2xl" data-testid="img-uploaded-meal" />
            ) : <><div className="mb-6 grid size-20 place-items-center rounded-[2rem] border border-primary-foreground/25 bg-primary-foreground/10"><Camera size={33} /></div><h2 className="font-display text-4xl">Scan your food</h2><p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/70">One clear photo is enough to start a useful conversation.</p></>}
            {scan.image && <button type="button" onClick={() => onChoose('')} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-primary-foreground/15 backdrop-blur hover:bg-primary-foreground/25" aria-label="Remove meal image" data-testid="button-remove-image"><X size={17} /></button>}
            <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-left text-xs text-primary-foreground/65">{scan.image ? 'Image ready for a nutrition estimate' : 'Camera access is requested by your device'}</span><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground transition hover:brightness-95" data-testid="button-open-camera"><Camera size={17} /> {scan.image ? 'Replace photo' : 'Open camera'}</button></div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={chooseFile} className="hidden" data-testid="input-food-image" />
        </div>
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="lift flex items-center gap-4 rounded-3xl border border-border bg-card p-5 text-left" data-testid="button-upload-image"><span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-foreground"><Upload size={20} /></span><span className="flex-1"><strong className="block text-sm">Upload a meal photo</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">JPG, PNG or a camera capture</span></span><ChevronRight size={17} className="text-muted-foreground" /></button>
          <button type="button" onClick={() => onChoose('demo')} className={`lift flex items-center gap-4 rounded-3xl border p-5 text-left ${scan.image === 'demo' ? 'border-secondary bg-secondary/20' : 'border-border bg-card'}`} data-testid="button-use-demo-meal"><span className="grid size-12 place-items-center rounded-2xl bg-secondary/60 text-primary"><UtensilsCrossed size={20} /></span><span className="flex-1"><strong className="block text-sm">Use the demo meal</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Chicken biryani · a guided example</span></span>{scan.image === 'demo' ? <Check size={18} className="text-primary" /> : <ChevronRight size={17} className="text-muted-foreground" />}</button>
          <div className="mt-auto rounded-3xl border border-border bg-muted/60 p-5"><div className="flex gap-3"><Info size={18} className="shrink-0 text-accent-foreground" /><p className="text-xs leading-5 text-muted-foreground">Image-based nutrition is an estimate. Ingredients, recipe and portion size can change the result.</p></div><button type="button" onClick={analyze} disabled={!scan.image || busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-analyze-food">{busy ? <><RotateCcw size={17} className="animate-spin" /> Reading your plate…</> : <><Sparkles size={17} /> Analyze my food <ArrowRight size={16} /></>}</button></div>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">If recognition is uncertain, we’ll ask you to confirm before showing a detailed result.</p>
    </div>
  );
}

function LoadingPage() {
  return <div className="mx-auto max-w-[920px] px-5 py-20 sm:px-8 lg:py-28"><div className="mx-auto max-w-md text-center"><div className="mx-auto grid size-20 place-items-center rounded-[2rem] bg-secondary/50 text-primary animate-pulse-soft"><Sparkles size={31} /></div><p className="mt-8 font-mono-ui text-[10px] font-bold uppercase tracking-[0.22em] text-accent-foreground">Reading your plate</p><h1 className="mt-3 font-display text-4xl font-semibold">A moment of context.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Looking for the meal, its likely nutrition, and the details that matter to your profile.</p><div className="mt-9 space-y-3 text-left">{['Identifying the dish', 'Estimating nutrition', 'Preparing your personal context'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold"><span className={`grid size-7 place-items-center rounded-full ${index === 0 ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'}`}>{index === 0 ? <RotateCcw size={14} className="animate-spin" /> : <span className="size-1.5 rounded-full bg-muted-foreground/50" />}</span>{item}<span className="ml-auto h-2 w-20 overflow-hidden rounded-full bg-muted"><span className="block h-full w-2/3 rounded-full bg-secondary animate-pulse-soft" /></span></div>)}</div></div></div>;
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-2xl p-4 ${accent ? 'bg-secondary/30' : 'bg-muted/60'}`} data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><p className="text-[11px] font-semibold text-muted-foreground">{label}</p><p className="mt-2 font-mono-ui text-lg font-bold tracking-tight">{value}</p></div>;
}

function ResultsPage({ profile, scan }: { profile: Profile; scan: Scan }) {
  const [favorite, setFavorite] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const conditions = profile.conditions.length ? profile.conditions : ['General nutrition'];
  const displayIngredients = showAllIngredients ? scan.ingredients : scan.ingredients.slice(0, 4);
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 lg:py-20">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><Link href="/scan" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground" data-testid="link-results-new-scan"><ArrowRight size={16} className="rotate-180" /> New scan</Link><button type="button" onClick={() => setFavorite((value) => !value)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${favorite ? 'border-secondary bg-secondary/30 text-secondary-foreground' : 'border-border bg-card text-muted-foreground'}`} data-testid="button-favorite-result">{favorite ? <Check size={14} /> : <Plus size={14} />} {favorite ? 'Saved to favorites' : 'Save insight'}</button></div>
      <div className="grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
        <div className="soft-shadow overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
          <div className="food-art relative min-h-[330px] rounded-none opacity-95 sm:min-h-[400px]"><div className="absolute inset-x-5 top-5 flex items-center justify-between"><span className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold backdrop-blur">Food detected</span><span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono-ui text-xs font-bold text-secondary-foreground"><BadgeCheck size={13} /> {scan.confidence}%</span></div><div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-primary-foreground/15 bg-primary/55 p-4 backdrop-blur-md"><p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">Recognized as</p><h1 className="mt-1 font-display text-4xl">{scan.detectedFood}</h1><p className="mt-1 text-xs text-primary-foreground/65">Recognition is an estimate from your image.</p></div></div>
          <div className="p-6"><div className="flex items-center justify-between text-xs"><span className="text-primary-foreground/65">Confidence signal</span><span className="font-mono-ui text-secondary">{scan.confidence >= 80 ? 'Clear read' : 'Please confirm'}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-secondary" style={{ width: `${scan.confidence}%` }} /></div></div>
        </div>
        <div className="flex flex-col gap-6">
          {scan.confidence < 80 && <div className="flex gap-3 rounded-2xl border border-secondary/70 bg-secondary/20 p-4 text-sm leading-6 text-secondary-foreground"><CircleAlert size={19} className="mt-0.5 shrink-0" /><span><strong>Recognition is uncertain.</strong> Please confirm the dish and ingredients before using this estimate.</span></div>}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">Nutrition estimate</p><h2 className="mt-2 font-display text-3xl">What may be on the plate</h2></div><span className="grid size-10 place-items-center rounded-2xl bg-secondary/35 text-primary"><Activity size={19} /></span></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Calories" value={scan.nutrition.calories} accent /><Metric label="Carbohydrates" value={scan.nutrition.carbs} /><Metric label="Protein" value={scan.nutrition.protein} /><Metric label="Total fat" value={scan.nutrition.fat} /><Metric label="Sugar" value={scan.nutrition.sugar} /><Metric label="Sat. fat" value={scan.nutrition.saturatedFat} /><Metric label="Sodium" value={scan.nutrition.sodium} accent /><Metric label="Fiber" value={scan.nutrition.fiber} /></div><div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Scale size={15} className="text-accent-foreground" /> Estimated portion: <strong className="text-foreground">{scan.nutrition.portion}</strong></div></section>
          <section className="rounded-3xl border border-secondary/60 bg-secondary/15 p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-foreground/70">Your health analysis</p><h2 className="mt-2 font-display text-3xl">Eat with caution</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">Contextual read</span></div><p className="mt-5 max-w-2xl text-sm leading-6 text-secondary-foreground/80">This meal may be workable in a considered portion, but the rice load and recipe-dependent sodium are worth noticing for your profile. It is not a universal good or bad.</p><div className="mt-6 rounded-2xl border border-secondary/50 bg-background/50 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-foreground">Main concern</p><p className="mt-2 text-sm font-semibold leading-6">High carbohydrate load depending on portion size and preparation.</p></div></section>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.82fr]">
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8"><div className="mb-6 flex items-end justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">By your context</p><h2 className="mt-2 font-display text-3xl">A closer look</h2></div><HeartPulse size={22} className="text-accent-foreground" /></div><div className="divide-y divide-border/70">{conditions.map((condition) => { const note = conditionNotes[condition] ?? { status: 'Review', tone: 'blue', explanation: 'Consider the ingredients, portion size and how this meal fits into your usual pattern.' }; return <div key={condition} className="flex gap-4 py-4 first:pt-0 last:pb-0"><span className={`mt-1 size-3 shrink-0 rounded-full ${note.tone === 'amber' ? 'bg-secondary' : 'bg-sky-400'}`} /><div className="flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">{condition}</h3><Pill tone={note.tone === 'amber' ? 'amber' : 'blue'}>{note.status}</Pill></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{note.explanation}</p></div></div>; })}</div></section>
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Scale size={19} /></span><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground">Practical, not rigid</p><h2 className="mt-2 font-display text-2xl">A gentler portion idea</h2></div></div><p className="mt-6 text-sm leading-6 text-muted-foreground">Instead of a large plate of chicken biryani, consider a smaller rice portion with more vegetables and adequate protein. Limit high-sodium sides where you can.</p><div className="mt-5 space-y-2 text-sm font-semibold">{['Smaller rice portion', 'More non-starchy vegetables', 'Adequate protein', 'Limit high-sodium sides'].map((item) => <div key={item} className="flex items-center gap-2"><Check size={15} className="text-primary" />{item}</div>)}</div></section>
      </div>
      <section className="mt-6 overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground sm:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">A better choice for you</p><h2 className="mt-2 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Keep the good part. Change the balance.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/70">These ideas are shaped around your context — not a blanket “don’t eat this.”</p></div><Salad size={48} className="hidden text-secondary/80 sm:block" /></div><div className="mt-8 grid gap-3 md:grid-cols-3">{alternatives.map((alternative, index) => <AlternativeCard key={alternative.name} alternative={alternative} featured={index === 0} />)}</div></section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_.8fr]"><div className="rounded-3xl border border-secondary/60 bg-secondary/15 p-6 sm:p-8"><div className="flex gap-3"><CircleAlert size={20} className="shrink-0 text-secondary-foreground" /><div><h2 className="font-display text-2xl">Ingredient verification matters</h2><p className="mt-2 text-sm leading-6 text-secondary-foreground/80">Image analysis cannot reliably confirm every ingredient. Always verify ingredients before eating if you have a serious food allergy.</p></div></div><div className="mt-6 flex flex-wrap gap-2">{displayIngredients.map((ingredient, index) => <Pill key={ingredient} tone={index > 3 ? 'amber' : 'sand'}>{ingredient}{index > 3 && <span className="ml-1 text-[10px]">possible</span>}</Pill>)}</div><button type="button" onClick={() => setShowAllIngredients((value) => !value)} className="mt-4 text-xs font-bold underline decoration-secondary underline-offset-4" data-testid="button-toggle-ingredients">{showAllIngredients ? 'Show fewer ingredients' : `Show all ${scan.ingredients.length} possible ingredients`}</button></div><div className="rounded-3xl border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck size={21} className="text-primary" /><h2 className="font-display text-2xl">Keep this in perspective</h2></div><p className="mt-4 text-xs leading-6 text-muted-foreground" data-testid="text-medical-disclaimer">{DISCLAIMER}</p></div></section>
    </div>
  );
}

function AlternativeCard({ alternative, featured }: { alternative: Alternative; featured?: boolean }) {
  return <article className={`lift rounded-3xl p-5 ${featured ? 'bg-secondary text-secondary-foreground' : 'border border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground'}`} data-testid={`card-alternative-${alternative.name.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-2xl ${featured ? 'bg-secondary-foreground/10' : 'bg-primary-foreground/10'}`}>{featured ? <BadgeCheck size={19} /> : <Leaf size={19} />}</span><span className={`font-mono-ui text-[10px] ${featured ? 'opacity-65' : 'text-primary-foreground/55'}`}>0{featured ? '1' : '2+'}</span></div><h3 className="mt-6 font-display text-2xl leading-tight">{alternative.name}</h3><div className="mt-4 flex flex-wrap gap-1.5">{alternative.tags.map((tag) => <span key={tag} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${featured ? 'bg-secondary-foreground/10' : 'bg-primary-foreground/10'}`}>{tag}</span>)}</div><div className={`mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-xs ${featured ? 'border-secondary-foreground/15' : 'border-primary-foreground/15'}`}><span><b className="block font-mono-ui text-sm">{alternative.calories.split(' ')[0]}</b>cal</span><span><b className="block font-mono-ui text-sm">{alternative.carbs}</b>carbs</span><span><b className="block font-mono-ui text-sm">{alternative.sodium}</b>sodium</span></div><p className={`mt-4 text-xs leading-5 ${featured ? 'opacity-75' : 'text-primary-foreground/65'}`}>{alternative.rationale}</p></article>;
}

function Router() {
  const [location, setLocation] = useLocation();
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [scan, setScan] = useState<Scan>(demoScan);
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveProfile = (next: Profile) => { setProfile(next); setLocation('/'); };
  const onChoose = (image: string) => setScan((current) => ({ ...current, image, status: 'ready' }));
  const onAnalyze = () => { setScan((current) => ({ ...current, status: 'analyzing' })); analysisTimer.current = setTimeout(() => { setScan((current) => ({ ...current, ...demoScan, image: current.image, status: 'complete' })); setLocation('/results'); }, 1800); };
  useEffect(() => () => { if (analysisTimer.current) clearTimeout(analysisTimer.current); }, []);
  const page = useMemo(() => {
    if (location === '/') return <HomePage profile={profile} scan={scan} />;
    if (location === '/profile') return <ProfilePage profile={profile} onSave={onSaveProfile} />;
    if (location === '/scan') return <ScanPage scan={scan} onChoose={onChoose} onAnalyze={onAnalyze} />;
    if (location === '/results') return scan.status === 'analyzing' ? <LoadingPage /> : <ResultsPage profile={profile} scan={scan} />;
    return null;
  }, [location, profile, scan]);
  return <Shell>{page ?? <Switch><Route component={NotFound} /></Switch>}</Shell>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
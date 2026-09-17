import { fetchApi } from "@/lib/fetchApi";
import { PricingPlanGrid } from "@/components/payments/PricingPlanGrid";
import { auth } from "@/auth";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Pricing & Plans | Social Work Consultancy",
  description: "Unlock unlimited access to all standard courses.",
};

export default async function PricingPage() {
  const session = await auth();

  // Fetch plans from the backend
  const res = await fetchApi(`/payments/plans`, { next: { revalidate: 60 } });
  const data = await res.json().catch(() => ({}));
  const plans = data?.data || [];

  // Fetch current subscription if logged in
  let currentSubscription = null;
  if (session) {
    const subRes = await fetchApi(`/payments/subscriptions/current`, {
      next: { revalidate: 0 },
    });
    const subData = await subRes.json().catch(() => ({}));
    currentSubscription = subData?.data;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh] min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2036&auto=format&fit=crop")',
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 z-10 bg-black/50 dark:bg-black/60" />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-12 lg:mt-0">
          <nav className="flex items-center text-sm text-gray-200 mb-4 tracking-wide font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-white">Pricing & Plans</span>
          </nav>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Pricing
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Invest in your{" "}
            <span className="text-[#2D6A4F] dark:text-[#52b788]">
              career growth
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Subscribe to get unlimited access to our entire library of standard
            social work courses, verified certificates, and more.
          </p>
        </div>

        <PricingPlanGrid
        plans={plans}
        isLoggedIn={!!session}
        currentSubscription={currentSubscription}
      />

      <div className="mt-24 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-8 text-left mt-10">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Can I cancel my subscription?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Yes, you can cancel your subscription at any time from your
              dashboard settings. You will continue to have access until the end
              of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              What happens to my certificates if I cancel?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              You keep all the certificates you earned while your subscription
              was active forever. They remain verifiable through our platform.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Are exclusive courses included?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Exclusive premium courses are not included in standard
              subscription plans and must be purchased separately. However,
              subscribers often get discounts on exclusive content.
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Read all Frequently Asked Questions
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

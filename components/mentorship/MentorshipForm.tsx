"use client";

import { useState } from "react";
import { IconSpinner } from "@/components/auth/shared/icons";

export function MentorshipForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.email && !formData.phone_number) {
      setError("Please provide either an email or a phone number so we can reach you.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/contact-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email || undefined,
          phone_number: formData.phone_number || undefined,
          platform: "NG",
          category: "mentorship",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit message. Please try again.");
      }

      setSuccess(true);
      setFormData({
        full_name: "",
        email: "",
        phone_number: "",
        message: "",
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-32 px-6 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row gap-16 lg:gap-24 items-start">

        {/* Form Column */}
        <div className="w-full lg:w-1/2">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-800"
          >
            <div className="space-y-6">
              {error && (
                <div role="alert" aria-live="assertive" className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold border border-red-200 dark:border-red-800/30">
                  {error}
                </div>
              )}

              {success && (
                <div role="status" aria-live="polite" className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold border border-green-200 dark:border-green-800/30">
                  Thank you! Your message has been submitted successfully.
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your Email Address"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Your Phone Number"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your experience..."
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-lg py-4 rounded-xl transition-colors shadow-lg shadow-[#2D6A4F]/20 disabled:opacity-70"
              >
                {loading ? <IconSpinner className="w-5 h-5 animate-spin" /> : "Send"}
              </button>
            </div>
          </form>
        </div>

        {/* Text Column */}
        <div className="w-full lg:w-1/2 pt-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Become a Mentor
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
            Are you a qualified social worker, educator, or experienced practitioner? We welcome expressions of interest from those keen to give back by mentoring the next generation. Training and orientation will be provided.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Why Mentorship Matters
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            Mentorship bridges learning and practice. It builds confidence, nurtures leadership, and supports ethical, informed decision-making in complex environments. As we work to transform social services across Nigeria and the Global South, mentorship is among the most powerful tools we have.
          </p>
        </div>

      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { IconSpinner } from "@/components/auth/shared/icons";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    subject: "",
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
          category: "general",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message. Please try again.");
      }

      setSuccess(true);
      setFormData({
        full_name: "",
        email: "",
        phone_number: "",
        subject: "",
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
    <section className="relative py-20 md:py-32 px-6 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* Contact Info Column */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            We'd love to hear from you
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed font-medium">
            Whether you have a question about our courses, need support with your mentorship journey, or want to explore partnership opportunities, our team is ready to answer all your questions.
          </p>
          
          <div className="space-y-8">
            <div className="flex items-start gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 group-hover:bg-[#2D6A4F] transition-colors duration-300">
                <MapPin className="w-6 h-6 text-[#2D6A4F] group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Our Location</h4>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Social Work Nigeria Headquarters<br />
                  Abuja, Nigeria
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 group-hover:bg-[#2D6A4F] transition-colors duration-300">
                <Phone className="w-6 h-6 text-[#2D6A4F] group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Phone Number</h4>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  +234 (0) 800 123 4567<br />
                  Mon-Fri, 9am - 5pm
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 group-hover:bg-[#2D6A4F] transition-colors duration-300">
                <Mail className="w-6 h-6 text-[#2D6A4F] group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Address</h4>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  support@socialworknigeria.com<br />
                  info@socialworknigeria.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="w-full lg:w-7/12 relative">
           {/* Abstract decoration behind the form */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#2D6A4F]/5 blur-3xl rounded-full pointer-events-none -z-10" />
           
           <form 
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/40 dark:shadow-none"
          >
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Send us a message</h3>
            
            <div className="space-y-6">
              {error && (
                <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold border border-red-200 dark:border-red-800/30">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input 
                  type="text" 
                  id="full_name" 
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe" 
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com" 
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
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
                    placeholder="+234 800 123 4567" 
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input 
                  type="text" 
                  id="subject" 
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?" 
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea 
                  id="message" 
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..." 
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/50 focus:border-[#2D6A4F] transition-all resize-y"
                />
              </div>

              {success && (
                <div role="status" className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold border border-green-200 dark:border-green-800/30">
                  Thank you! Your message has been sent successfully. Our team will get back to you shortly.
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-lg py-4 rounded-xl transition-colors shadow-xl shadow-[#2D6A4F]/20 disabled:opacity-70 mt-4"
              >
                {loading ? (
                  <IconSpinner className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Message
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}

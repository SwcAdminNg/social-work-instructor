import { ContactHero } from "@/components/contact/ContactHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactMap } from "@/components/contact/ContactMap";

export const metadata = {
  title: "Contact Us | Social Work Nigeria",
  description: "Get in touch with the Social Work Nigeria team.",
};

export default function ContactPage() {
  return (
    <div className="w-full bg-white dark:bg-gray-950 flex flex-col">
      <ContactHero />
      <ContactForm />
      <ContactMap />
    </div>
  );
}

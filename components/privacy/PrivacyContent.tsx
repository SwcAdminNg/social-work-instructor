import { Mail } from "lucide-react";
import { LegalBody, LegalList, LegalSection } from "@/components/legal/LegalLayout";

const sections = [
  { id: "privacy", title: "Privacy Policy" },
  { id: "terms", title: "Terms of Use" },
  { id: "safeguarding", title: "Safeguarding" },
  { id: "contact", title: "Contact Us" },
];

export function PrivacyContent() {
  return (
    <LegalBody sections={sections}>
      <LegalSection id="privacy" title="Privacy Policy">
        <p className="m-0">We respect your privacy and are committed to protecting your data. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website or utilise our services.</p>
        <p className="m-0">We may collect personal information, such as your name, email address, telephone number, and course preferences, to provide services and communicate with you.</p>
        <p className="m-0">We do not sell your data. Your information is shared solely with third parties essential for course delivery and certification, such as CPD accreditation platforms.</p>
        <p className="m-0">By using our platform, you agree to the terms outlined in this Privacy Policy.</p>
      </LegalSection>

      <LegalSection id="terms" title="Terms of Use">
        <p className="m-0">By accessing our website and e-learning platform, you agree to comply with the following terms of use:</p>
        <LegalList>
          <li>Use the platform solely for lawful, educational purposes.</li>
          <li>Do not distribute course content without written permission.</li>
          <li>Respect your fellow learners and contribute positively to forums.</li>
          <li>You are responsible for protecting your login credentials.</li>
          <li>A breach of these terms may result in restricted access or removal.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="safeguarding" title="Safeguarding Statement">
        <p className="m-0">
          Social Work Consultancy Ltd is dedicated to safeguarding and promoting the welfare of all learners and beneficiaries of our training and consultancy services. We acknowledge our responsibility to prevent abuse, uphold the rights of children and vulnerable adults, and foster safe, inclusive learning environments.
        </p>
        <h3 className="swc-h4 mt-2 text-swc-ink">Our safeguarding practices include:</h3>
        <LegalList>
          <li>Adhering to national child protection laws and international standards.</li>
          <li>Requiring all staff, instructors, and partners to undergo safeguarding induction.</li>
          <li>Providing clear reporting channels for concerns or disclosures.</li>
          <li>Regularly reviewing and updating safeguarding policies and protocols.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us">
        <p className="m-0">
          For inquiries regarding privacy, data usage, or protection, please reach out to our support team. We take your data seriously and will respond promptly.
        </p>
        <div>
          <a href="mailto:support@socialworknigeria.org" className="swc-btn swc-btn--green">
            <Mail aria-hidden="true" className="h-4 w-4" />
            support@socialworknigeria.org
          </a>
        </div>
      </LegalSection>
    </LegalBody>
  );
}

import { LegalBody, LegalList, LegalSection, legalLink } from "@/components/legal/LegalLayout";

const sections = [
  { id: "eligibility", title: "5.1 Eligibility" },
  { id: "account", title: "5.2 Account Responsibilities" },
  { id: "acceptable", title: "5.3 Acceptable Use" },
  { id: "intellectual", title: "5.4 Intellectual Property" },
  { id: "payment", title: "5.5 Payment and Refund Policy" },
  { id: "platform", title: "5.6 Platform Availability" },
  { id: "termination", title: "5.7 Termination of Access" },
];

export function TermsContent() {
  return (
    <LegalBody sections={sections}>
      <p className="m-0 mb-10 border-l-4 border-swc-gold pl-5 text-[1.0625rem] font-medium leading-[1.65] text-swc-ink">
        The following Terms of Service apply to all registered users of the SWCL LMS platform. By creating an account and accessing the platform, users agree to be bound by these terms in full.
      </p>

      <LegalSection id="eligibility" title="5.1 Eligibility">
        <LegalList>
          <li>The platform is open to individuals aged 18 and above.</li>
          <li>Students must be enrolled in a paid (or code-accessed) course and have a confirmed account before accessing content.</li>
          <li>Lecturers must be formally engaged by SWCL and hold a signed Lecturer Agreement and NDA before accessing the platform.</li>
          <li>SWCL reserves the right to refuse or revoke access to any user found to be in breach of these terms.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="account" title="5.2 Account Responsibilities">
        <LegalList>
          <li>Each user is responsible for maintaining the confidentiality of their login credentials.</li>
          <li>Accounts must not be shared with or transferred to any other individual.</li>
          <li>Users must change their password on first login and update it at regular intervals per the platform’s security settings (30–120 days).</li>
          <li>Users must notify SWCL immediately if they suspect unauthorised access to their account.</li>
          <li>Users must ensure that all information provided during registration is accurate and up to date.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="acceptable" title="5.3 Acceptable Use">
        <LegalList>
          <li>Users must engage with the platform in a respectful, professional, and ethical manner at all times.</li>
          <li>Course content is for personal and professional development only. It must not be reproduced, distributed, or sold without prior written consent from SWCL.</li>
          <li>Users must not attempt to access areas of the platform beyond their assigned access level.</li>
          <li>Any form of harassment, discrimination, or abusive behaviour will result in immediate account suspension.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="intellectual" title="5.4 Intellectual Property">
        <LegalList>
          <li>All course materials and content hosted on the SWCL platform are the intellectual property of Social Work Consultancy Ltd, unless otherwise stated in the Lecturer Agreement.</li>
          <li><strong className="text-swc-ink">Content Ownership:</strong> Course materials developed by lecturers for SWCL may either remain the intellectual property of SWCL or be licensed for use by SWCL, depending on the terms agreed in the Lecturer Agreement before course delivery. This must be clearly defined in writing before any course commences.</li>
          <li>Students may download and retain materials for personal reference only and must not share or republish them.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="payment" title="5.5 Payment and Refund Policy">
        <p className="m-0">
          Course fees are non-refundable once access to course content has been granted, except as set out in the SWCL Refund Policy.
        </p>
        <div className="swc-card bg-swc-mint p-6">
          <LegalList>
            <li><strong className="text-swc-ink">Full refund:</strong> within 24 hours of payment if no content has been accessed.</li>
            <li><strong className="text-swc-ink">Partial refund (50%):</strong> within 7 working days of payment if less than 25% of course content has been accessed, subject to LMS Administrator review.</li>
            <li><strong className="text-swc-ink">No refund:</strong> after 7 working days, or where 25% or more of content has been accessed, unless SWCL has experienced a proven technical failure.</li>
          </LegalList>
        </div>
        <p className="m-0">
          <strong className="text-swc-ink">Definition of Technical Failure:</strong> A technical failure is a platform outage, payment error, or system fault caused by SWCL’s infrastructure that prevented the student from accessing content they had paid for. Must be verified by the IT Administrator before a refund is approved on these grounds.
        </p>
        <p className="m-0">
          Refund requests must be submitted in writing using the SWCL Refund Request Form, available at{" "}
          <a href="https://socialworknigeria.org" className={legalLink} target="_blank" rel="noopener noreferrer">
            socialworknigeria.org
          </a>
          .
        </p>
        <p className="m-0">A Dispute Form is also available for cases where a student wishes to formally challenge a refund decision.</p>
        <p className="m-0">SWCL reserves the right to modify course fees. Enrolled students will not be affected by price changes mid-course.</p>
      </LegalSection>

      <LegalSection id="platform" title="5.6 Platform Availability">
        <LegalList>
          <li>SWCL will endeavour to maintain platform availability at all times but cannot guarantee uninterrupted access due to scheduled maintenance or technical issues.</li>
          <li>Users will be notified in advance of planned maintenance and will receive proactive status updates during any unplanned downtime.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="termination" title="5.7 Termination of Access">
        <LegalList>
          <li>SWCL may suspend or terminate a user’s account without prior notice if the user is found to be in breach of these Terms of Service.</li>
          <li>Upon termination, the user will lose access to all course content and progress records.</li>
          <li>Users may request account deletion at any time by contacting the SWCL administration team.</li>
        </LegalList>
      </LegalSection>
    </LegalBody>
  );
}

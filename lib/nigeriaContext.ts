/**
 * Facts about the setting social workers practise in across Nigeria.
 * Every entry links to the source it was checked against (November 2026).
 * Keep the wording close to what the source says; update the date when
 * you re-check a figure.
 */

export const contextCheckedOn = "November 2026";

export type ContextStat = {
  /** Number to count up to. */
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  source: string;
  href: string;
};

export const contextStats: ContextStat[] = [
  {
    value: 63,
    suffix: "%",
    label: "of people in Nigeria, about 133 million, live in multidimensional poverty.",
    source: "National Bureau of Statistics, 2022",
    href: "https://nigerianstat.gov.ng/news/78",
  },
  {
    value: 6,
    suffix: " in 10",
    label: "children experience physical, sexual or emotional violence before they turn 18.",
    source: "National survey 2014, reported by UNICEF",
    href: "https://www.unicef.org/nigeria/reports/ending-violence-against-children-nigeria",
  },
  {
    value: 10.2,
    suffix: "m",
    label: "children of primary school age are out of school, with a further 8.1 million of junior secondary age.",
    source: "UNICEF, September 2024",
    href: "https://www.unicef.org/nigeria/press-releases/immediate-action-needed-protect-nigerias-children-and-schools",
  },
  {
    value: 3.6,
    suffix: "m+",
    label: "people are displaced within the country, away from home, work and school.",
    source: "UNHCR data portal, October 2026",
    href: "https://data.unhcr.org/en/country/nga",
  },
];

export type Framework = {
  year: string;
  name: string;
  text: string;
  source: string;
  href: string;
};

export const frameworks: Framework[] = [
  {
    year: "2003",
    name: "Child’s Rights Act",
    text: "Brings the UN Convention on the Rights of the Child into Nigerian law. It takes effect in a state once that state’s Assembly enacts it.",
    source: "UNICEF Nigeria",
    href: "https://www.unicef.org/nigeria/press-releases/unicef-commends-kebbi-state-government-enacting-child-protection-law-urges-its-full",
  },
  {
    year: "2015",
    name: "Violence Against Persons (Prohibition) Act",
    text: "Prohibits violence in private and public life and sets out remedies for survivors. States adopt it one by one.",
    source: "Partners West Africa Nigeria",
    href: "https://www.partnersnigeria.org/factsheet-on-the-violence-against-persons-prohibition-act-2015/",
  },
  {
    year: "2015",
    name: "Trafficking in Persons (Prohibition), Enforcement and Administration Act",
    text: "Enforced by NAPTIP, which also runs shelters, counselling and rehabilitation for survivors of trafficking.",
    source: "NAPTIP",
    href: "https://naptip.gov.ng/about-us",
  },
  {
    year: "2018",
    name: "Discrimination Against Persons with Disabilities (Prohibition) Act",
    text: "Bans discrimination on the ground of disability and set up the National Commission for Persons with Disabilities.",
    source: "National Commission for Persons with Disabilities",
    href: "https://ncpwd.gov.ng",
  },
  {
    year: "2021",
    name: "National Mental Health Act",
    text: "Signed in January 2023 in place of the colonial-era Lunacy Act. It sets out the rights of people living with mental health conditions.",
    source: "Policy and Legal Advocacy Centre",
    href: "https://placng.org/Legist/landmark-mental-health-bill-receives-presidential-assent/",
  },
  {
    year: "2022",
    name: "Nigerian Council for Social Work (Establishment) Act",
    text: "Provides for a council to regulate professional social work: the knowledge and skills it requires, its ethics and the quality of training.",
    source: "The Guardian Nigeria",
    href: "https://guardian.ng/news/fg-sets-up-social-work-regulatory-body/",
  },
];

export type PracticeSetting = { name: string; text: string };

/** Settings where social work is practised in Nigeria. */
export const practiceSettings: PracticeSetting[] = [
  {
    name: "Child and family welfare",
    text: "Child protection and social welfare services delivered through federal and state ministries responsible for women affairs and social development.",
  },
  {
    name: "Health and medical social work",
    text: "Social workers in hospitals and other health settings, supporting patients and families through illness, discharge and recovery.",
  },
  {
    name: "Mental health",
    text: "Support for people living with mental health conditions and their families, within the rights set out in the National Mental Health Act.",
  },
  {
    name: "Community development",
    text: "Work alongside community groups and leaders on the things that shape daily life, from livelihoods to local services.",
  },
  {
    name: "Ageing and older people",
    text: "Services guided by the National Policy on Ageing and the National Senior Citizens Centre.",
  },
  {
    name: "Disability inclusion",
    text: "Advocacy and services that uphold the rights protected by the 2018 disability Act.",
  },
  {
    name: "Justice and corrections",
    text: "Non-custodial measures such as community service, probation and parole under the Nigerian Correctional Service Act 2019.",
  },
  {
    name: "Humanitarian response",
    text: "Protection and psychosocial support for people displaced by conflict and disaster.",
  },
];

export const globalDefinitionUrl = "https://www.ifsw.org/what-is-social-work/global-definition-of-social-work/";
export const ethicalPrinciplesUrl = "https://www.ifsw.org/global-social-work-statement-of-ethical-principles/";

export type Profile = {
  interests: string[];
  traits: string[];
  skills: string;
  workStyles?: string[];
  hours: number;
  capital: number;
  monthly: number;
  location: string;
  currency: string;
};
export type Section = {
  revisions?: {
    _id: string;
    draft: string;
    source: string;
    createdAt: string;
  }[];
  title: string;
  answers: string[];
  draft: string;
  status: "not-started" | "draft" | "reviewed";
};
export type Plan = {
  _id: string;
  name: string;
  description: string;
  sections: Section[];
  messages: { _id?: string; role: string; text: string; section?: number }[];
  updatedAt: string;
};
export type Idea = {
  category?: string;
  monthlyCost?: number;
  assumptions?: string;
  firstStep?: string;
  score?: number;
  reasons?: string[];
  tags?: string[];
  capital?: number;
  hours?: number;
  currency?: string;
  name: string;
  description: string;
  why: string;
  needs: string;
  challenge: string;
};
export const titles = [
  "Company overview",
  "Market & competition",
  "Products & services",
  "Marketing & sales",
  "Operations & management",
  "Financial plan & funding",
  "Executive summary",
  "Legal compliance",
];
export const subtitles = [
  "Give your big idea a little shape.",
  "Get to know your future customers.",
  "Create something worth choosing.",
  "Help the right people find you.",
  "Make the everyday work, work.",
  "Turn the numbers into a clear picture.",
  "Bring your whole story together.",
  "Start on the right foot.",
];
export const questions = [
  [
    "What does your business do, and who does it help?",
    "What is your mission and your first-year goal?",
  ],
  [
    "Who is your ideal customer?",
    "What alternatives do they use, and how will you stand out?",
  ],
  [
    "What products or services will you offer?",
    "How will you price them, and what makes them valuable?",
  ],
  [
    "Where will people discover your business?",
    "How will you turn interest into paying customers?",
  ],
  [
    "How will you deliver your product or service?",
    "What people, equipment, and suppliers will you need?",
  ],
  [
    "What startup costs, monthly expenses, and funding do you expect?",
    "What prices and monthly sales assumptions will you test?",
  ],
  [
    "What is the central story of your business?",
    "What are your key milestones and funding needs?",
  ],
  [
    "Where will your business operate, and what ownership structure are you considering?",
    "Which registrations and requirements have you verified with official sources?",
  ],
];
export const interests = [
  ["🎵", "Music"], ["💄", "Beauty & skincare"], ["🏋️", "Sports & fitness"], ["🌻", "Gardening"], ["📖", "Books & writing"], ["🚗", "Cars & transport"], ["🧸", "Children & family"], ["🏘️", "Community"], ["💼", "Business & finance"],
  ["🍰", "Food & baking"],
  ["🎨", "Art & design"],
  ["🌿", "Sustainability"],
  ["💻", "Technology"],
  ["👕", "Fashion"],
  ["🐾", "Pets & animals"],
  ["📸", "Photography"],
  ["🧘", "Health & wellness"],
  ["🎮", "Gaming"],
  ["📚", "Education"],
  ["🪴", "Home & living"],
  ["✈️", "Travel"],
  ["🎉", "Events"],
  ["🛠️", "Crafts & DIY"],
  ["📱", "Social media"],
];
export const traits = [
  ["🦁", "Confident"], ["🧘", "Calm"], ["🔧", "Resourceful"], ["🤲", "Supportive"], ["📖", "Reflective"], ["🌟", "Optimistic"], ["⚖️", "Decisive"], ["🛡️", "Reliable"], ["🚀", "Ambitious"],
  ["💡", "Creative"],
  ["📋", "Organized"],
  ["🔎", "Analytical"],
  ["🤝", "Collaborative"],
  ["🧭", "Independent"],
  ["💬", "Outgoing"],
  ["🛠️", "Hands-on"],
  ["🌱", "Patient"],
  ["⚡", "Adaptable"],
  ["🎯", "Goal-oriented"],
  ["💛", "Empathetic"],
  ["🧩", "Curious"],
  ["📐", "Detail-oriented"],
  ["🗺️", "Strategic"],
  ["🏃", "Persistent"],
];
export const emptyProfile: Profile = {
  interests: [],
  traits: [],
  skills: "",
  workStyles: [],
  hours: 10,
  capital: 0,
  monthly: 0,
  location: "",
  currency: "PHP",
};
export function makePlan(name: string, description = ""): Plan {
  return {
    _id: crypto.randomUUID(),
    name,
    description,
    sections: titles.map((title) => ({
      title,
      answers: ["", ""],
      draft: "",
      status: "not-started",
    })),
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}
export function sampleIdeas(profile: Profile): Idea[] {
  const topic = profile.interests[0] || "Art & design";
  return [
    {
      name: `${topic.split(" & ")[0]} creative studio`,
      description: `A small service business helping local customers with ${topic.toLowerCase()}.`,
      why: `A starting point to explore your interest in ${topic.toLowerCase()}.`,
      needs: "A portfolio, basic tools, and time to find your first clients.",
      challenge:
        "Validate demand with five potential customers before spending.",
    },
    {
      name: "The little curated shop",
      description:
        "Thoughtfully selected products for people who share your interests.",
      why: "A way to combine your interests with a focused product collection.",
      needs:
        "Supplier research, a small sample collection, and a sales channel.",
      challenge:
        "Test pricing and delivery costs before committing to inventory.",
    },
    {
      name: "Community workshop club",
      description:
        "Beginner-friendly sessions built around a skill you enjoy sharing.",
      why: "Start small and build connections around your existing experience.",
      needs: "A teachable skill, a simple session plan, and a suitable venue.",
      challenge: "Find enough paying participants to cover each session.",
    },
  ];
}
export { api } from "./services/api";

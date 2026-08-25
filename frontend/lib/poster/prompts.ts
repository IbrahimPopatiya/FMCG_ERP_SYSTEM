export interface PosterPrompt {
  id: string;
  title: string;
  description: string;
  // Served from public/prompts - fetched at generate time and combined with
  // the chosen product count. Add a new prompt by dropping a .txt file there
  // and adding an entry here.
  file: string;
}

export const POSTER_PROMPTS: PosterPrompt[] = [
  {
    id: "zaid-traders-wholesale",
    title: "Wholesale Distributor Ad",
    description: "Premium FMCG wholesale poster with branding, feature icons, and contact details.",
    file: "/prompts/zaid-traders-wholesale.txt",
  },
];

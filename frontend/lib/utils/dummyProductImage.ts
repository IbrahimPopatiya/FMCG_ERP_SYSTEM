// Maps common FMCG brand keywords to a real product/logo photo (sourced from
// Wikimedia) so the demo catalog shows recognizable images instead of a
// random placeholder — e.g. a product named "Coca-Cola 500ml" shows an
// actual Coke bottle. Used only as a fallback when a product has no image
// uploaded yet; real product images always take priority.
const BRAND_IMAGES: Record<string, string> = {
  "coca-cola": "https://upload.wikimedia.org/wikipedia/commons/2/27/Coca_Cola_Flasche_-_Original_Taste.jpg",
  "coke": "https://upload.wikimedia.org/wikipedia/commons/2/27/Coca_Cola_Flasche_-_Original_Taste.jpg",
  "sprite": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Sprite_lemon_lime_1.jpg/960px-Sprite_lemon_lime_1.jpg",
  "pepsi": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pepsi_2023.svg/960px-Pepsi_2023.svg.png",
  "thums up": "https://upload.wikimedia.org/wikipedia/en/thumb/b/be/Thums_Up_logo.svg/330px-Thums_Up_logo.svg.png",
  "fanta": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Fanta_2023.svg/960px-Fanta_2023.svg.png",
  "mountain dew": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Mountain_Dew_2025_logo.svg/960px-Mountain_Dew_2025_logo.svg.png",
  "limca": "https://upload.wikimedia.org/wikipedia/en/3/36/Limca-logo.jpg",
  "red bull": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBullEnergyDrink.svg/500px-RedBullEnergyDrink.svg.png",
  "bisleri": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Bisleri_logo.svg/960px-Bisleri_logo.svg.png",
  "parle-g": "https://upload.wikimedia.org/wikipedia/commons/0/05/Parle_G_logo.jpg",
  "parle g": "https://upload.wikimedia.org/wikipedia/commons/0/05/Parle_G_logo.jpg",
  "lay's": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Lay%27s_2025.svg/960px-Lay%27s_2025.svg.png",
  "lays": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Lay%27s_2025.svg/960px-Lay%27s_2025.svg.png",
  "kurkure": "https://upload.wikimedia.org/wikipedia/en/e/e5/Kurkure_Logo.png",
  "maggi": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Maggi_logo.svg/960px-Maggi_logo.svg.png",
  "amul": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Amul_official_logo.svg/500px-Amul_official_logo.svg.png",
  "britannia": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Britannia_Industries_logo.svg/120px-Britannia_Industries_logo.svg.png",
  "oreo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Oreo-Two-Cookies.png/960px-Oreo-Two-Cookies.png",
  "cadbury": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Cadbury_%282020%29.svg/960px-Cadbury_%282020%29.svg.png",
  "dairy milk": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Cadbury_%282020%29.svg/960px-Cadbury_%282020%29.svg.png",
  "kitkat": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Logo_of_the_KitKat.svg/960px-Logo_of_the_KitKat.svg.png",
  "kit kat": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Logo_of_the_KitKat.svg/960px-Logo_of_the_KitKat.svg.png",
  "nescafe": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Nescaf%C3%A8_instant_coffee%2C_2019-%2801%29.jpg",
  "horlicks": "https://upload.wikimedia.org/wikipedia/commons/0/08/Mug_of_Horlicks.jpg",
  "colgate": "https://upload.wikimedia.org/wikipedia/commons/0/04/Colgate-Palmolive_Building_300_Park_Avenue.jpg",
  "dettol": "https://upload.wikimedia.org/wikipedia/en/a/a9/Dettol_logo.png",
  "surf excel": "https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Surf_Excel.svg/330px-Surf_Excel.svg.png",
  "tata salt": "https://upload.wikimedia.org/wikipedia/en/7/79/Tata_salt_packet_photo.webp",
};

export function dummyProductImage(name: string, seed: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, url] of Object.entries(BRAND_IMAGES)) {
    if (lower.includes(keyword)) return url;
  }
  return `https://picsum.photos/seed/${seed}/800/1400`;
}

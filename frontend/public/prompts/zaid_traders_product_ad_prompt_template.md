# Automated Product Advertisement Prompt Template

## Purpose

Use this prompt in the image-generation part of the project to automatically create a professional **Zaid Traders wholesale product advertisement poster** from:

1. One uploaded product image.
2. A product count: `1`, `2`, or `3`.

The generated poster should keep the same overall advertisement structure while automatically adapting:
- The product image(s).
- The poster color theme.
- The product feature/benefit section.

---

## 1. Input Variables

```text
PRODUCT_IMAGE = <uploaded product image>
PRODUCT_COUNT = 1 | 2 | 3
```

Optional fixed business information:

```text
BUSINESS_NAME = "ZAID TRADERS"
BUSINESS_TYPE = "WHOLESALE & DISTRIBUTION"
TAGLINE = "TRUST • QUALITY • SERVICE"

PHONE_1 = "9975444032"
PHONE_2 = "8788280412"

ADDRESS = "HYDERABAD ROAD, DHANEGAON, NANDED - 431605, MAHARASHTRA"
EMAIL = "zaidtraders786@gmail.com"
```

---

# 2. Main Image Generation Prompt

Use the following prompt as the base prompt sent to the image-generation model.

```text
Create a premium, professional wholesale product advertising poster for ZAID TRADERS using the uploaded product image as the primary and authoritative product reference.

INPUT:
- Product image: {{PRODUCT_IMAGE}}
- Number of product displays: {{PRODUCT_COUNT}}

BUSINESS BRANDING:
- Business name: ZAID TRADERS
- Business type: WHOLESALE & DISTRIBUTION
- Tagline: TRUST • QUALITY • SERVICE
- Phone: 9975444032 / 8788280412
- Address: HYDERABAD ROAD, DHANEGAON, NANDED - 431605, MAHARASHTRA
- Email: zaidtraders786@gmail.com

IMPORTANT PRODUCT RULE:
The uploaded product image is the source of truth.
Do not redesign, recolor, rename, reshape, replace, or invent the product packaging.
Preserve the product's real:
- brand
- product name
- packaging design
- logo
- colors
- typography
- visible claims
- price
- flavor information
- quantity information
- symbols and certifications

Remove the original photo background if necessary and present the product cleanly as a professional commercial product image.

PRODUCT COUNT:
If PRODUCT_COUNT = 1:
- Display one large product prominently in the main product area.

If PRODUCT_COUNT = 2:
- Display two matching product packages/containers side-by-side.
- Keep both products clearly visible and approximately equal in visual importance.

If PRODUCT_COUNT = 3:
- Display three matching product packages/containers in a balanced professional arrangement.
- Keep every product clearly visible without excessive overlap.

Do not create additional products beyond the requested count.

POSTER STYLE:
Create a clean, modern, premium FMCG wholesale advertisement.
Use a mostly white/light background with strong visual hierarchy.
Use the uploaded product's dominant packaging colors as the poster's secondary accent colors.

COLOR ADAPTATION:
Automatically analyze the uploaded product image and identify its dominant visual colors.
Use those colors for:
- feature icons
- section dividers
- enquiry section accents
- delivery section accents
- footer background
- decorative elements

The product itself must remain unchanged.
Do not force the previous red/black/brown color theme onto a new product.

LAYOUT:

1. TOP BRANDING
At the top:
- Premium Quality badge on the left.
- ZAID TRADERS logo/brand area in the center.
- 100% VEG badge on the right when appropriate for the product.
- "WHOLESALE & DISTRIBUTION"
- "TRUST • QUALITY • SERVICE"

2. MAIN PRODUCT AREA
Place the requested number of product displays in the center.
The product must be the main visual focus.
Use realistic commercial lighting, clean edges, subtle shadows, and a premium catalog-style presentation.

3. PRODUCT FEATURE SECTION
Below the product, create exactly 6 short feature items.

IMPORTANT:
Generate these 6 features from the actual uploaded product image.
Only use information that is clearly visible or safely inferable from the product packaging.

Examples of valid feature types:
- Assorted Fruit Flavours
- Paper Sticks
- Individually Wrapped
- Loved by Kids
- Premium Quality
- Perfect for Sharing

For a chocolate product, possible features could include:
- Rich Chocolaty Taste
- Individually Wrapped
- Premium Quality
- Loved by Kids
- Easy to Share
- Perfect for Gifting

However, do NOT copy these examples automatically.
Choose features specifically relevant to the current product.

Each feature should contain:
- a simple small line icon
- a very short title
- maximum 2–4 words per line
- clean spacing

Do not create a paragraph in the feature section.

4. ENQUIRY + DELIVERY SECTION
Create a clean horizontal information section containing:
- phone icon
- "FOR ENQUIRIES"
- 9975444032
- 8788280412
- delivery/truck icon
- "DELIVERY AVAILABLE"
- "FAST & SAFE DELIVERY"

5. FOOTER
Create a strong colored footer using an accent color derived from the product packaging.
Include:
- location icon
- ZAID TRADERS
- HYDERABAD ROAD, DHANEGAON,
- NANDED - 431605, MAHARASHTRA
- email icon
- zaidtraders786@gmail.com

TYPOGRAPHY:
- Use bold, highly readable commercial typography.
- Keep headings large and clear.
- Keep contact information highly readable.
- Do not overcrowd the design.

VISUAL QUALITY:
- High-resolution commercial advertising poster.
- Sharp product packaging.
- Accurate product proportions.
- Clean white/light background.
- Balanced margins.
- Professional FMCG distributor catalog aesthetic.
- Realistic product shadows.
- No unnecessary decorative objects.

STRICT TEXT RULES:
Do not add random marketing slogans.
Do not add claims that are not supported by the product image.
Do not add a separate large text box such as "Rich Chocolate Taste" or any other product description unless the user explicitly requests it.
The feature section is the only place where short product benefits should be displayed.
Do not invent prices, weights, quantities, flavors, ingredients, certifications, or health claims.

STRICT LAYOUT RULE:
Keep the same overall structure:
TOP BRANDING
→ MAIN PRODUCT
→ 6 FEATURE ICONS
→ ENQUIRY / DELIVERY
→ BUSINESS FOOTER

The only major dynamic elements are:
1. Product image and product count.
2. Color theme derived from the product.
3. Six product-specific feature items.

Generate the final poster as a polished finished advertisement, not as a mockup or wireframe.
```

---

# 3. Recommended Product-Count Logic

Your application can pass the same prompt with only this variable changed:

```text
PRODUCT_COUNT = 1
```

Result:
```text
[ PRODUCT ]
```

For two:

```text
PRODUCT_COUNT = 2
```

Result:
```text
[ PRODUCT ]   [ PRODUCT ]
```

For three:

```text
PRODUCT_COUNT = 3
```

Result:
```text
[ PRODUCT ] [ PRODUCT ] [ PRODUCT ]
```

The model should never display more products than the requested number.

---

# 4. Recommended Dynamic Prompt Construction

In your application, keep the business branding as a fixed template and inject the uploaded image + product count dynamically.

Pseudo-flow:

```text
User uploads product image
        ↓
User selects product count
        ↓
PRODUCT_IMAGE = uploaded image
PRODUCT_COUNT = 1 / 2 / 3
        ↓
Send base advertisement prompt
        ↓
Image generation model analyzes product
        ↓
Extract visual color theme
        ↓
Generate 6 product-specific features
        ↓
Generate final poster
```

---

# 5. Important Production Rule

For the best result, do **not** ask the image model to invent product information.

A better production architecture is:

```text
                    ┌─────────────────────┐
                    │   Product Image     │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Product Analysis AI │
                    │                     │
                    │ Name                │
                    │ Brand               │
                    │ Colors              │
                    │ Visible claims      │
                    │ Features            │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Poster Prompt       │
                    │ Builder             │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Image Generation    │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Final Advertisement │
                    └─────────────────────┘
```

This two-step approach is recommended because image-generation models can sometimes produce incorrect text.

---

# 6. Product Analysis JSON

Before generating the final poster, you can optionally have a vision model analyze the product image and return structured information such as:

```json
{
  "product_name": "",
  "brand": "",
  "category": "",
  "dominant_colors": [],
  "visible_features": [],
  "visible_flavors": [],
  "visible_price": "",
  "visible_quantity": "",
  "certifications": [],
  "suggested_features": [
    "",
    "",
    "",
    "",
    "",
    ""
  ]
}
```

Then inject the verified values into the poster prompt.

---

# 7. Feature Generation Rules

The feature section should always contain **exactly 6 items**.

Priority order:

1. Explicit product features visible on packaging.
2. Product type characteristics that are obvious from the image.
3. Visible flavor/variety information.
4. Packaging benefits.
5. Clearly supported usage/occasion.
6. Safe, generic product qualities such as "Premium Quality" only when appropriate.

Avoid:
- medical claims
- health claims
- nutritional claims not visible on packaging
- unsupported quality claims
- invented ingredients
- invented awards
- invented certifications

---

# 8. Negative Prompt / Restrictions

If your image-generation API supports a negative prompt, use:

```text
Do not create extra products.
Do not duplicate the product incorrectly.
Do not change the product packaging.
Do not redesign the brand logo.
Do not alter the product name.
Do not invent product claims.
Do not invent ingredients.
Do not invent flavors.
Do not invent prices.
Do not add a large product-description text box.
Do not add unnecessary paragraphs.
Do not use gradients that overpower the product.
Do not use an unrelated color palette.
Do not use a cluttered background.
Do not create a lifestyle scene.
Do not add unrelated objects.
Do not crop the product.
Do not hide important packaging details.
Do not make the product look like a different SKU.
```

---

# 9. Expected User Experience

The user interface can be extremely simple:

```text
┌─────────────────────────────────────┐
│      CREATE PRODUCT ADVERTISEMENT   │
│                                     │
│  Upload Product Image               │
│  [       Upload Image       ]       │
│                                     │
│  Number of Products                │
│  [ 1 ]   [ 2 ]   [ 3 ]             │
│                                     │
│        [ Generate Poster ]          │
└─────────────────────────────────────┘
```

The user does not need to enter:
- product name
- colors
- features
- poster layout
- business information

Those should be automatically handled by the system.

---

# 10. Final Output Requirement

Every generated poster should follow this visual hierarchy:

```text
┌───────────────────────────────────────┐
│ PREMIUM      ZAID TRADERS       VEG   │
│                                       │
│       WHOLESALE & DISTRIBUTION        │
│       TRUST • QUALITY • SERVICE       │
│                                       │
│     ┌─────────┐   ┌─────────┐         │
│     │ PRODUCT │   │ PRODUCT │         │
│     └─────────┘   └─────────┘         │
│                                       │
│  ◯ Feature  ◯ Feature  ◯ Feature     │
│  ◯ Feature  ◯ Feature  ◯ Feature     │
│                                       │
│  ☎ FOR ENQUIRIES     🚚 DELIVERY      │
│  9975444032           AVAILABLE        │
│  8788280412           FAST & SAFE      │
│                                       │
│  📍 ZAID TRADERS     ✉ EMAIL           │
│  ADDRESS             EMAIL             │
└───────────────────────────────────────┘
```

The exact number of products, accent colors, and six feature items should automatically change according to the uploaded product.

---

## Core Principle

**One reusable template + one product image + one product count = one automatically customized Zaid Traders advertisement.**

The template should preserve the business identity and layout while allowing the product itself to determine the visual theme and feature section.

# VirtualThreads — 3D Animated Apparel Mockup Studio

A photorealistic 3D apparel customization studio and landing page inspired by [VirtualThreads](https://www.virtualthreads.io/), built with React, Three.js, Tailwind CSS, and Vite.

---

## Features

- **Authentic VirtualThreads Landing Page**:
  - Replicates the official VirtualThreads landing experience with floating pill navigation, `[ Version 1 | Version 2 ]` catalog switcher, and garment preview cards.
  - Clicking any blank transitions directly into the 3D customization studio.

- **100% Authentic 3D Garments**:
  - **Streetwear Plain Hoodie**: Scanned from [virtualthreads.io/studio/hoodie](https://www.virtualthreads.io/studio/hoodie) with authentic cloth drape, crossover double-layer hood, front kangaroo pouch, ribbed cuffs, and bottom waistband.
  - **Streetwear Jogger Sweatpants**: Anatomical waistband, hanging drawstrings with metal aglets, tapered knees, and ribbed ankle cuffs.
  - **Structured 6-Panel Cap**: 3D crown panels, curved visor brim, squatchee top button, and catalog 3/4 camera perspective.
  - **Oversized Streetwear T-Shirt**: Drop-shoulder silhouette, natural cloth creases, wind wave simulation, and seamless walking runway stride.

- **Dynamic Garment Dyeing**:
  - Full fabric color palette dyeing in real-time while preserving natural cloth highlights, texture weave, and ribbing contrast.

- **Graphics & Decal Placement**:
  - Upload front and back custom graphic designs or add text with live font, color, and size controls.
  - 100% transparent decal rendering with zero opaque patch borders.

- **Interactive 3D Viewport**:
  - Orbit controls, preset camera angles (Front, Back, Hero 3/4, Chest Detail).
  - 360° Turntable and runway walking animation modes.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to GitHub Pages

This repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys the studio to GitHub Pages automatically whenever code is pushed to `main`.

### Setup Steps:
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. The workflow will automatically trigger, build the project, and publish your live studio to `https://<your-username>.github.io/<your-repo-name>/`.

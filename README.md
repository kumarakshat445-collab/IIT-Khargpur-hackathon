# AeroMars HiRISE Anomaly Detection Studio

An end-to-end unsupervised deep learning pipeline built for the **National Students' Space Challenge (NSSC) 2026** at the Indian Institute of Technology, Kharagpur. The project focuses on detecting rare geological anomalies, sensor artifacts, and foreign outliers within Mars Reconnaissance Orbiter HiRISE orbital imagery without relying on pre-trained backbones or manual ground-truth labels.

## 🚀 Live Application
* **App URL:** [AeroMars HiRISE Anomaly Detection Studio](https://aeromars-hirise-anomaly-detection-studio.ai.studio)

---

## 📌 Repository Overview & App Description
This repository houses the core codebase and experimental pipeline for unsupervised novelty detection on Martian surface imagery. The web application (**AeroMars HiRISE Anomaly Detection Studio**) serves as an interactive deployment interface for exploring compressed latent spaces, computing reconstruction error heatmaps, evaluating statistical anomaly thresholds, and mapping detected anomalies back to their geographical coordinates using HiRISE metadata.

---

## 📂 Challenge Problem Statement & Architecture

Based on the official NSSC 2026 problem statement, the pipeline is divided into four major phases:

### Phase 1: Deep Latent Compression (Autoencoders)
* **Architecture Design:** Built a custom Convolutional Autoencoder (AE) from scratch to compress standardized $227\times227$ grayscale Martian surface crops into a fixed-length 1D latent vector, completely avoiding pretrained feature extractors or transfer learning.
* **Loss Function Design:** Designed a balanced reconstruction objective combining Mean Squared Error (MSE) and Structural Similarity Index Measure (SSIM) to preserve high-frequency geological structures such as craters, ridgelines, and dune fields while avoiding overly smooth reconstructions.
* **Latent Space Visualization:** Applied dimensionality reduction techniques (t-SNE/UMAP) on the latent vectors to qualitatively assess representation quality and verify that the encoder avoids collapse.

### Phase 2: Isolation Forest Novelty Engine & Location Analysis
* **Novelty Scoring:** Fed the learned 1D latent representations into an Isolation Forest to generate continuous, calibrated Novelty Scores where higher scores denote greater anomalousness.
* **Statistical Thresholding:** Established a mathematically defensible anomaly threshold boundary using distribution-based bounds ($\mu + k\sigma$) on the sorted Novelty Score distribution rather than relying on arbitrary fixed-count cutoffs or assumed contamination fractions.
* **Image Location Analysis:** Integrated `source_image_metadata.csv` to map flagged anomalous crops back to their original HiRISE observation metadata (latitude, longitude, solar angle, season, and resolution).

### Phase 3: Reconstruction Interpretability
* **Pixel-Wise Error Heatmaps:** Filtered images exceeding the statistical threshold, ranked them by Novelty Score, and passed the top selections through the decoder to compute per-pixel squared/absolute error overlays.
* **Geological Report:** Formulated physical hypotheses explaining why specific regions failed reconstruction (e.g., localized error concentrations on sharp linear features versus diffuse errors from sensor artifacts or domain shifts).

### Phase 4: Architecture Iteration & Design Journal
Documented the iterative engineering lifecycle across distinct versions (**v1 through v3**) following a strict **Symptom $\rightarrow$ Diagnosis $\rightarrow$ Fix** paradigm:
* **v1 (Baseline):** Pure MSE Autoencoder producing blurry dune edge reconstructions.
* **v2 (Refinement):** Addition of SSIM loss components to recover high-frequency structural details.
* **v3 (Production):** Optimized bottleneck dimensionality and tuned Isolation Forest tree depth for robust out-of-distribution separation.

---

## 🛠️ Repository Structure
```text
├── notebooks/           # Jupyter notebooks for Phase 1 to Phase 4 implementation
├── src/                 # Modular Python scripts (models, loss functions, inference)
├── assets/              # Figures, latent plots, and error heatmaps
├── reports/             # Comprehensive PDF report and engineering changelog
└── README.md            # Project documentation
The **AeroMars HiRISE Anomaly Detection Studio** (`[https://aeromars-hirise-anomaly-detection-studio.ai.studio](https://aeromars-hirise-anomaly-detection-studio.ai.studio)`) is an advanced, end-to-end web application and deep learning studio designed specifically for unsupervised novelty and anomaly detection on orbital imagery of Mars.

Developed as part of the **National Students' Space Challenge (NSSC) 2026** data analytics problem statement from **IIT Kharagpur**, the application tackles the challenge of processing massive archives of planetary imagery (such as those from the Mars Reconnaissance Orbiter's HiRISE camera) without relying on pre-trained backbones, manual labels, or external transfer learning.

### Key Capabilities & Architecture of the App:

* **Deep Latent Compression (Autoencoders):** Compresses high-resolution $227\times227$ grayscale Martian surface crops (featuring craters, dune fields, and polar terrains) into a compact, fixed-length 1D latent vector using a custom Convolutional/Variational Autoencoder built from scratch. It optimizes reconstruction using a balanced loss function (such as MSE combined with SSIM) to preserve critical high-frequency geological textures.
* **Isolation Forest Novelty Engine:** Feeds the learned latent representations directly into an Isolation Forest model to assign continuous, calibrated "Novelty Scores" to each crop, cleanly separating standard planetary terrain from rare anomalies.
* **Statistical Thresholding & Metadata Mapping:** Implements mathematically defensible threshold boundaries (such as distribution-based bounds like $\mu + k\sigma$) to isolate outliers independently of arbitrary fixed counts. It also merges `source_image_metadata.csv` to map detected anomalies directly back to their original Martian coordinates, sun angles, seasons, and resolutions.
* **Reconstruction Interpretability & Heatmaps:** Generates per-pixel squared and absolute error overlays for flagged images. This allows researchers and automated pipelines to visualize exactly where latent reconstructions break down—helping differentiate between genuine geological variations, spliced boundaries, and artificial sensor anomalies.
* **Iterative Engineering Journal:** Documents structural evolution across multiple versions (v1 to v3) following a rigorous *Symptom $\rightarrow$ Diagnosis $\rightarrow$ Fix* engineering methodology.

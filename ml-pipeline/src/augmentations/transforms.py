# Field-Domain Augmentation Pipeline — AgriSmart AI
#
# DESIGN RATIONALE
# ================
# The PlantVillage → PlantDoc domain gap (val F1 ~0.99 vs field F1 ~0.27) is caused
# primarily by the controlled lab conditions of PlantVillage images versus the
# varied illumination, shadows, camera quality, and viewpoints of real field photos.
#
# These augmentations simulate the specific degradations that appear in field images:
#   - Uneven natural lighting and cast shadows (RandomShadow)
#   - JPEG/camera compression artefacts common in smartphone photos (ImageCompression)
#   - Camera shake / out-of-focus blur (GaussianBlur)
#   - Viewpoint variation when photographing leaves at different angles (Affine, RRC)
#   - Realistic colour variation from different times of day / lighting (ColorJitter)
#
# What was deliberately NOT done:
#   - No extreme noise: real field photos are not noisy in that way
#   - No excessive hue shift: disease-specific colour cues (yellowing, browning,
#     orange rust spots) must be preserved — hue jitter kept very tight
#   - No CoarseDropout / cutout: occlusion patterns differ from real field occlusion
#   - No elastic distortion: not physically realistic for whole-leaf photos
#   - VerticalFlip removed: upside-down leaves do not occur in field photography
#     and the augmentation is not representative of any real domain shift
#   - Affine rotation tightened to ±20°: field photos are taken at roughly upright
#     angles; ±30° produced orientations unrealistic for handheld phone photos

import albumentations as A
from albumentations.pytorch import ToTensorV2


def get_train_transforms(image_size: int = 224) -> A.Compose:
    """
    Field-domain training augmentation pipeline.

    Applied in order of physical plausibility:
      1. Spatial / viewpoint variation
      2. Illumination / shadow simulation
      3. Lens and compression degradation
      4. Colour variation
      5. Normalization + tensor conversion

    None of these transforms modify the dataset on disk.
    """
    return A.Compose([

        # ── 1. Spatial / viewpoint variation ───────────────────────────────
        # RandomResizedCrop: simulates varying distances and partial leaf views
        # in field photos where the photographer does not perfectly frame the leaf.
        A.RandomResizedCrop(size=(image_size, image_size), scale=(0.8, 1.0)),

        # HorizontalFlip: legitimate left/right mirror — leaf diseases are
        # symmetric in appearance across the horizontal axis.
        A.HorizontalFlip(p=0.5),

        # VerticalFlip REMOVED (was p=0.3).
        # Upside-down leaves are not a realistic field condition and could
        # teach the model to recognise artefacts that don't exist in deployment.

        # Affine: small-to-moderate rotation (±20° vs original ±30°) and
        # scale/translation to simulate handheld camera angle variation.
        # Tighter rotation range keeps orientations physically plausible.
        A.Affine(
            scale=(0.85, 1.15),
            translate_percent=(-0.1, 0.1),
            rotate=(-20, 20),        # was (-30, 30) — reduced for realism
            p=0.6,                   # was 0.7 — slight reduction to avoid over-augmentation
        ),

        # ── 2. Illumination and shadow simulation ──────────────────────────
        # RandomShadow: simulates cast shadows from surrounding vegetation,
        # fences, or the photographer's own shadow — very common in field photos.
        # shadow_roi covers the full image height (not just bottom half).
        # shadow_intensity_range=(0.4, 0.7): meaningful but not pitch-black shadow.
        A.RandomShadow(
            shadow_roi=(0.0, 0.0, 1.0, 1.0),
            num_shadows_limit=(1, 2),
            shadow_intensity_range=(0.4, 0.7),
            p=0.35,
        ),

        # ── 3. Lens and camera degradation ─────────────────────────────────
        # ImageCompression: JPEG artefacts are ubiquitous in smartphone farm
        # photos uploaded via WhatsApp, messaging apps, or low-quality cameras.
        # quality_range=(60, 95): mild to moderate compression, not destructive.
        A.ImageCompression(
            compression_type="jpeg",
            quality_range=(60, 95),
            p=0.4,
        ),

        # GaussianBlur: simulates camera shake or shallow depth-of-field blur
        # when photographing leaves close-up. Kept but probability reduced
        # (0.2 vs original 0.25) to avoid softening disease texture too often.
        A.GaussianBlur(blur_limit=(3, 5), p=0.2),

        # ── 4. Colour / photometric variation ──────────────────────────────
        # ColorJitter: moderate brightness/contrast/saturation variation for
        # different lighting conditions (overcast vs direct sunlight).
        # Hue REDUCED from 0.1 to 0.04: disease-specific colour signatures
        # (rust orange, bacterial spot brown, YLCV yellowing) must be preserved.
        # Excessive hue shift can map healthy green to disease-yellow, creating
        # false training signal.
        A.ColorJitter(
            brightness=0.25,
            contrast=0.25,
            saturation=0.20,
            hue=0.04,           # was 0.1 — tightened to preserve disease colour cues
            p=0.6,
        ),

        # ── 5. Normalization and tensor conversion ──────────────────────────
        # ImageNet statistics — unchanged; required for pretrained EfficientNet-B0.
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])


def get_val_transforms(image_size: int = 224) -> A.Compose:
    """
    Validation / inference preprocessing pipeline.

    Completely deterministic — no random operations.
    Applied identically to validation, test_field evaluation, and production inference.
    """
    return A.Compose([
        A.Resize(height=image_size, width=image_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])

# Heavy Field-Simulation Image Augmentations
# Designed to bridge the PlantVillage (lab) vs PlantDoc (field) domain gap
import albumentations as A
from albumentations.pytorch import ToTensorV2

def get_train_transforms(image_size=224):
    """
    Field-oriented augmentation pipeline for training.
    Includes photometric, spatial, and noise augmentations to handle domain shift.
    """
    return A.Compose([
        A.RandomResizedCrop(size=(image_size, image_size), scale=(0.8, 1.0)),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.Affine(scale=(0.85, 1.15), translate_percent=(-0.1, 0.1), rotate=(-30, 30), p=0.7),
        
        # Photometric & Shadow Variations
        A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.6),
        A.GaussianBlur(blur_limit=(3, 5), p=0.25),
        
        # Normalization (ImageNet Statistics)
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])

def get_val_transforms(image_size=224):
    """
    Validation preprocessing pipeline.
    Deterministic resizing and normalization without random training augmentations.
    """
    return A.Compose([
        A.Resize(height=image_size, width=image_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])

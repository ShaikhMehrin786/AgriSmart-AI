# Heavy Field-Simulation Image Augmentations
# Designed to bridge the PlantVillage (lab) vs PlantDoc (field) domain gap
import albumentations as A
from albumentations.pytorch import ToTensorV2

def get_train_transforms(image_size=224):
    return A.Compose([
        A.RandomResizedCrop(image_size, image_size, scale=(0.8, 1.0)),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.15, rotate_limit=30, p=0.7),
        
        # Photometric & Field Shadow Variations
        A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.6),
        A.RandomShadow(p=0.3),
        A.RandomSunFlare(flare_roi=(0, 0, 1, 0.5), p=0.2),
        
        # Sensor & Transmission Degradation
        A.GaussianBlur(blur_limit=(3, 5), p=0.25),
        A.ImageCompression(quality_lower=60, quality_upper=95, p=0.4),
        
        # Normalization (ImageNet Statistics)
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])

def get_val_transforms(image_size=224):
    return A.Compose([
        A.Resize(image_size, image_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])

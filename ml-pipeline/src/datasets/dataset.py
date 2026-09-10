# Dataset Loader & Utilities for AgriSmart AI
import os
import glob
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset
from sklearn.model_selection import train_test_split

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')

class CropLeafDataset(Dataset):
    """
    PyTorch Dataset for Plant Leaf Disease Images.
    Supports OpenCV loading, RGB conversion, and Albumentations transformations.
    """
    def __init__(self, file_paths, labels, transform=None):
        self.file_paths = list(file_paths)
        self.labels = list(labels)
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        path = self.file_paths[idx]
        image = cv2.imread(path)
        if image is None:
            raise ValueError(f"Unable to read image at {path}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        if self.transform:
            augmented = self.transform(image=image)
            image = augmented['image']

        label = self.labels[idx]
        return image, torch.tensor(label, dtype=torch.long)

def discover_dataset(data_dir, class_labels):
    """
    Scans data_dir for subdirectories matching class_labels.
    Returns (file_paths, label_indices, class_to_idx).
    """
    class_to_idx = {name: i for i, name in enumerate(class_labels)}
    file_paths = []
    labels = []

    if not os.path.exists(data_dir):
        return [], [], class_to_idx

    for class_name in class_labels:
        class_dir = os.path.join(data_dir, class_name)
        if not os.path.isdir(class_dir):
            continue
        idx = class_to_idx[class_name]
        for root, _, files in os.walk(class_dir):
            for file in files:
                if file.lower().endswith(IMAGE_EXTENSIONS):
                    full_path = os.path.join(root, file)
                    file_paths.append(full_path)
                    labels.append(idx)

    return file_paths, labels, class_to_idx

def create_synthetic_smoke_dataset(output_dir, class_labels, samples_per_class=4):
    """
    Generates a small synthetic leaf image dataset for pipeline smoke testing.
    Explicitly labeled as mock dataset for pipeline verification only.
    """
    os.makedirs(output_dir, exist_ok=True)
    file_paths = []
    labels = []
    class_to_idx = {name: i for i, name in enumerate(class_labels)}

    for idx, class_name in enumerate(class_labels):
        class_dir = os.path.join(output_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        for s in range(samples_per_class):
            filename = f"synthetic_{idx}_{s}.jpg"
            img_path = os.path.join(class_dir, filename)
            
            # Create synthetic RGB leaf-like image with random color variations per class
            np.random.seed(idx * 100 + s)
            img = np.zeros((224, 224, 3), dtype=np.uint8)
            base_color = [30 + (idx * 20) % 180, 100 + (idx * 15) % 150, 40 + (idx * 25) % 180]
            img[:, :] = base_color
            cv2.circle(img, (112, 112), 60 + s * 5, (10, 200, 10), -1)
            cv2.rectangle(img, (50, 50), (170, 170), (idx * 5 % 255, 50, 120), 3)

            cv2.imwrite(img_path, img)
            file_paths.append(img_path)
            labels.append(idx)

    return file_paths, labels, class_to_idx

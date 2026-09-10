# Transfer Learning Model Architecture Specification
# EfficientNet-B0 / MobileNetV3 Backbone for Plant Leaf Disease Classification
import torch
import torch.nn as nn
import timm

SUPPORTED_BACKBONES = {
    "efficientnet_b0": "efficientnet_b0",
    "mobilenetv3_small": "mobilenetv3_small_050",
    "mobilenetv3_large": "mobilenetv3_large_100"
}

def create_model(model_name="efficientnet_b0", num_classes=38, pretrained=True, drop_rate=0.2):
    """
    Creates a vision model backbone using timm with a configurable classification head.
    
    Args:
        model_name (str): Backbone name ('efficientnet_b0', 'mobilenetv3_small', 'mobilenetv3_large')
        num_classes (int): Number of target crop/disease classes
        pretrained (bool): Load ImageNet pretrained weights
        drop_rate (float): Dropout rate for classification head
    
    Returns:
        torch.nn.Module: PyTorch model
    """
    timm_name = SUPPORTED_BACKBONES.get(model_name, model_name)
    print(f"[Model] Creating architecture '{timm_name}' (num_classes={num_classes}, pretrained={pretrained}, drop_rate={drop_rate})...")
    
    model = timm.create_model(
        timm_name,
        pretrained=pretrained,
        num_classes=num_classes,
        drop_rate=drop_rate
    )
    return model

if __name__ == "__main__":
    # Self-test model initialization and CPU forward pass
    m = create_model("efficientnet_b0", num_classes=38, pretrained=False)
    x = torch.randn(1, 3, 224, 224)
    out = m(x)
    print("[Model] Self-test output shape:", out.shape)
    assert out.shape == (1, 38)
    print("[Model] Model self-test passed!")

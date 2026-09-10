# PyTorch to ONNX Model Exporter
# Converts validated checkpoint into production ONNX weights for Node.js
import os
import argparse
import torch
import timm

def export_to_onnx(model_name, checkpoint_path, output_onnx_path, num_classes=38):
    print(f"📦 Loading model '{model_name}' from checkpoint '{checkpoint_path}'...")
    model = timm.create_model(model_name, num_classes=num_classes)

    if os.path.exists(checkpoint_path):
        state_dict = torch.load(checkpoint_path, map_location="cpu")
        model.load_state_dict(state_dict)
        print("✅ Checkpoint weights loaded.")
    else:
        print(f"⚠️ Checkpoint '{checkpoint_path}' not found. Exporting base initialized weights for testing...")

    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224, requires_grad=False)
    os.makedirs(os.path.dirname(output_onnx_path), exist_ok=True)

    print(f"🚀 Exporting to ONNX format at '{output_onnx_path}'...")
    torch.onnx.export(
        model,
        dummy_input,
        output_onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"}
        }
    )
    print("🎉 Export complete! The ONNX weight file is ready for onnxruntime-node.")

def main():
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX")
    parser.add_argument("--model", type=str, default="efficientnet_b0")
    parser.add_argument("--checkpoint", type=str, default="./checkpoints/best_model.pth")
    parser.add_argument("--output", type=str, default="../backend/src/models/agrismart_model.onnx")
    parser.add_argument("--num-classes", type=int, default=38)
    args = parser.parse_args()

    export_to_onnx(args.model, args.checkpoint, args.output, args.num_classes)

if __name__ == "__main__":
    main()

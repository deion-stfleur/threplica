"""Standalone TRELLIS image-to-3D test script (implemented in Phase 6)."""

import argparse
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Test TRELLIS image-to-3D generation.")
    parser.add_argument("--input", required=True, help="Path to input image")
    parser.add_argument("--output", required=True, help="Path for output GLB")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--quality",
        choices=["preview", "standard", "high"],
        default="preview",
    )
    args = parser.parse_args()

    print("TRELLIS standalone test is not implemented yet (Phase 6).")
    print(f"Would process: {args.input} -> {args.output}")
    print(f"Seed: {args.seed}, quality: {args.quality}")
    return 1


if __name__ == "__main__":
    sys.exit(main())

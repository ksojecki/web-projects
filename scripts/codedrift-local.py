#!/usr/bin/env python3
"""Run CodeDrift with repository-local runtime caches."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
TREE_SITTER_CACHE = REPO_ROOT / ".codecodedrift" / "cache" / "tree-sitter-language-pack"


def main() -> None:
    try:
        from tree_sitter_language_pack import configure
        from tree_sitter_language_pack.options import PackConfig
    except ImportError:
        pass
    else:
        configure(PackConfig(cache_dir=str(TREE_SITTER_CACHE)))

    from codedrift.cli import main as codedrift_main

    codedrift_main(prog_name="codedrift")


if __name__ == "__main__":
    main()

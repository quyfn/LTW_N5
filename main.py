#!/usr/bin/env python
"""Convenience entrypoint for running the Django app from the repo root."""

import sys
from pathlib import Path


def main():
    project_dir = Path(__file__).resolve().parent / "SPA"
    sys.path.insert(0, str(project_dir))
    import os

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "SPA.settings")

    from django.core.management import execute_from_command_line

    command = sys.argv[1:] or ["runserver", "127.0.0.1:8000"]
    execute_from_command_line([str(project_dir / "manage.py"), *command])


if __name__ == "__main__":
    main()

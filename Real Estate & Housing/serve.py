"""
America250 Dashboard Server
===========================
Run this script to start the interactive dashboard.

Usage:
    python serve.py

Then open: http://localhost:8080
"""

import http.server
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        if "/dashboard_data.json" not in str(args):
            print(f"  {args[0]}")


def main():
    print("=" * 50)
    print("  America250 Dashboard Server")
    print("=" * 50)
    print(f"\n  Serving: {DIRECTORY}")
    print(f"  URL:     http://localhost:{PORT}")
    print(f"\n  Press Ctrl+C to stop.\n")

    with http.server.HTTPServer(("", PORT), DashboardHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()

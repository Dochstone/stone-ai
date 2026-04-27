"""One-time interactive OAuth setup for GSC API.

Run on a machine with a browser. Saves token.json with a refresh_token
that the backend can use to mint access tokens forever (until revoked).
"""
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def main(client_secret_path: str, out_path: str = "token.json") -> None:
    flow = InstalledAppFlow.from_client_secrets_file(client_secret_path, SCOPES)
    auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")
    print("OPEN THIS URL IN YOUR BROWSER:\n")
    print(auth_url)
    print("\n(server is listening for the redirect on a local port)\n", flush=True)
    creds = flow.run_local_server(
        port=0,
        prompt="consent",
        access_type="offline",
        open_browser=True,
    )
    if not creds.refresh_token:
        print("ERROR: no refresh_token returned. Re-run with prompt=consent.", file=sys.stderr)
        sys.exit(1)
    Path(out_path).write_text(creds.to_json(), encoding="utf-8")
    print(f"OK saved {out_path} (account: {creds.id_token if hasattr(creds,'id_token') else '?'})")
    print("refresh_token present: yes")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python gsc_oauth_setup.py <client_secret.json> [token.json]")
        sys.exit(2)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "token.json")

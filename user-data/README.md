# User data

Each registered person gets a folder here.

Guests also receive a persistent folder based on a one-way hash of their IP address. Their readable IP address is not stored. Named accounts remain separate, even when used from the same IP.

- `profile.json` contains basic readable account information.
- `activity.log` contains a readable sign-in history.
- `notes.txt` is available for your maintenance notes.
- `private-account.json` contains the password hash. Never edit or share this file.

Passwords are never stored as readable text.

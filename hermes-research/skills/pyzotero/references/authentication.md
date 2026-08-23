# Authentication & Setup

## Credentials

Obtain from https://www.zotero.org/settings/keys:

| Credential | Where to Find |
|-----------|---------------|
| **User ID** | "Your userID for use in API calls" section. **MUST be numeric** (e.g., `16500033`). If you get `400 Bad Request: Invalid user ID`, you likely used your string username. To programmatically resolve a username to a numeric ID, GET `https://api.zotero.org/keys/<YOUR_API_KEY>` and read the `userID` field. |
| **API Key** | Create new key at /settings/keys/new |
| **Group Library ID** | Integer after `/groups/` in group URL (e.g. `https://www.zotero.org/groups/169947`) |

**Crucial Note on User ID:** The Zotero `library_id` for personal libraries MUST be the **numeric ID** (e.g., `16500033`), NOT the string username. Using a string username results in `400 Bad Request: Invalid user ID`.
To programmatically recover the numeric User ID from an API key:
```python
import requests
r = requests.get(f'https://api.zotero.org/keys/{api_key}')
numeric_user_id = r.json()['userID']
```

## Troubleshooting User IDs vs Usernames

If API calls fail with `Invalid user ID` (HTTP 400), the user likely provided their string username (e.g., `tommy123`) instead of their numeric User ID. 
You can programmatically resolve their numeric User ID using their API key:
```python
import requests
api_key = "YOUR_API_KEY"
r = requests.get(f'https://api.zotero.org/keys/{api_key}')
user_id = r.json()['userID']
print(f"The numeric User ID is: {user_id}")
```

## Environment Variables

Store in `.env` or export in shell:
```
ZOTERO_LIBRARY_ID=436
ZOTERO_API_KEY=ABC1234XYZ
ZOTERO_LIBRARY_TYPE=user
```

Load in Python:
```python
import os
from dotenv import load_dotenv
from pyzotero import Zotero

load_dotenv()

zot = Zotero(
    library_id=os.environ['ZOTERO_LIBRARY_ID'],
    library_type=os.environ['ZOTERO_LIBRARY_TYPE'],
    api_key=os.environ['ZOTERO_API_KEY']
)
```

## Library Types

```python
# Personal library
zot = Zotero('436', 'user', 'ABC1234XYZ')

# Group library
zot = Zotero('169947', 'group', 'ABC1234XYZ')
```

**Important**: A `Zotero` instance is bound to a single library. To access multiple libraries, create multiple instances.

## Local Mode (Read-Only)

Connect to your local Zotero installation without an API key. Only supports read requests.

```python
zot = Zotero(library_id='436', library_type='user', local=True)
items = zot.items(limit=10)  # reads from local Zotero
```

## Optional Parameters

```python
zot = Zotero(
    library_id='436',
    library_type='user',
    api_key='ABC1234XYZ',
    preserve_json_order=True,   # use OrderedDict for JSON responses
    locale='en-US',             # localise field names (e.g. 'fr-FR' for French)
)
```

## Key Permissions

Check what the current API key can access:
```python
info = zot.key_info()
# Returns dict with user info and group access permissions
```

Check accessible groups:
```python
groups = zot.groups()
# Returns list of group libraries accessible to the current key
```

## API Key Scopes

When creating an API key at https://www.zotero.org/settings/keys/new, choose appropriate permissions:
- **Read Only**: For retrieving items and collections
- **Write Access**: For creating, updating, and deleting items
- **Notes Access**: To include notes in read/write operations
- **Files Access**: Required for uploading attachments

## Troubleshooting: Invalid User ID (400 Bad Request)

Users often confuse their Zotero **Username** (e.g., `johndoe`) with their **User ID** (an integer, e.g., `1234567`). Using a username in API calls will result in a `400 Bad Request: Invalid user ID` error.

You can programmatically resolve the correct integer ID from a valid API key:

```python
import requests
api_key = "YOUR_API_KEY"
r = requests.get(f"https://api.zotero.org/keys/{api_key}")
user_id = r.json().get("userID")
print(f"Correct Integer User ID: {user_id}")
```

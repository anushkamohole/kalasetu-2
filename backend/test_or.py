import httpx
import os
from dotenv import load_dotenv
load_dotenv()
key = os.getenv('OPENROUTER_API_KEY','')
print('KEY:', repr(key))
r = httpx.post(
    'https://openrouter.ai/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'KalaSetu'
    },
    json={
        'model': 'z-ai/glm-4.5-air:free',
        'messages': [{'role':'user','content':'say hello'}],
        'max_tokens': 10
    },
    timeout=30
)
print('STATUS:', r.status_code)
print('BODY:', r.text)
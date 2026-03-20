import asyncio
import struct
import os
from dotenv import load_dotenv
load_dotenv()
def make_wav():
    r = 16000
    n = r * 2
    h = struct.pack('<4sI4s4sIHHIIHH4sI',b'RIFF',36+n*2,b'WAVE',b'fmt ',16,1,1,r,r*2,2,16,b'data',n*2)
    return h + b'\x00' * (n * 2)
async def test():
    from app.services.ai_service import transcribe_audio
    key = os.getenv('SARVAM_API_KEY', 'MISSING')
    print('KEY:', repr(key[:8]))
    print('Calling Sarvam...')
    result = await transcribe_audio(make_wav(), 'hi-IN')
    print('RESULT:', repr(result))
asyncio.run(test())

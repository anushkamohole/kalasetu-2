from dotenv import load_dotenv
load_dotenv()
from app.core.config import supabase
t = supabase.table('transactions').select('*').limit(5).execute()
s = supabase.table('stories').select('raw_transcript').limit(5).execute()
print('TRANSACTIONS:', len(t.data), t.data[:2])
print('STORIES:', len(s.data), s.data)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdoybbmwbodxfkytlcfq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb3liYm13Ym9keGZreXRsY2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDYzODAsImV4cCI6MjEwMDAyMjM4MH0.6brj5yR-UQnXMiM_Zpguzo98UDUG_FIo0s1n4n8rpfg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In-Memory Server Database Store (persists across all browsers and sessions on server)
const serverDbStore: Record<string, any[]> = {
  snaglist_projects: [],
  snaglist_nodes: [],
  snaglist_templates: [],
  snaglist_checkpoints: [],
  snaglist_items: [],
  snaglist_companies: [],
  snaglist_profiles: [],
  snaglist_doc_folders: [],
  snaglist_docs: []
};

let serverInitialized = false;

async function initServerData() {
  if (serverInitialized) return;
  console.log('[Server DB Gateway] Initializing server database store from Supabase...');
  try {
    const { data: projData } = await supabase.from('projects').select('*');
    if (projData && projData.length > 0) {
      serverDbStore.snaglist_projects = projData;
      console.log(`[Server DB Gateway] Loaded ${projData.length} projects from Supabase.`);
    }

    const { data: tplData } = await supabase.from('inspection_templates').select('*');
    if (tplData && tplData.length > 0) {
      serverDbStore.snaglist_templates = tplData;
      console.log(`[Server DB Gateway] Loaded ${tplData.length} templates from Supabase.`);
    }

    const { data: itemData } = await supabase.from('inspection_items').select('*');
    if (itemData && itemData.length > 0) {
      serverDbStore.snaglist_items = itemData;
      console.log(`[Server DB Gateway] Loaded ${itemData.length} inspection items from Supabase.`);
    }
  } catch (err) {
    console.error('[Server DB Gateway] Supabase pre-fetch warning:', err);
  }
  serverInitialized = true;
}

export async function GET(req: NextRequest) {
  await initServerData();
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if (key && serverDbStore[key]) {
    return NextResponse.json({ success: true, key, data: serverDbStore[key] });
  }

  return NextResponse.json({
    success: true,
    store: serverDbStore
  });
}

export async function POST(req: NextRequest) {
  await initServerData();
  try {
    const body = await req.json();
    const { action, key, data } = body;

    console.log(`[Server DB Gateway] Action: ${action || 'save'}, Key: ${key}`);

    if (action === 'save_entity' && key && data) {
      serverDbStore[key] = data;
      
      // Attempt Supabase Sync for Projects
      if (key === 'snaglist_projects' && Array.isArray(data)) {
        console.log('[Server DB Gateway] Syncing projects to Supabase...');
        for (const proj of data) {
          try {
            // Check if valid UUID or generate uuid
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proj.id);
            if (isUuid) {
              await supabase.from('projects').upsert({
                id: proj.id,
                name: proj.name,
                description: proj.description || '',
                owner: proj.owner || 'Default Organization',
                contractor: proj.contractor || 'Saudi Construction Co.',
                consultant: proj.consultant || 'Khatib & Alami',
                engineer: proj.engineer || 'Eng. Ahmed',
                completion_rate: proj.completion_rate || 0,
                created_at: proj.created_at || new Date().toISOString()
              });
              console.log(`[Server DB Gateway] Upserted project '${proj.name}' (${proj.id}) to Supabase.`);
            }
          } catch (e) {
            console.warn(`[Server DB Gateway] Supabase sync fallback for project ${proj.name}:`, e);
          }
        }
      }

      return NextResponse.json({ success: true, key, count: data.length });
    }

    if (action === 'push_all' && body.store) {
      Object.keys(body.store).forEach(k => {
        if (Array.isArray(body.store[k])) {
          serverDbStore[k] = body.store[k];
        }
      });
      return NextResponse.json({ success: true, message: 'Server database store synced successfully across all clients.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  } catch (err: any) {
    console.error('[Server DB Gateway ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Conecta com permissão máxima (ignora cadeados RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. ADMIN CHECK E LOGIN
    if (url.pathname.includes('admin/check')) {
      return new Response(JSON.stringify({ isAdmin: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    if (url.pathname.includes('admin/login')) {
      const body = await req.json()
      if (body.code === 'bijuteria2024') {
        return new Response(JSON.stringify({ success: true, isAdmin: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      return new Response(JSON.stringify({ error: 'Código inválido' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // 🔥 NOVA ROTA ADICIONADA AQUI: ADMIN ADD
    if (url.pathname.includes('admin/add') && req.method === 'POST') {
      const body = await req.json()
      // O site pode enviar 'secretCode' ou 'code'
      if (body.secretCode === 'bijuteria2024' || body.code === 'bijuteria2024') {
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      return new Response(JSON.stringify({ error: 'Código inválido' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // 2. UPLOAD DE IMAGENS REAL
    if (url.pathname.includes('upload') && req.method === 'POST') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) throw new Error('Nenhum arquivo enviado')

      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('produtos').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('produtos').getPublicUrl(fileName)

      return new Response(JSON.stringify({ success: true, url: data.publicUrl }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 3. PRODUTOS
    if (url.pathname.includes('products')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        return new Response(JSON.stringify(data ?? []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      if (req.method === 'POST') {
        const product = await req.json()
        const { data, error } = await supabase.from('products').insert(product).select().single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      if (req.method === 'PUT') {
        const product = await req.json()
        const id = url.pathname.split('/').pop() || product.id
        const { data, error } = await supabase.from('products').update(product).eq('id', id).select()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      if (req.method === 'DELETE') {
        const id = url.pathname.split('/').pop()
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
    }

    // 4. PEDIDOS / CARRINHO
    if (url.pathname.includes('orders') && req.method === 'POST') {
      const order = await req.json()
      const { data, error } = await supabase.from('orders').insert(order).select()
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    return new Response(JSON.stringify({ error: `🚨 Endpoint não encontrado. O site tentou buscar: ${req.method} ${url.pathname}` }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
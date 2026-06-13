import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

async function getUser(authHeader: string | null, supabase: any) {
  if (!authHeader) return null
  const token = authHeader.split(' ')[1]
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) return null
  return user
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
    const authHeader = req.headers.get('authorization')

    // 1. ADMIN CHECK e ADICIONAR ADMIN
    if (url.pathname.includes('admin/check')) {
      const user = await getUser(authHeader, supabase)
      if (!user) return new Response(JSON.stringify({ isAdmin: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      const { data: adminData, error: adminError } = await supabase.from('admins').select('id').eq('user_id', user.id).single()
      if (adminError && adminError.code !== 'PGRST116') {
        console.error('admin check error', adminError)
      }
      return new Response(JSON.stringify({ isAdmin: !!adminData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    if (url.pathname.includes('admin/add') && req.method === 'POST') {
      const body = await req.json()
      if (body.secretCode === 'bijuteria2024' || body.code === 'bijuteria2024') {
        const user = await getUser(authHeader, supabase)
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        const { error: insertError } = await supabase.from('admins').insert({ user_id: user.id })
        if (insertError) console.error('admin insert error', insertError)
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

    // 3. COMENTÁRIOS PUBLICOS e MODERAÇÃO
    if (url.pathname.includes('comments')) {
      if (url.pathname.includes('/comments/all') && req.method === 'GET') {
        const user = await getUser(authHeader, supabase)
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        const { data: adminData, error: adminError } = await supabase.from('admins').select('id').eq('user_id', user.id).single()
        if (adminError || !adminData) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }
        const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify(data ?? []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }

      if (url.pathname.endsWith('/comments') && req.method === 'GET') {
        const productId = url.searchParams.get('productId')
        let query: any = supabase.from('comments').select('*').order('created_at', { ascending: false }).eq('status', 'approved')
        if (productId) query = query.eq('product_id', productId)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify(data ?? []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }

      if (url.pathname.endsWith('/comments') && req.method === 'POST') {
        const body = await req.json()
        const comment = {
          product_id: body.productId || null,
          name: body.name || 'Anônimo',
          email: body.email || '',
          message: body.message,
          status: 'pending',
          reply: null,
        }
        const { data, error } = await supabase.from('comments').insert(comment).select().single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }

      if (url.pathname.includes('/comments/') && req.method === 'PUT') {
        const pieces = url.pathname.split('/').filter(Boolean)
        const id = pieces[pieces.length - 1]
        const body = await req.json()
        const updates: any = {}
        if (body.status) updates.status = body.status
        if (body.reply !== undefined) updates.reply = body.reply
        if (!Object.keys(updates).length) {
          return new Response(JSON.stringify({ error: 'Nenhuma alteração enviada' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }
        const user = await getUser(authHeader, supabase)
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        const { data: adminData, error: adminError } = await supabase.from('admins').select('id').eq('user_id', user.id).single()
        if (adminError || !adminData) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }
        const { data, error } = await supabase.from('comments').update(updates).eq('id', id).select().single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
    }

    // 4. PRODUTOS
    if (url.pathname.includes('products')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        return new Response(JSON.stringify(data ?? []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      if (req.method === 'POST') {
        const productBody = await req.json()
        const product = {
          ...productBody,
          stock: typeof productBody.stock === 'object' && productBody.stock !== null
            ? Object.values(productBody.stock).reduce((sum, value) => sum + Number(value || 0), 0)
            : Number(productBody.stock ?? 0),
        }
        const { data, error } = await supabase.from('products').insert(product).select().single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      if (req.method === 'PUT') {
        const productBody = await req.json()
        const id = url.pathname.split('/').pop() || productBody.id
        const product = {
          ...productBody,
          stock: typeof productBody.stock === 'object' && productBody.stock !== null
            ? Object.values(productBody.stock).reduce((sum, value) => sum + Number(value || 0), 0)
            : Number(productBody.stock ?? 0),
        }
        const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single()
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
    if (url.pathname.includes('orders')) {
      if (req.method === 'POST') {
        const order = await req.json()
        const { data, error } = await supabase.from('orders').insert(order).select()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      if (req.method === 'GET') {
        const user = await getUser(authHeader, supabase)
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        const { data: adminData, error: adminError } = await supabase.from('admins').select('id').eq('user_id', user.id).single()
        if (adminError || !adminData) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify(data ?? []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
    }

    if (url.pathname.includes('orders') && req.method === 'PUT' && url.pathname.includes('/status')) {
      const user = await getUser(authHeader, supabase)
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      const { data: adminData, error: adminError } = await supabase.from('admins').select('id').eq('user_id', user.id).single()
      if (adminError || !adminData) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      const pieces = url.pathname.split('/').filter(Boolean)
      const id = pieces[pieces.length - 2]
      const body = await req.json()
      const { status } = body
      if (!status) {
        return new Response(JSON.stringify({ error: 'Status is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
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
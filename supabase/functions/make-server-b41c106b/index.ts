import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'make-b41c106b-photos'

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

async function kvGet(key: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from('kv_store_b41c106b').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value
}

async function kvSet(key: string, value: any) {
  const supabase = getServiceClient()
  const { error } = await supabase.from('kv_store_b41c106b').upsert({ key, value })
  if (error) throw error
}

async function getUser(authHeader: string | null) {
  if (!authHeader) return null
  const token = authHeader.split(' ')[1]
  if (!token) return null
  const { data: { user }, error } = await getServiceClient().auth.getUser(token)
  if (error || !user) return null
  return user
}

async function isAdmin(userId: string): Promise<boolean> {
  const adminList = (await kvGet('admin:list') as { userId: string }[] | null) || []
  return adminList.some(a => a.userId === userId)
}

async function seedProducts() {
  const existing = await kvGet('products:list')
  if (existing && (existing as any[]).length > 0) return
  const seed = [
    {
      id: crypto.randomUUID(),
      name: 'Colar Delicado Dourado',
      description: 'Colar fino banhado a ouro 18k com pingente de coração. Delicado e elegante para o dia a dia.',
      price: 89.90,
      category: 'Colares',
      sizes: ['40cm', '45cm', '50cm'],
      photos: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&auto=format'],
      stock: 15,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Anel Solitário Prata',
      description: 'Anel em prata 925 com zircônia cristal lapidação brilhante. Clássico e sofisticado.',
      price: 129.90,
      category: 'Anéis',
      sizes: ['13', '14', '15', '16', '17', '18'],
      photos: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&auto=format'],
      stock: 10,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Brincos Pérola Barroca',
      description: 'Brincos com pérolas barrocas naturais e acabamento dourado. Estilo romântico e atemporal.',
      price: 74.90,
      category: 'Brincos',
      sizes: ['Único'],
      photos: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop&auto=format'],
      stock: 20,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Pulseira Charme Dourado',
      description: 'Pulseira dourada com pingentes de coração e estrela. Leve e delicada, perfeita para o verão.',
      price: 59.90,
      category: 'Pulseiras',
      sizes: ['P', 'M', 'G'],
      photos: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&auto=format'],
      stock: 25,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Conjunto Floral Rosê',
      description: 'Conjunto de colar e brinco em banho rosê com flores cravejadas de zircônias rosas.',
      price: 149.90,
      category: 'Conjuntos',
      sizes: ['Único'],
      photos: ['https://images.unsplash.com/photo-1573408301185-9519f94815b7?w=600&h=600&fit=crop&auto=format'],
      stock: 8,
      visible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Tornozeleira Fina Prata',
      description: 'Tornozeleira em prata com bolinhas intercaladas. Minimalista e moderna.',
      price: 49.90,
      category: 'Tornozeleiras',
      sizes: ['23cm', '25cm', '27cm'],
      photos: ['https://images.unsplash.com/photo-1631982690223-8aa4650e4ae9?w=600&h=600&fit=crop&auto=format'],
      stock: 18,
      visible: true,
      createdAt: new Date().toISOString(),
    },
  ]
  await kvSet('products:list', seed)
}

serve(async (req) => {
  // Lida com a requisição de segurança do navegador (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname
    const prefixes = ['/functions/v1/make-server-b41c106b', '/make-server-b41c106b']

    function normalizePath(pathname: string) {
      for (const prefix of prefixes) {
        if (pathname === prefix) return '/'
        if (pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length)
      }
      return pathname
    }

    const routePath = normalizePath(path)

    if (routePath === '/admin/check' && req.method === 'GET') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user) return new Response(JSON.stringify({ isAdmin: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      return new Response(JSON.stringify({ isAdmin: await isAdmin(user.id) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/admin/login' && req.method === 'POST') {
      const body = await req.json()
      if (body.code === 'bijuteria2024') {
        return new Response(JSON.stringify({ success: true, isAdmin: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ error: 'Código inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/admin/add' && req.method === 'POST') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const { secretCode } = await req.json()
      if (secretCode !== 'bijuteria2024') {
        return new Response(JSON.stringify({ error: 'Código inválido' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const adminList = (await kvGet('admin:list') as any[] | null) || []
      if (!adminList.some((a: any) => a.userId === user.id)) {
        adminList.push({ userId: user.id, email: user.email })
        await kvSet('admin:list', adminList)
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/products' && req.method === 'GET') {
      const products = (await kvGet('products:list') as any[] | null) || []
      return new Response(JSON.stringify(products.filter((p: any) => p.visible)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/products' && req.method === 'POST') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const body = await req.json()
      const products = (await kvGet('products:list') as any[] | null) || []
      const product = {
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description || '',
        price: Number(body.price),
        category: body.category || 'Geral',
        sizes: body.sizes || [],
        photos: body.photos || [],
        stock: Number(body.stock ?? 0),
        visible: body.visible ?? true,
        createdAt: new Date().toISOString(),
      }
      products.push(product)
      await kvSet('products:list', products)
      return new Response(JSON.stringify(product), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/products/all' && req.method === 'GET') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const products = (await kvGet('products:list') as any[] | null) || []
      return new Response(JSON.stringify(products), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath.startsWith('/products/') && req.method === 'PUT') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const segments = routePath.split('/')
      const id = segments[segments.length - 1]
      const body = await req.json()
      const products = (await kvGet('products:list') as any[] | null) || []
      const idx = products.findIndex((p: any) => p.id === id)
      if (idx === -1) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      products[idx] = { ...products[idx], ...body }
      await kvSet('products:list', products)
      return new Response(JSON.stringify(products[idx]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath.startsWith('/products/') && req.method === 'DELETE') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const segments = routePath.split('/')
      const id = segments[segments.length - 1]
      const products = (await kvGet('products:list') as any[] | null) || []
      await kvSet('products:list', products.filter((p: any) => p.id !== id))
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/upload' && req.method === 'POST') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${ext}`
      const arrayBuffer = await file.arrayBuffer()
      const supabase = getServiceClient()
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, arrayBuffer, { contentType: file.type })
      if (error) {
        return new Response(JSON.stringify({ error: `Upload failed: ${error.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${BUCKET}/${fileName}`
      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/orders' && req.method === 'POST') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const body = await req.json()
      const orders = (await kvGet('orders:list') as any[] | null) || []
      const order = {
        id: crypto.randomUUID(),
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.name || user.email,
        items: body.items,
        total: body.total,
        address: body.address,
        paymentMethod: body.paymentMethod,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      }
      orders.push(order)
      await kvSet('orders:list', orders)
      return new Response(JSON.stringify(order), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/orders/my' && req.method === 'GET') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const orders = (await kvGet('orders:list') as any[] | null) || []
      return new Response(JSON.stringify(orders.filter((o: any) => o.userId === user.id)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath === '/orders' && req.method === 'GET') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const orders = (await kvGet('orders:list') as any[] | null) || []
      return new Response(JSON.stringify(orders), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (routePath.startsWith('/orders/') && routePath.endsWith('/status') && req.method === 'PUT') {
      const user = await getUser(req.headers.get('authorization'))
      if (!user || !(await isAdmin(user.id))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const segments = routePath.split('/')
      const id = segments[segments.length - 2]
      const { status } = await req.json()
      const orders = (await kvGet('orders:list') as any[] | null) || []
      const idx = orders.findIndex((o: any) => o.id === id)
      if (idx === -1) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      orders[idx].status = status
      await kvSet('orders:list', orders)
      return new Response(JSON.stringify(orders[idx]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
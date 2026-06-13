import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const BUCKET = 'make-b41c106b-photos';

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function getUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  const { data: { user }, error } = await getServiceClient().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function isAdmin(userId: string): Promise<boolean> {
  const adminList = (await kv.get('admin:list') as { userId: string }[] | null) || [];
  return adminList.some(a => a.userId === userId);
}

// Seed demo products if none exist
async function seedProducts() {
  const existing = await kv.get('products:list');
  if (existing && (existing as any[]).length > 0) return;
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
  ];
  await kv.set('products:list', seed);
  console.log('Seeded demo products');
}

// Init storage bucket and seed data
(async () => {
  try {
    const supabase = getServiceClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, { public: true });
      console.log(`Created bucket: ${BUCKET}`);
    }
    await seedProducts();
  } catch (e) {
    console.log('Init error:', e);
  }
})();

// --- PRODUCTS ---

app.get('/make-server-b41c106b/products', async (c) => {
  const products = (await kv.get('products:list') as any[] | null) || [];
  return c.json(products.filter((p: any) => p.visible));
});

app.get('/make-server-b41c106b/products/all', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const products = (await kv.get('products:list') as any[] | null) || [];
  return c.json(products);
});

app.post('/make-server-b41c106b/products', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const products = (await kv.get('products:list') as any[] | null) || [];
  const product = {
    id: crypto.randomUUID(),
    name: body.name,
    description: body.description || '',
    price: Number(body.price),
    category: body.category || 'Geral',
    sizes: body.sizes || [],
    photos: body.photos || [],
    stock: typeof body.stock === 'object' && body.stock !== null
      ? body.stock
      : Number(body.stock ?? 0),
    visible: body.visible ?? true,
    createdAt: new Date().toISOString(),
  };
  products.push(product);
  await kv.set('products:list', products);
  return c.json(product, 201);
});

app.put('/make-server-b41c106b/products/:id', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const body = await c.req.json();
  const products = (await kv.get('products:list') as any[] | null) || [];
  const idx = products.findIndex((p: any) => p.id === id);
  if (idx === -1) return c.json({ error: 'Product not found' }, 404);
  products[idx] = {
    ...products[idx],
    ...body,
    stock: typeof body.stock === 'object' && body.stock !== null
      ? body.stock
      : Number(body.stock ?? products[idx].stock ?? 0),
  };
  await kv.set('products:list', products);
  return c.json(products[idx]);
});

app.delete('/make-server-b41c106b/products/:id', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const products = (await kv.get('products:list') as any[] | null) || [];
  await kv.set('products:list', products.filter((p: any) => p.id !== id));
  return c.json({ success: true });
});

// --- PHOTO UPLOAD ---

app.post('/make-server-b41c106b/upload', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  if (!file) return c.json({ error: 'No file provided' }, 400);
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const supabase = getServiceClient();
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, arrayBuffer, { contentType: file.type });
  if (error) {
    console.log('Upload error:', error);
    return c.json({ error: `Upload failed: ${error.message}` }, 500);
  }
  const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${BUCKET}/${fileName}`;
  return c.json({ url: publicUrl });
});

// --- AUTH ---

app.post('/make-server-b41c106b/auth/signup', async (c) => {
  const { email, password, name } = await c.req.json();
  const { data, error } = await getServiceClient().auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true,
  });
  if (error) return c.json({ error: `Signup error: ${error.message}` }, 400);
  return c.json({ user: data.user }, 201);
});

// --- ADMIN ---

app.get('/make-server-b41c106b/admin/check', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user) return c.json({ isAdmin: false });
  return c.json({ isAdmin: await isAdmin(user.id) });
});

app.post('/make-server-b41c106b/admin/add', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  const { secretCode } = await c.req.json();
  const adminList = (await kv.get('admin:list') as any[] | null) || [];
  if (secretCode !== 'bijuteria2024') {
    return c.json({ error: 'Código inválido' }, 403);
  }
  if (!adminList.some((a: any) => a.userId === user.id)) {
    adminList.push({ userId: user.id, email: user.email });
    await kv.set('admin:list', adminList);
  }
  return c.json({ success: true });
});

app.get('/make-server-b41c106b/admin/list', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const adminList = (await kv.get('admin:list') as any[] | null) || [];
  return c.json(adminList);
});

// --- ORDERS ---

app.post('/make-server-b41c106b/orders', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  const body = await c.req.json();
  const orders = (await kv.get('orders:list') as any[] | null) || [];
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
  };
  orders.push(order);
  await kv.set('orders:list', orders);
  return c.json(order, 201);
});

app.get('/make-server-b41c106b/orders/my', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  const orders = (await kv.get('orders:list') as any[] | null) || [];
  return c.json(orders.filter((o: any) => o.userId === user.id));
});

app.get('/make-server-b41c106b/orders', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const orders = (await kv.get('orders:list') as any[] | null) || [];
  return c.json(orders);
});

app.put('/make-server-b41c106b/orders/:id/status', async (c) => {
  const user = await getUser(c.req.header('Authorization'));
  if (!user || !(await isAdmin(user.id))) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const orders = (await kv.get('orders:list') as any[] | null) || [];
  const idx = orders.findIndex((o: any) => o.id === id);
  if (idx === -1) return c.json({ error: 'Order not found' }, 404);
  orders[idx].status = status;
  await kv.set('orders:list', orders);
  return c.json(orders[idx]);
});

app.get("/make-server-b41c106b/health", (c) => c.json({ status: "ok" }));

Deno.serve(app.fetch);

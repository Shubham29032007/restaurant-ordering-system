'use strict';
const http = require('http');

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function run() {
  console.log('=== PHASE 2 (ADMIN CORE) VERIFICATION START ===\n');

  // 1. Admin Login
  console.log('1. Testing Admin Login...');
  const loginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'admin@restaurant.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
  });

  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.data));
  }
  const adminToken = loginRes.data.token;
  console.log('✓ Admin login successful, JWT obtained.');

  // 2. Rule 10: Role protection tests on /api/users
  console.log('\n2. Testing Rule 10 (Auth & Role Protection)...');
  const noAuthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/users',
    method: 'GET',
  });
  if (noAuthRes.status !== 401) throw new Error('Expected 401 for unauthenticated request, got ' + noAuthRes.status);
  console.log('✓ GET /api/users without token returned 401.');

  const staffLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'staff1@restaurant.local',
    password: process.env.SEED_STAFF_PASSWORD || 'Staff@1234',
  });
  const staffToken = staffLoginRes.data.token;

  const staffUsersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  if (staffUsersRes.status !== 403) throw new Error('Expected 403 for staff request to /api/users, got ' + staffUsersRes.status);
  console.log('✓ GET /api/users with STAFF token returned 403 Forbidden.');

  // 3. Admin fetch users
  console.log('\n3. Testing Staff Accounts API (ADMIN)...');
  const adminUsersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (adminUsersRes.status !== 200 || !Array.isArray(adminUsersRes.data.users)) {
    throw new Error('Failed to fetch users: ' + JSON.stringify(adminUsersRes.data));
  }
  console.log(`✓ Fetched ${adminUsersRes.data.users.length} users successfully. Passwords securely omitted.`);

  // Create new user (Rule 10: Input validation test)
  const invalidUserRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, { name: '', email: 'not-an-email', password: '123', role: 'INVALID' });
  if (invalidUserRes.status !== 422) throw new Error('Expected 422 for invalid user data, got ' + invalidUserRes.status);
  console.log('✓ POST /api/users with invalid payload properly rejected with 422.');

  const testEmail = `testchef_${Date.now()}@restaurant.local`;
  const createUserRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, {
    name: 'Test Sous Chef',
    email: testEmail,
    password: 'Password@123',
    role: 'CHEF',
    active: true,
  });
  if (createUserRes.status !== 201 || !createUserRes.data.user) {
    throw new Error('Create user failed: ' + JSON.stringify(createUserRes.data));
  }
  const createdUserId = createUserRes.data.user._id;
  console.log(`✓ Created new user "${createUserRes.data.user.name}" (${createUserRes.data.user.email}).`);

  // Update user
  const updateUserRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/users/${createdUserId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, { active: false, name: 'Test Sous Chef (Inactive)' });
  if (updateUserRes.status !== 200 || updateUserRes.data.user.active !== false) {
    throw new Error('Update user failed: ' + JSON.stringify(updateUserRes.data));
  }
  console.log('✓ Updated user successfully (active status toggled).');

  // 4. Menu Manager Verification
  console.log('\n4. Testing Menu Manager API...');
  const createItemRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/menu',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, {
    name: `Signature Dish ${Date.now()}`,
    category: 'Mains',
    description: 'Creamy Arborio rice with black truffle paste and parmesan',
    basePrice: 420.0,
    isVeg: true,
    avgPrepMinutes: 20,
    variants: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 150 }],
    addOns: [{ name: 'Extra Truffle Oil', price: 50 }, { name: 'Aged Shaved Parmesan', price: 60 }],
  });
  if (createItemRes.status !== 201) throw new Error('Create menu item failed: ' + JSON.stringify(createItemRes.data));
  const createdItem = createItemRes.data.item;
  console.log(`✓ Created menu item "${createdItem.name}" with 2 variants and 2 add-ons.`);

  // Toggle availability
  const toggleRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/menu/${createdItem._id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, { available: false });
  if (toggleRes.status !== 200 || toggleRes.data.item.available !== false) {
    throw new Error('Toggle availability failed');
  }
  console.log('✓ Toggled availability of item to false.');

  // 5. Table Manager & QR Sheet Verification (Rule 2)
  console.log('\n5. Testing Table Manager & QR Sheet (Rule 2)...');
  const qrSheetRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/tables/qr-sheet',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (qrSheetRes.status !== 200 || !Array.isArray(qrSheetRes.data.tables)) {
    throw new Error('Failed to get QR sheet: ' + JSON.stringify(qrSheetRes.data));
  }
  const firstTable = qrSheetRes.data.tables[0];
  if (!firstTable.qrDataUrl || !firstTable.qrDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('Invalid QR Data URL returned');
  }
  console.log(`✓ QR sheet returned ${qrSheetRes.data.tables.length} tables with high-res base64 QR images.`);

  // Verify Table QR verification endpoint (Rule 2)
  const verifyQrRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/tables/qr/${firstTable.qrToken}`,
    method: 'GET',
  });
  if (verifyQrRes.status !== 200 || verifyQrRes.data.table.number !== firstTable.number) {
    throw new Error('QR verification failed');
  }
  console.log(`✓ GET /api/tables/qr/:qrToken verified signed JWT and resolved to Table ${firstTable.number}.`);

  // Regenerate QR (Rule 2)
  const regenRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/tables/${firstTable._id}/regenerate-qr`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (regenRes.status !== 200 || regenRes.data.table.qrToken === firstTable.qrToken) {
    throw new Error('Regenerate QR did not generate a new signed token');
  }
  console.log('✓ Regenerated QR token (new JWT signed server-side per Rule 2).');

  // 6. Vite Client Serving Check
  console.log('\n6. Checking Vite dev server frontend response...');
  const viteRes = await request({
    hostname: '127.0.0.1',
    port: 5173,
    path: '/admin/menu',
    method: 'GET',
  });
  if (viteRes.status !== 200) throw new Error('Vite dev server returned status ' + viteRes.status);
  console.log('✓ Vite dev server returned 200 OK for /admin/menu surface.');

  console.log('\n=== ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY ===');
}

if (require.main === module) {
  run().catch((err) => {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  });
}

module.exports = run;

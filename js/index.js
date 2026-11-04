const fallbackImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=650&q=80';
let products = [], cart = [];
let currentPage = 1;
const PAGE_SIZE = 4;

try {
  cart = JSON.parse(localStorage.getItem('novaCart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

function money(v) {
  return Number(v || 0).toLocaleString('vi-VN') + '₫';
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loadLocalProducts() {
  const seed = [
    { id: 1, code: 'NOVA-TS-001', name: 'Áo thun NOVA Basic', category: 'Áo thun', size: 'M', cost: 90000, price: 199000, stock: 20, image: '', description: 'Áo thun basic chất liệu cotton cao cấp.' },
    { id: 2, code: 'NOVA-HOOD-001', name: 'Hoodie NOVA Street', category: 'Hoodie', size: 'M', cost: 180000, price: 399000, stock: 10, image: '', description: 'Hoodie phong cách đường phố.' },
    { id: 3, code: 'NOVA-JK-001', name: 'Áo khoác NOVA Basic', category: 'Áo khoác', size: 'M', cost: 150000, price: 299000, stock: 15, image: '', description: 'Áo khoác nhẹ, phù hợp nhiều thời tiết.' },
    { id: 4, code: 'NOVA-JN-001', name: 'Quần jeans NOVA nam', category: 'Quần', size: 'M', cost: 220000, price: 499000, stock: 9, image: '', description: 'Quần jeans nam dáng regular fit.' },
    { id: 5, code: 'NOVA-WP-001', name: 'Quần ống rộng NOVA nữ', category: 'Quần', size: 'M', cost: 200000, price: 459000, stock: 8, image: '', description: 'Quần ống rộng nữ thời trang, thoải mái.' }
  ];
  try {
    const saved = JSON.parse(localStorage.getItem('novaProducts') || 'null');
    if (Array.isArray(saved)) {
      // Merge: thêm seed mới nếu chưa có (theo id)
      const merged = [...saved];
      seed.forEach(s => {
        if (!merged.find(x => x.id === s.id)) merged.push(s);
      });
      if (merged.length !== saved.length) {
        localStorage.setItem('novaProducts', JSON.stringify(merged));
      }
      return merged;
    }
  } catch { }
  localStorage.setItem('novaProducts', JSON.stringify(seed));
  return seed;
}

function saveLocalProducts(rows) {
  localStorage.setItem('novaProducts', JSON.stringify(rows));
}

function getCustomer() {
  try {
    return JSON.parse(localStorage.getItem('novaCurrentCustomer') || 'null');
  } catch {
    return null;
  }
}

function updateHeaderUser() {
  const c = getCustomer();
  const el = document.getElementById('headerCustomerName');
  if (!el) return;
  if (c && c.name) {
    const shortName = c.name.trim().split(' ').slice(-1)[0];
    el.textContent = 'Hi, ' + shortName;
    el.style.display = 'inline-block';
  } else if (c && c.email) {
    el.textContent = c.email.split('@')[0];
    el.style.display = 'inline-block';
  } else {
    el.textContent = '';
    el.style.display = 'none';
  }
}

function loadProducts() {
  let hiddenCats = [], cats = [];
  try {
    const savedCats = JSON.parse(localStorage.getItem('novaAdminCategories') || '[]');
    hiddenCats = savedCats.filter(c => typeof c === 'object' && c.hidden).map(c => c.name);
    cats = savedCats.filter(c => typeof c === 'string' || !c.hidden).map(c => typeof c === 'string' ? c : c.name);
  } catch { }

  const raw = loadLocalProducts();
  raw.forEach(p => {
    if (p.category && !hiddenCats.includes(p.category) && !cats.includes(p.category)) {
      cats.push(p.category);
    }
  });

  products = raw.filter(p => !p.hidden && !hiddenCats.includes(p.category)).map(p => ({
    ...p,
    id: Number(p.id),
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    image: p.image || fallbackImage
  }));

  const sel = document.getElementById('categoryFilter');
  const old = sel?.value || '';
  if (sel) {
    sel.innerHTML = '<option value="">Tất cả danh mục</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (cats.includes(old)) sel.value = old;
  }

  updateHeaderUser();
  renderProducts();
  renderCart();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const kw = (document.getElementById('productSearch')?.value || '').trim().toLowerCase();
  const cat = document.getElementById('categoryFilter')?.value || '';
  const min = Number(document.getElementById('minPrice')?.value || 0);
  const max = Number(document.getElementById('maxPrice')?.value || Infinity);

  const filtered = products.filter(p =>
    String(p.name || '').toLowerCase().includes(kw) &&
    (!cat || p.category === cat) &&
    Number(p.price) >= min &&
    Number(p.price) <= max
  );

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = paginated.map(p => `
    <article class="product-card">
      <div class="product-image" role="button" tabindex="0" onclick="showProductDetail(${p.id})" onkeydown="if(event.key==='Enter')showProductDetail(${p.id})">
        <img src="${p.image || fallbackImage}" alt="${escapeHtml(p.name)}" loading="lazy">
        <button class="heart-btn" onclick="event.stopPropagation();toggleHeart(this)" aria-label="Yêu thích">♡</button>
      </div>
      <div class="product-info">
        <p class="product-category">${escapeHtml(p.category || 'NOVA ESSENTIALS')}</p>
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <p class="product-price">${money(p.price)}</p>
        <p style="font-size:11px;color:#81786e">${p.stock > 0 ? 'Còn ' + p.stock + ' sản phẩm' : 'Hết hàng'}</p>
        <button class="add-btn" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>THÊM VÀO GIỎ +</button>
        <button class="add-btn" style="margin-top:6px;background:#eee;color:#333" onclick="showProductDetail(${p.id})">XEM CHI TIẾT</button>
      </div>
    </article>
  `).join('');

  const empty = document.getElementById('noProducts');
  if (empty) empty.style.display = filtered.length ? 'none' : 'block';

  renderPagination(totalPages, filtered.length);
}

function renderPagination(totalPages, totalItems) {
  const box = document.getElementById('paginationBox');
  if (!box) return;
  if (totalPages <= 1) { box.innerHTML = ''; return; }

  let html = `<div class="pagination">`;
  html += `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹ Trước</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Sau ›</button>`;
  html += `<span class="page-info">Trang ${currentPage}/${totalPages} · ${totalItems} sản phẩm</span>`;
  html += `</div>`;
  box.innerHTML = html;
}

function goPage(p) {
  const kw = (document.getElementById('productSearch')?.value || '').trim().toLowerCase();
  const cat = document.getElementById('categoryFilter')?.value || '';
  const min = Number(document.getElementById('minPrice')?.value || 0);
  const max = Number(document.getElementById('maxPrice')?.value || Infinity);
  const filtered = products.filter(x =>
    String(x.name || '').toLowerCase().includes(kw) &&
    (!cat || x.category === cat) &&
    Number(x.price) >= min && Number(x.price) <= max
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.max(1, Math.min(p, totalPages));
  renderProducts();
  document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterCategory(c) {
  const sel = document.getElementById('categoryFilter');
  if (sel) sel.value = c;
  currentPage = 1;
  renderProducts();
}

function clearFilter() {
  const sel = document.getElementById('categoryFilter');
  if (sel) sel.value = '';
  const kw = document.getElementById('productSearch');
  if (kw) kw.value = '';
  const min = document.getElementById('minPrice');
  if (min) min.value = '';
  const max = document.getElementById('maxPrice');
  if (max) max.value = '';
  currentPage = 1;
  renderProducts();
}

function toggleHeart(b) {
  b.textContent = b.textContent.trim() === '♡' ? '♥' : '♡';
  b.style.color = b.textContent === '♥' ? '#9d5147' : '#57453a';
}


function saveCart() {
  localStorage.setItem('novaCart', JSON.stringify(cart));
}

function addToCart(id) {
  const c = getCustomer();
  if (!c || !c.id) {
    showToast('Vui lòng đăng ký/đăng nhập để sử dụng giỏ hàng!');
    setTimeout(() => {
      location.href = 'login.html';
    }, 900);
    return;
  }

  const p = products.find(x => Number(x.id) === Number(id));
  if (!p) return;
  if (p.stock <= 0) {
    showToast('Sản phẩm hiện đã hết hàng.');
    return;
  }

  let item = cart.find(x => Number(x.id) === Number(id));
  if (item) {
    if (item.quantity >= p.stock) {
      showToast('Số lượng vượt quá tồn kho.');
      return;
    }
    item.quantity++;
  } else {
    cart.push({ id: Number(p.id), name: p.name, price: Number(p.price), quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast('Đã thêm ' + p.name + ' vào giỏ hàng.');
}

function changeCartQuantity(id, delta) {
  const item = cart.find(x => Number(x.id) === Number(id));
  const p = loadLocalProducts().find(x => Number(x.id) === Number(id));
  if (!item) return;
  if (delta > 0 && (!p || item.quantity >= Number(p.stock))) {
    showToast('Số lượng vượt quá tồn kho.');
    return;
  }
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(x => Number(x.id) !== Number(id));
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(p => Number(p.id) !== Number(id));
  saveCart();
  renderCart();
}

function renderCart() {
  const count = cart.reduce((s, p) => s + Number(p.quantity), 0);
  const total = cart.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0);

  const ce = document.getElementById('cartCount');
  if (ce) ce.textContent = count;

  const te = document.getElementById('cartTotal');
  if (te) te.textContent = money(total);

  const el = document.getElementById('cartItems');
  if (!el) return;

  el.innerHTML = cart.length ? cart.map(p => `
    <div class="cart-item">
      <strong>${escapeHtml(p.name)}</strong><br>
      ${money(p.price)} × ${p.quantity}
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <button type="button" aria-label="Giảm số lượng" onclick="changeCartQuantity(${p.id}, -1)">−</button>
        <span>${p.quantity}</span>
        <button type="button" aria-label="Tăng số lượng" onclick="changeCartQuantity(${p.id}, 1)">+</button>
        <button type="button" onclick="removeFromCart(${p.id})">XÓA</button>
      </div>
    </div>
  `).join('') : '<p style="padding:25px 0;font-size:12px;color:#887d74">Giỏ hàng của bạn đang trống.</p>';
}

function openCart() {
  const c = getCustomer();
  if (!c || !c.id) {
    showToast('Vui lòng đăng nhập để sử dụng giỏ hàng!');
    setTimeout(() => {
      location.href = 'login.html';
    }, 900);
    return;
  }
  document.getElementById('cartDrawer').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

function focusSearch() {
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('productSearch').focus(), 400);
}

function toggleMenu() {
  document.getElementById('mainNav').classList.toggle('open');
}

function showToast(m) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(window.novaToastTimer);
  window.novaToastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* CHI TIẾT SẢN PHẨM */
function showProductDetail(id) {
  const p = products.find(x => Number(x.id) === Number(id));
  if (!p) return;
  document.getElementById('detailImage').src = p.image || fallbackImage;
  document.getElementById('detailImage').alt = p.name;
  document.getElementById('detailCategory').textContent = p.category || 'NOVA ESSENTIALS';

  const codeEl = document.getElementById('detailCode');
  if (codeEl) codeEl.textContent = p.code ? `Mã SP: ${p.code}` : '';

  const sizeEl = document.getElementById('detailSize');
  if (sizeEl) sizeEl.textContent = p.size ? `Size: ${p.size}` : '';

  document.getElementById('detailName').textContent = p.name;
  document.getElementById('detailPrice').textContent = money(p.price);
  document.getElementById('detailDescription').textContent = p.description || 'Sản phẩm thời trang cao cấp NOVA';
  document.getElementById('detailStock').textContent = p.stock > 0 ? 'Tình trạng: Còn ' + p.stock + ' sản phẩm trong kho' : 'Tình trạng: Tạm hết hàng';

  const b = document.getElementById('detailAddButton');
  b.disabled = p.stock <= 0;
  b.onclick = () => {
    addToCart(id);
    closeProductDetail();
  };

  document.getElementById('productDetailOverlay').classList.add('show');
  document.getElementById('productDetailModal').classList.add('show');
}

function closeProductDetail() {
  document.getElementById('productDetailOverlay').classList.remove('show');
  document.getElementById('productDetailModal').classList.remove('show');
}

/* QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG */
function openAccount() {
  const c = getCustomer();
  const statusText = document.getElementById('accountStatus');
  const profileForm = document.getElementById('profileForm');
  const btnOrderHistory = document.getElementById('btnOrderHistory');
  const btnLogout = document.getElementById('btnLogout');
  const btnLoginRegister = document.getElementById('btnLoginRegister');

  if (c) {
    statusText.textContent = `Đang đăng nhập: ${c.email}`;
    profileForm.style.display = 'block';
    if (btnOrderHistory) btnOrderHistory.style.display = 'inline-block';
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (btnLoginRegister) btnLoginRegister.style.display = 'none';

    document.getElementById('profileName').value = c?.name || '';
    document.getElementById('profilePhone').value = c?.phone || '';
    document.getElementById('profileAddress').value = c?.address || '';
  } else {
    statusText.textContent = 'Bạn chưa đăng nhập. Đăng nhập hoặc đăng ký để mua hàng và theo dõi đơn hàng.';
    profileForm.style.display = 'none';
    if (btnOrderHistory) btnOrderHistory.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'none';
    if (btnLoginRegister) btnLoginRegister.style.display = 'inline-block';
  }

  document.getElementById('customerOrderHistory').innerHTML = '';
  document.getElementById('accountOverlay').classList.add('show');
  document.getElementById('accountModal').classList.add('show');
}

function closeAccount() {
  document.getElementById('accountOverlay').classList.remove('show');
  document.getElementById('accountModal').classList.remove('show');
}

function saveProfile(e) {
  e.preventDefault();
  const c = getCustomer();
  if (!c) {
    showToast('Vui lòng đăng nhập trước.');
    return;
  }
  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const address = document.getElementById('profileAddress').value.trim();

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số.');
    return;
  }

  const rows = (() => {
    try {
      return JSON.parse(localStorage.getItem('novaCustomers') || '[]');
    } catch {
      return [];
    }
  })();

  const i = rows.findIndex(x => x.id === c.id);
  if (i >= 0) {
    rows[i] = { ...rows[i], name, phone, address };
    localStorage.setItem('novaCustomers', JSON.stringify(rows));
  }

  const current = { id: c.id, name, email: c.email, phone, address };
  localStorage.setItem('novaCurrentCustomer', JSON.stringify(current));

  updateHeaderUser();
  document.getElementById('accountStatus').textContent = 'Đã cập nhật thông tin cá nhân.';
  showToast('Đã lưu thông tin tài khoản.');
}

function showOrderHistory() {
  const c = getCustomer();
  if (!c) {
    document.getElementById('customerOrderHistory').innerHTML = '<p>Vui lòng <a href="login.html" style="text-decoration:underline">đăng nhập</a> để xem đơn hàng.</p>';
    return;
  }
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('novaOrders') || '[]');
  } catch { }

  const mine = orders.filter(o => o.customerId === c.id);
  document.getElementById('customerOrderHistory').innerHTML = '<h3 style="font-size:14px;margin-bottom:8px">Đơn hàng đã mua:</h3>' +
    (mine.length ? mine.map(o => `
      <div style="border-top:1px solid #ddd;padding:10px 0;font-size:12px;line-height:1.6">
        <strong>Đơn #${o.id}</strong> — <span style="color:#777">${escapeHtml(o.date || '')}</span><br>
        Tổng tiền: <strong style="color:#b25838">${money(o.total)}</strong> · Trạng thái: <span style="background:#e8eee4;color:#42623a;padding:2px 6px;border-radius:3px">${escapeHtml(o.status || 'Mới đặt')}</span><br>
        Sản phẩm: ${(o.items || []).map(i => `${escapeHtml(i.name)} × ${i.quantity}`).join(', ')}
      </div>
    `).join('') : '<p style="font-size:12px;color:#888">Bạn chưa có đơn hàng nào.</p>');
}

function customerLogout() {
  localStorage.removeItem('novaCurrentCustomer');
  cart = [];
  saveCart();
  renderCart();
  updateHeaderUser();
  closeAccount();
  showToast('Đã đăng xuất.');
}

/* ĐẶT HÀNG & THANH TOÁN (CHECKOUT) */
function toggleAddressOption() {
  const isSaved = document.getElementById('addrOptSaved')?.checked;
  const savedBlock = document.getElementById('savedAddressBlock');
  const newBlock = document.getElementById('newAddressBlock');
  if (savedBlock) savedBlock.style.display = isSaved ? 'block' : 'none';
  if (newBlock) newBlock.style.display = isSaved ? 'none' : 'block';
}

function openCheckout(e) {
  if (e) e.preventDefault();
  if (!cart.length) {
    showToast('Giỏ hàng đang trống. Hãy thêm sản phẩm trước.');
    return;
  }
  const c = getCustomer();
  if (!c?.id) {
    showToast('Bạn cần đăng nhập trước khi đặt hàng.');
    setTimeout(() => location.href = 'login.html', 800);
    return;
  }

  document.getElementById('checkoutName').value = c.name || '';
  document.getElementById('checkoutPhone').value = c.phone || '';

  const savedText = document.getElementById('savedAddressText');
  const optSaved = document.getElementById('addrOptSaved');
  const optNew = document.getElementById('addrOptNew');

  if (c.address && c.address.trim()) {
    savedText.innerHTML = `<strong>Địa chỉ lưu trong tài khoản:</strong><br>${escapeHtml(c.address)}`;
    optSaved.checked = true;
  } else {
    savedText.innerHTML = `<em>Tài khoản của bạn chưa lưu địa chỉ thường dùng. Vui lòng chọn "Nhập địa chỉ giao hàng mới" bên dưới.</em>`;
    optNew.checked = true;
  }
  toggleAddressOption();

  // Reset controls địa chỉ mới
  const p = document.getElementById('newProvince'); if (p) p.value = '';
  const d = document.getElementById('newDistrict'); if (d) d.value = '';
  const w = document.getElementById('newWard'); if (w) w.value = '';
  const s = document.getElementById('newStreet'); if (s) s.value = '';

  document.getElementById('checkoutPayment').value = 'COD';
  document.getElementById('checkoutMessage').textContent = '';
  document.getElementById('checkoutTotal').textContent = money(cart.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0));

  document.getElementById('checkoutOverlay').classList.add('show');
  document.getElementById('checkoutModal').classList.add('show');
}

function closeCheckout() {
  document.getElementById('checkoutOverlay')?.classList.remove('show');
  document.getElementById('checkoutModal')?.classList.remove('show');
}

function placeOrder(e) {
  if (e) e.preventDefault();
  const msg = document.getElementById('checkoutMessage');
  if (!cart.length) {
    msg.textContent = 'Giỏ hàng đang trống.';
    return;
  }
  const c = getCustomer();
  if (!c?.id) {
    closeCheckout();
    location.href = 'login.html';
    return;
  }

  const form = document.getElementById('checkoutForm');
  if (!form.reportValidity()) return;

  const phoneCheckout = document.getElementById('checkoutPhone').value.trim();
  if (!/^[0-9]{10}$/.test(phoneCheckout)) {
    msg.textContent = 'Số điện thoại nhận hàng không hợp lệ! Vui lòng nhập đúng 10 chữ số.';
    return;
  }

  // Xác định địa chỉ giao hàng dựa trên lựa chọn
  let finalAddress = '';
  const isSaved = document.getElementById('addrOptSaved')?.checked;
  if (isSaved) {
    if (!c.address || !c.address.trim()) {
      msg.textContent = 'Tài khoản chưa có địa chỉ lưu sẵn. Vui lòng chọn "Nhập địa chỉ giao hàng mới".';
      return;
    }
    finalAddress = c.address.trim();
  } else {
    const province = document.getElementById('newProvince')?.value.trim();
    const district = document.getElementById('newDistrict')?.value.trim();
    const ward = document.getElementById('newWard')?.value.trim();
    const street = document.getElementById('newStreet')?.value.trim();
    if (!province || !district || !ward || !street) {
      msg.textContent = 'Vui lòng điền đầy đủ Tỉnh/Thành phố, Quận/Huyện, Phường/Xã và Số nhà/tên đường.';
      return;
    }
    finalAddress = `${street}, Phường/Xã ${ward}, Quận/Huyện ${district}, ${province}`;
  }

  // Kiểm tra tồn kho
  const current = loadLocalProducts();
  for (const it of cart) {
    const p = current.find(x => Number(x.id) === Number(it.id));
    if (!p || p.hidden || Number(p.stock) < Number(it.quantity)) {
      msg.textContent = `Sản phẩm ${it.name} không đủ tồn kho. Vui lòng điều chỉnh giỏ hàng.`;
      return;
    }
  }

  const paymentKey = document.getElementById('checkoutPayment').value;
  const paymentMap = {
    'COD': 'Thanh toán tiền mặt khi nhận hàng (COD)',
    'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
    'ONLINE': 'Thanh toán trực tuyến (Thẻ ATM / Visa / MoMo / VNPAY)'
  };
  const paymentMethodText = paymentMap[paymentKey] || paymentKey;

  const payload = {
    id: Date.now(),
    customerId: c.id,
    customerName: document.getElementById('checkoutName').value.trim(),
    email: c.email,
    phone: phoneCheckout,
    address: finalAddress,
    paymentMethod: paymentKey,
    paymentMethodText: paymentMethodText,
    items: cart.map(p => ({
      id: Number(p.id),
      name: p.name,
      price: Number(p.price),
      quantity: Number(p.quantity)
    })),
    total: cart.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0),
    status: 'Mới đặt',
    date: new Date().toLocaleString('vi-VN'),
    createdAt: new Date().toISOString()
  };

  // Trừ tồn kho và ghi nhận phiếu xuất kho
  const saleDate = new Date().toISOString().slice(0, 10);
  let movements = [];
  try {
    movements = JSON.parse(localStorage.getItem('novaExports') || '[]');
  } catch { }

  for (const it of payload.items) {
    const p = current.find(x => Number(x.id) === it.id);
    const before = Number(p.stock);
    p.stock -= it.quantity;
    movements.unshift({
      code: 'PX' + String(payload.id).slice(-8) + '-' + it.id,
      date: saleDate,
      name: p.name,
      productId: p.id,
      quantity: it.quantity,
      before,
      after: p.stock,
      note: 'Xuất bán theo đơn #' + payload.id
    });
  }
  localStorage.setItem('novaExports', JSON.stringify(movements));
  saveLocalProducts(current);

  // Lưu đơn hàng vào novaOrders
  const orders = (() => {
    try {
      return JSON.parse(localStorage.getItem('novaOrders') || '[]');
    } catch {
      return [];
    }
  })();
  orders.unshift(payload);
  localStorage.setItem('novaOrders', JSON.stringify(orders));

  // Cập nhật SĐT và địa chỉ mới nhất vào tài khoản nếu chưa có
  const rows = (() => {
    try {
      return JSON.parse(localStorage.getItem('novaCustomers') || '[]');
    } catch {
      return [];
    }
  })();
  const ci = rows.findIndex(x => x.id === c.id);
  if (ci >= 0) {
    rows[ci].phone = payload.phone;
    if (!rows[ci].address) rows[ci].address = finalAddress;
    localStorage.setItem('novaCustomers', JSON.stringify(rows));
    localStorage.setItem('novaCurrentCustomer', JSON.stringify({
      ...c,
      phone: payload.phone,
      address: rows[ci].address
    }));
  }

  // Reset giỏ hàng và giao diện
  cart = [];
  saveCart();
  loadProducts();
  closeCheckout();
  closeCart();
  form.reset();

  // Hiển thị modal xem lại đơn hàng vừa đặt
  showOrderSuccess(payload);
}

/* XEM LẠI ĐƠN HÀNG VỪA ĐẶT THÀNH CÔNG */
function showOrderSuccess(order) {
  const c = document.getElementById('orderSuccessContent');
  if (!c) return;
  c.innerHTML = `
    <div style="background:#faf8f5;border:1px solid #e1dcd5;padding:14px;border-radius:4px;margin-bottom:14px;line-height:1.7">
      <div><strong>Mã đơn hàng:</strong> #${order.id}</div>
      <div><strong>Thời gian đặt:</strong> ${escapeHtml(order.date)}</div>
      <div><strong>Người nhận:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.phone)})</div>
      <div><strong>Địa chỉ giao:</strong> ${escapeHtml(order.address)}</div>
      <div><strong>Phương thức thanh toán:</strong> ${escapeHtml(order.paymentMethodText || order.paymentMethod)}</div>
      <div><strong>Trạng thái:</strong> <span style="background:#e8eee4;color:#42623a;padding:2px 8px;border-radius:3px;font-weight:600">${escapeHtml(order.status)}</span></div>
    </div>
    <h3 style="font-size:13px;margin-bottom:6px">Sản phẩm đã đặt:</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="border-bottom:1px solid #ddd;text-align:left">
          <th style="padding:6px 0">Sản phẩm</th>
          <th style="padding:6px 0;text-align:center">SL</th>
          <th style="padding:6px 0;text-align:right">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(it => `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:6px 0"><strong>${escapeHtml(it.name)}</strong><br><small style="color:#777">${money(it.price)}</small></td>
            <td style="padding:6px 0;text-align:center">${it.quantity}</td>
            <td style="padding:6px 0;text-align:right"><strong>${money(it.price * it.quantity)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 0;font-weight:bold;font-size:13px">TỔNG CỘNG THANH TOÁN:</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:15px;color:#b25838">${money(order.total)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  document.getElementById('orderSuccessOverlay')?.classList.add('show');
  document.getElementById('orderSuccessModal')?.classList.add('show');
}

function closeOrderSuccess() {
  document.getElementById('orderSuccessOverlay')?.classList.remove('show');
  document.getElementById('orderSuccessModal')?.classList.remove('show');
}

function subscribe(e) {
  e.preventDefault();
  document.getElementById('newsletterMessage').textContent = 'Cảm ơn bạn đã quan tâm NOVA!';
  e.target.reset();
}

window.addEventListener('storage', e => {
  if (['novaProducts', 'novaAdminCategories'].includes(e.key)) loadProducts();
});

document.addEventListener('DOMContentLoaded', loadProducts);

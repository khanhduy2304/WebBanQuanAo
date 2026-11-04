// NOVA admin: toàn bộ dữ liệu demo được lưu trong localStorage của trình duyệt.
if (sessionStorage.getItem('novaAdminLoggedIn') !== 'true') window.location.replace('loginadmin.html');

const defaultCategories = ['Áo thun', 'Áo khoác', 'Hoodie', 'Quần', 'Phụ kiện'];
const seedProducts = [
  { id: 1, code: 'NOVA-TS-001', name: 'Áo thun NOVA Basic', category: 'Áo thun', size: 'M', cost: 90000, price: 199000, stock: 20, image: 'assets/images/product/aothun.jpg', description: 'Áo thun basic chất liệu cotton cao cấp.' },
  { id: 2, code: 'NOVA-HOOD-001', name: 'Hoodie NOVA Street', category: 'Hoodie', size: 'M', cost: 180000, price: 399000, stock: 10, image: 'assets/images/product/hoodie.jpg', description: 'Hoodie phong cách đường phố.' },
  { id: 3, code: 'NOVA-JK-001', name: 'Áo khoác NOVA Basic', category: 'Áo khoác', size: 'M', cost: 150000, price: 299000, stock: 15, image: 'assets/images/product/ao_khoac.jpg', description: 'Áo khoác nhẹ, phù hợp nhiều thời tiết.' },
  { id: 4, code: 'NOVA-JN-001', name: 'Quần jeans NOVA nam', category: 'Quần', size: 'M', cost: 220000, price: 499000, stock: 9, image: 'assets/images/product/quan_jeans_nam.jpg', description: 'Quần jeans nam dáng regular fit.' },
  { id: 5, code: 'NOVA-WP-001', name: 'Quần ống rộng NOVA nữ', category: 'Quần', size: 'M', cost: 200000, price: 459000, stock: 8, image: 'assets/images/product/quan_ong_rong_nu.jpg', description: 'Quần ống rộng nữ thời trang, thoải mái.' }
];

const defaultCategoryProfits = {
  'Áo thun': 40,
  'Áo khoác': 45,
  'Hoodie': 40,
  'Quần': 35,
  'Phụ kiện': 50
};

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
};

let products = read('novaProducts', seedProducts);
let orders = read('novaOrders', []);
let customers = read('novaCustomers', []);
let categories = read('novaAdminCategories', defaultCategories);
let categoryProfits = read('novaCategoryProfits', defaultCategoryProfits);
let imports = read('novaImports', []);
let exportsStock = read('novaExports', []);
let blockedCustomers = read('novaBlockedCustomers', []);

function persistAll() {
  localStorage.setItem('novaProducts', JSON.stringify(products));
  localStorage.setItem('novaOrders', JSON.stringify(orders));
  localStorage.setItem('novaCustomers', JSON.stringify(customers));
  localStorage.setItem('novaImports', JSON.stringify(imports));
  localStorage.setItem('novaExports', JSON.stringify(exportsStock));
  localStorage.setItem('novaAdminCategories', JSON.stringify(categories));
  localStorage.setItem('novaCategoryProfits', JSON.stringify(categoryProfits));
}

function money(v) {
  return Number(v || 0).toLocaleString('vi-VN') + '₫';
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showPage(id, button) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(id);
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
  if (button) button.classList.add('active');

  if (id === 'dashboard') renderDashboard();
  if (id === 'products') renderAdminProducts();
  if (id === 'categories') renderCategories();
  if (id === 'imports') renderImports();
  if (id === 'exports') renderExports();
  if (id === 'prices') renderPrices();
  if (id === 'inventory') renderInventory();
  if (id === 'orders') renderOrders();
  if (id === 'customers') renderCustomers();
}

function showMessage(t) {
  const e = document.getElementById('adminMessage');
  if (e) {
    e.textContent = t;
    setTimeout(() => { if (e.textContent === t) e.textContent = ''; }, 4000);
  }
}

function renderDashboard() {
  document.getElementById('statProducts').textContent = products.filter(p => !p.hidden).length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statCustomers').textContent = customers.length;
  document.getElementById('statLow').textContent = products.filter(p => !p.hidden && Number(p.stock) < 10).length;

  const r = document.getElementById('recentOrders');
  if (r) {
    if (!orders.length) {
      r.innerHTML = '<p class="muted">Chưa có đơn hàng nào.</p>';
    } else {
      r.innerHTML = orders.slice(0, 5).map(o => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#faf8f5;margin-bottom:8px;border:1px solid #ede7e0;border-radius:3px">
          <div>
            <strong>Đơn #${o.id}</strong> · ${escapeHtml(o.customerName || 'Khách')} · <span class="muted">${escapeHtml(o.date || '')}</span><br>
            <strong style="color:#b25838">${money(o.total)}</strong> · <span class="badge">${escapeHtml(o.status || 'Mới đặt')}</span>
          </div>
          <button class="btn-light" type="button" onclick="showOrderDetail(${o.id})">Chi tiết</button>
        </div>
      `).join('');
    }
  }
}


function handleImageFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert('Ảnh có kích thước quá lớn (> 2MB). Vui lòng chọn ảnh nhỏ hơn.');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById('pImage').value = e.target.result;
    showImagePreview(e.target.result);
  };
  reader.readAsDataURL(file);
}

function previewImageUrl(url) {
  if (!url || !url.trim()) {
    document.getElementById('pImagePreview').style.display = 'none';
    return;
  }
  showImagePreview(url.trim());
}

function showImagePreview(src) {
  const box = document.getElementById('pImagePreview');
  const img = document.getElementById('pImagePreviewImg');
  if (!box || !img) return;
  img.src = src;
  box.style.display = 'block';
}

function clearImageInput() {
  document.getElementById('pImage').value = '';
  const fi = document.getElementById('pImageFile');
  if (fi) fi.value = '';
  document.getElementById('pImagePreview').style.display = 'none';
}


function showProductForm(p) {
  document.getElementById('productFormPanel').classList.remove('hidden');
  document.getElementById('productFormTitle').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  document.getElementById('productId').value = p ? p.id : '';
  document.getElementById('pCode').value = p ? p.code : '';
  document.getElementById('pName').value = p ? p.name : '';
  document.getElementById('pCategory').value = p ? p.category : (categories[0] || 'Áo thun');
  document.getElementById('pSize').value = p ? p.size : 'M';
  document.getElementById('pCost').value = p ? p.cost : '';
  document.getElementById('pPrice').value = p ? p.price : '';
  document.getElementById('pStock').value = p ? p.stock : '';
  document.getElementById('pDescription').value = p ? p.description || '' : '';
  const img = p ? (p.image || '') : '';
  document.getElementById('pImage').value = img;
  const fi = document.getElementById('pImageFile');
  if (fi) fi.value = '';
  if (img) {
    showImagePreview(img);
  } else {
    document.getElementById('pImagePreview').style.display = 'none';
  }
  document.getElementById('productFormPanel').scrollIntoView({ behavior: 'smooth' });
}

function hideProductForm() {
  document.getElementById('productFormPanel').classList.add('hidden');
  document.getElementById('productForm').reset();
  clearImageInput();
}

function saveProduct(event) {
  event.preventDefault();
  const id = document.getElementById('productId').value;
  const p = {
    id: id ? Number(id) : Date.now(),
    code: document.getElementById('pCode').value.trim(),
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value,
    size: document.getElementById('pSize').value,
    cost: Number(document.getElementById('pCost').value),
    price: Number(document.getElementById('pPrice').value),
    stock: Number(document.getElementById('pStock').value),
    image: document.getElementById('pImage').value.trim(),
    description: document.getElementById('pDescription').value.trim(),
    hidden: id ? (products.find(x => x.id === Number(id))?.hidden || false) : false
  };

  if (products.some(x => x.code.toLowerCase() === p.code.toLowerCase() && x.id !== p.id)) {
    document.getElementById('productMessage').textContent = 'Mã sản phẩm đã tồn tại.';
    return;
  }

  if (id) {
    products = products.map(x => x.id === Number(id) ? p : x);
  } else {
    products.push(p);
  }

  persistAll();
  renderAdminProducts();
  renderDashboard();
  hideProductForm();
  showMessage('Đã lưu sản phẩm thành công.');
}

function renderAdminProducts() {
  const keyword = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || '';
  const filtered = products.filter(p =>
    (String(p.name).toLowerCase().includes(keyword) || String(p.code).toLowerCase().includes(keyword)) &&
    (!category || p.category === category)
  );

  document.getElementById('productTable').innerHTML = filtered.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.code)}</strong></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || '')}</td>
      <td>${money(p.cost)}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock}</td>
      <td><span class="badge" style="background:${p.hidden ? '#fee' : '#e8eee4'};color:${p.hidden ? '#a00' : '#42623a'}">${p.hidden ? 'Đang ẩn' : 'Đang bán'}</span></td>
      <td>
        <button class="btn-light" onclick="editProduct(${p.id})">Sửa</button>
        <button class="btn-light" onclick="toggleProductVisibility(${p.id})">${p.hidden ? 'Hiện' : 'Ẩn'}</button>
        <button class="btn-light" onclick="deleteProduct(${p.id})">Xóa</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8">Không tìm thấy sản phẩm.</td></tr>';
}

function toggleProductVisibility(id) {
  const p = products.find(x => x.id === Number(id));
  if (!p) return;
  p.hidden = !p.hidden;
  persistAll();
  renderAdminProducts();
  showMessage(p.hidden ? 'Đã ẩn sản phẩm khỏi cửa hàng.' : 'Đã hiển thị sản phẩm trên cửa hàng.');
}

function editProduct(id) {
  const p = products.find(x => x.id === Number(id));
  if (p) showProductForm(p);
}

function deleteProduct(id) {
  const p = products.find(x => x.id === Number(id));
  if (!p || !confirm('Xóa sản phẩm ' + p.name + '?')) return;
  products = products.filter(x => x.id !== Number(id));
  persistAll();
  renderAdminProducts();
  renderDashboard();
  showMessage('Đã xóa sản phẩm khỏi hệ thống.');
}

/* QUẢN LÝ LOẠI SẢN PHẨM */
function renderCategories() {
  document.getElementById('categoryTable').innerHTML = categories.map((v, i) => {
    const n = typeof v === 'string' ? v : v.name;
    const hidden = typeof v === 'object' && v.hidden;
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(n)}</strong></td>
      <td><span class="badge" style="background:${hidden ? '#fee' : '#e8eee4'};color:${hidden ? '#a00' : '#42623a'}">${hidden ? 'Đang ẩn' : 'Đang hiện'}</span></td>
      <td>
        <button class="btn-light" onclick="editCategory(${i})">Sửa tên</button>
        <button class="btn-light" onclick="toggleCategoryVisibility(${i})">${hidden ? 'Hiện' : 'Ẩn'}</button>
        <button class="btn-light" onclick="deleteCategory(${i})">Xóa</button>
      </td>
    </tr>`;
  }).join('');

  const active = categories.filter(c => typeof c === 'string' || !c.hidden).map(c => typeof c === 'string' ? c : c.name);

  // Cập nhật các select category trong hệ thống
  const sel = document.getElementById('pCategory');
  if (sel) sel.innerHTML = active.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');

  const filter = document.getElementById('categoryFilter');
  if (filter) {
    const cur = filter.value;
    filter.innerHTML = '<option value="">Tất cả loại</option>' + active.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (active.includes(cur)) filter.value = cur;
  }

  const priceCat = document.getElementById('priceCategoryFilter');
  if (priceCat) {
    const cur = priceCat.value;
    priceCat.innerHTML = '<option value="">Tất cả loại sản phẩm</option>' + active.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (active.includes(cur)) priceCat.value = cur;
  }

  const invCat = document.getElementById('inventoryCategoryFilter');
  if (invCat) {
    const cur = invCat.value;
    invCat.innerHTML = '<option value="">Tất cả loại sản phẩm</option>' + active.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (active.includes(cur)) invCat.value = cur;
  }
}

function editCategory(i) {
  const old = typeof categories[i] === 'string' ? categories[i] : categories[i].name;
  const next = prompt('Tên loại sản phẩm mới:', old);
  if (next === null || !next.trim()) return;
  const name = next.trim();
  if (categories.some((c, j) => j !== i && (typeof c === 'string' ? c : c.name).toLowerCase() === name.toLowerCase())) {
    alert('Tên loại đã tồn tại.');
    return;
  }
  categories[i] = typeof categories[i] === 'string' ? name : { ...categories[i], name };
  if (categoryProfits[old] !== undefined) {
    categoryProfits[name] = categoryProfits[old];
    delete categoryProfits[old];
  }
  products = products.map(p => p.category === old ? { ...p, category: name } : p);
  persistAll();
  renderCategories();
  renderAdminProducts();
  showMessage('Đã sửa tên loại sản phẩm.');
}

function toggleCategoryVisibility(i) {
  if (typeof categories[i] === 'string') categories[i] = { name: categories[i], hidden: true };
  else categories[i].hidden = !categories[i].hidden;
  persistAll();
  renderCategories();
  renderAdminProducts();
}

function addCategory(event) {
  event.preventDefault();
  const name = document.getElementById('newCategory').value.trim();
  if (!name) return;
  if (categories.some(c => (typeof c === 'string' ? c : c.name).toLowerCase() === name.toLowerCase())) {
    showMessage('Loại sản phẩm này đã tồn tại.');
    return;
  }
  categories.push(name);
  if (!categoryProfits[name]) categoryProfits[name] = 40;
  persistAll();
  event.target.reset();
  renderCategories();
  showMessage('Đã thêm loại sản phẩm.');
}

function deleteCategory(i) {
  const name = typeof categories[i] === 'string' ? categories[i] : categories[i].name;
  if (products.some(p => p.category === name)) {
    alert('Không thể xóa loại đang có sản phẩm.');
    return;
  }
  categories.splice(i, 1);
  delete categoryProfits[name];
  persistAll();
  renderCategories();
}

/* QUẢN LÝ NHẬP HÀNG */
function renderImports() {
  const sel = document.getElementById('importProduct');
  if (sel) {
    sel.innerHTML = products.map(p => `<option value="${p.id}">${escapeHtml(p.code)} - ${escapeHtml(p.name)}</option>`).join('');
  }
  const dateInput = document.getElementById('importDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  const kw = (document.getElementById('importSearch')?.value || '').toLowerCase().trim();
  const from = document.getElementById('importDateFrom')?.value || '';
  const to = document.getElementById('importDateTo')?.value || '';

  const filtered = imports.filter(i => {
    const code = String(i.code || '').toLowerCase();
    const name = String(i.name || '').toLowerCase();
    const note = String(i.note || '').toLowerCase();
    const matchKw = !kw || code.includes(kw) || name.includes(kw) || note.includes(kw);
    const d = String(i.date || '').slice(0, 10);
    const matchDate = (!from || d >= from) && (!to || d <= to);
    return matchKw && matchDate;
  });

  document.getElementById('importTable').innerHTML = filtered.map(i => `
    <tr>
      <td><strong>${escapeHtml(i.code)}</strong></td>
      <td>${escapeHtml(i.date)}</td>
      <td>${escapeHtml(i.name)}</td>
      <td>${i.quantity}</td>
      <td>${money(i.quantity * i.cost)}</td>
      <td><span class="badge" style="background:${i.status === 'Chưa hoàn thành' ? '#fff3cd' : '#e8eee4'};color:${i.status === 'Chưa hoàn thành' ? '#856404' : '#42623a'}">${escapeHtml(i.status || 'Hoàn thành')}</span></td>
      <td>${escapeHtml(i.note || '')}</td>
      <td>
        ${(i.status === 'Chưa hoàn thành') ?
      `<button class="btn-light" onclick="editImport('${i.code}')">Sửa</button> <button class="btn-light" onclick="completeImport('${i.code}')">Hoàn thành</button>` :
      '<span class="muted">Đã khóa</span>'
    }
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8">Không tìm thấy phiếu nhập hàng nào.</td></tr>';
}

function resetImportForm() {
  document.getElementById('importForm').reset();
  document.getElementById('importEditCode').value = '';
  document.getElementById('importDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('importSubmit').textContent = 'LƯU PHIẾU NHẬP NHÁP';
}

function editImport(code) {
  const i = imports.find(x => x.code === code);
  if (!i || i.status !== 'Chưa hoàn thành') return;
  document.getElementById('importEditCode').value = i.code;
  document.getElementById('importDate').value = i.date;
  document.getElementById('importProduct').value = String(i.productId);
  document.getElementById('importQuantity').value = i.quantity;
  document.getElementById('importCost').value = i.cost;
  document.getElementById('importNote').value = i.note || '';
  document.getElementById('importSubmit').textContent = 'CẬP NHẬT PHIẾU NHÁP';
  document.getElementById('importForm').scrollIntoView({ behavior: 'smooth' });
}

function createImport(event) {
  event.preventDefault();
  const code = document.getElementById('importEditCode').value;
  const p = products.find(x => x.id === Number(document.getElementById('importProduct').value));
  const quantity = Number(document.getElementById('importQuantity').value);
  const cost = Number(document.getElementById('importCost').value);

  if (!p || quantity < 1 || cost < 0) return;

  const data = {
    date: document.getElementById('importDate').value,
    name: p.name,
    productId: p.id,
    quantity,
    cost,
    note: document.getElementById('importNote')?.value.trim() || ''
  };

  if (code) {
    imports = imports.map(i => i.code === code && i.status === 'Chưa hoàn thành' ? { ...i, ...data } : i);
    showMessage('Đã cập nhật phiếu nhập nháp.');
  } else {
    imports.unshift({
      code: 'PN' + Date.now().toString().slice(-8),
      ...data,
      before: Number(p.stock),
      after: Number(p.stock),
      status: 'Chưa hoàn thành'
    });
    showMessage('Đã lưu phiếu nhập nháp. Hãy kiểm tra rồi bấm Hoàn thành để cộng tồn kho.');
  }

  persistAll();
  resetImportForm();
  renderImports();
}

function completeImport(code) {
  const i = imports.find(x => x.code === code);
  if (!i || i.status !== 'Chưa hoàn thành') return;
  const p = products.find(x => x.id === Number(i.productId));
  if (!p) {
    alert('Không tìm thấy sản phẩm của phiếu nhập.');
    return;
  }
  if (!confirm('Hoàn thành phiếu ' + code + ' và cộng ' + i.quantity + ' sản phẩm vào tồn kho?')) return;

  const before = Number(p.stock);
  p.stock = before + Number(i.quantity);
  p.cost = Number(i.cost);
  i.before = before;
  i.after = p.stock;
  i.status = 'Hoàn thành';
  i.completedAt = new Date().toISOString();

  persistAll();
  renderImports();
  renderInventory();
  renderAdminProducts();
  renderDashboard();
  showMessage('Phiếu nhập đã hoàn thành và tồn kho được cập nhật.');
}

/* QUẢN LÝ XUẤT HÀNG */
function renderExports() {
  document.getElementById('exportProduct').innerHTML = products.map(p => `<option value="${p.id}">${escapeHtml(p.code)} - ${escapeHtml(p.name)}</option>`).join('');
  document.getElementById('exportDate').value ||= new Date().toISOString().slice(0, 10);
  document.getElementById('exportTable').innerHTML = exportsStock.map(i => `
    <tr>
      <td><strong>${escapeHtml(i.code)}</strong></td>
      <td>${escapeHtml(i.date)}</td>
      <td>${escapeHtml(i.name)}</td>
      <td>${i.quantity}</td>
      <td>${i.before}</td>
      <td>${i.after}</td>
      <td>${escapeHtml(i.note || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="7">Chưa có phiếu xuất.</td></tr>';
}

function createExport(event) {
  event.preventDefault();
  const p = products.find(x => x.id === Number(document.getElementById('exportProduct').value));
  const quantity = Number(document.getElementById('exportQuantity').value);
  if (!p || quantity < 1) return;
  if (quantity > p.stock) {
    showMessage('Số lượng xuất lớn hơn tồn kho hiện tại.');
    return;
  }
  const before = Number(p.stock);
  p.stock -= quantity;
  exportsStock.unshift({
    code: 'PX' + Date.now().toString().slice(-8),
    date: document.getElementById('exportDate').value,
    name: p.name,
    productId: p.id,
    quantity,
    before,
    after: p.stock,
    note: document.getElementById('exportNote')?.value.trim() || ''
  });
  persistAll();
  event.target.reset();
  renderExports();
  renderInventory();
  renderAdminProducts();
  renderDashboard();
  showMessage('Đã tạo phiếu xuất và trừ tồn kho.');
}

/* QUẢN LÝ GIÁ BÁN & TỈ LỆ LỢI NHUẬN */
function renderPrices() {
  const activeCats = categories.filter(c => typeof c === 'string' || !c.hidden).map(c => typeof c === 'string' ? c : c.name);

  // 1. Render cấu hình % lợi nhuận theo loại
  const catConf = document.getElementById('categoryProfitConfig');
  if (catConf) {
    catConf.innerHTML = activeCats.map(c => {
      const p = categoryProfits[c] ?? 40;
      return `
        <div style="border:1px solid #ddd4cb;padding:12px;background:#faf8f5;border-radius:4px">
          <strong>${escapeHtml(c)}</strong>
          <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
            <input id="catProfit_${escapeHtml(c)}" type="number" min="0" max="500" value="${p}" style="width:75px;padding:6px" placeholder="%">
            <span style="font-size:12px">% LN</span>
            <button class="btn" style="padding:6px 12px;font-size:11px" type="button" onclick="applyCategoryProfit('${escapeHtml(c)}')">Áp dụng</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Tra cứu & hiển thị giá từng sản phẩm
  const kw = (document.getElementById('priceSearch')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('priceCategoryFilter')?.value || '';

  const visible = products.filter(p => !p.hidden &&
    (String(p.name).toLowerCase().includes(kw) || String(p.code).toLowerCase().includes(kw)) &&
    (!cat || p.category === cat)
  );

  document.getElementById('priceTable').innerHTML = visible.map(p => {
    const cost = Number(p.cost || 0);
    const price = Number(p.price || 0);
    const profit = price - cost;
    const margin = cost > 0 ? Math.round((profit / cost) * 100) : 0;
    return `<tr>
      <td><strong>${escapeHtml(p.code)}</strong></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || '—')}</td>
      <td>${money(cost)}</td>
      <td><strong>${margin}%</strong></td>
      <td><strong style="color:#b25838">${money(price)}</strong></td>
      <td>${money(profit)}</td>
      <td>
        <button class="btn-light" onclick="editProductMargin(${p.id})">Sửa % LN</button>
        <button class="btn-light" onclick="changePrice(${p.id})">Sửa giá bán</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8">Không tìm thấy sản phẩm phù hợp.</td></tr>';
}

function applyCategoryProfit(catName) {
  const input = document.getElementById('catProfit_' + catName);
  const val = Number(input?.value);
  if (!Number.isFinite(val) || val < 0) {
    alert('Vui lòng nhập tỉ lệ % lợi nhuận hợp lệ.');
    return;
  }
  categoryProfits[catName] = val;
  let count = 0;
  products = products.map(p => {
    if (p.category === catName && Number(p.cost) > 0) {
      p.price = Math.round((p.cost * (1 + val / 100)) / 1000) * 1000;
      count++;
    }
    return p;
  });
  persistAll();
  renderPrices();
  renderAdminProducts();
  showMessage(`Đã áp dụng tỉ lệ lợi nhuận ${val}% cho loại "${catName}" (cập nhật ${count} sản phẩm).`);
}

function editProductMargin(id) {
  const p = products.find(x => x.id === Number(id));
  if (!p) return;
  const currentMargin = p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0;
  const next = prompt(`Nhập tỉ lệ % lợi nhuận cho sản phẩm "${p.name}" (hiện tại: ${currentMargin}%):`, currentMargin);
  if (next === null || !next.trim()) return;
  const margin = Number(next);
  if (!Number.isFinite(margin) || margin < 0) {
    alert('Tỉ lệ % không hợp lệ.');
    return;
  }
  if (p.cost <= 0) {
    alert('Sản phẩm chưa có giá vốn, vui lòng cập nhật giá vốn trước.');
    return;
  }
  p.price = Math.round((p.cost * (1 + margin / 100)) / 1000) * 1000;
  persistAll();
  renderPrices();
  renderAdminProducts();
  showMessage(`Đã cập nhật giá bán "${p.name}": ${money(p.price)} (Tỉ lệ lợi nhuận ${margin}%).`);
}

function changePrice(id) {
  const p = products.find(x => x.id === Number(id));
  if (!p) return;
  const price = Number(prompt('Nhập giá bán mới (VNĐ):', p.price));
  if (!Number.isFinite(price) || price < 0) return;
  p.price = price;
  persistAll();
  renderPrices();
  renderAdminProducts();
  showMessage('Đã cập nhật giá bán.');
}

/* QUẢN LÝ TỒN KHO & NHẬP - XUẤT - TỒN */
function renderInventory() {
  const k = (document.getElementById('inventorySearch')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('inventoryCategoryFilter')?.value || '';

  // 1. Bảng tồn kho hiện tại
  document.getElementById('inventoryTable').innerHTML = products
    .filter(p => (!cat || p.category === cat) && (p.name.toLowerCase().includes(k) || p.code.toLowerCase().includes(k)))
    .map(p => `<tr>
      <td><strong>${escapeHtml(p.code)}</strong></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || '')}</td>
      <td><strong>${p.stock}</strong></td>
      <td>${money(p.cost * p.stock)}</td>
      <td><span class="badge" style="background:${p.stock <= 0 ? '#fdd' : p.stock < 10 ? '#fee' : '#e8eee4'};color:${p.stock <= 0 ? '#800' : p.stock < 10 ? '#a00' : '#42623a'}">${p.stock <= 0 ? 'Hết hàng' : p.stock < 10 ? 'Sắp hết hàng' : 'Còn hàng'}</span></td>
    </tr>`).join('') || '<tr><td colspan="6">Không có dữ liệu tồn kho.</td></tr>';

  // 2. Cập nhật dropdown chọn sản phẩm cho NXT
  const nxtSel = document.getElementById('nxtProductSelect');
  if (nxtSel) {
    const curVal = nxtSel.value;
    nxtSel.innerHTML = products.map(p => `<option value="${p.id}">${escapeHtml(p.code)} - ${escapeHtml(p.name)}</option>`).join('');
    if (curVal && products.some(x => String(x.id) === String(curVal))) {
      nxtSel.value = curVal;
    }
  }

  // 3. Bảng lịch sử tất cả giao dịch nhập - xuất
  const from = document.getElementById('movementDateFrom')?.value || '';
  const to = document.getElementById('movementDateTo')?.value || '';
  const day = x => String(x.date || '').slice(0, 10);

  const all = [
    ...imports.filter(x => x.status === 'Hoàn thành').map(x => ({ ...x, type: 'Nhập' })),
    ...exportsStock.map(x => ({ ...x, type: 'Xuất' }))
  ].filter(x => (!from || day(x) >= from) && (!to || day(x) <= to));

  const sumIn = all.filter(x => x.type === 'Nhập').reduce((a, x) => a + Number(x.quantity || 0), 0);
  const sumOut = all.filter(x => x.type === 'Xuất').reduce((a, x) => a + Number(x.quantity || 0), 0);

  const m = document.getElementById('movementSummary');
  if (m) {
    m.textContent = `Trong khoảng đã chọn: ${all.length} giao dịch · Nhập: ${sumIn} sản phẩm · Xuất: ${sumOut} sản phẩm · Biến động ròng: ${sumIn - sumOut} sản phẩm.`;
  }

  const movements = all.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const mt = document.getElementById('movementTable');
  if (mt) {
    mt.innerHTML = movements.map(x => `<tr>
      <td>${escapeHtml(x.date || '')}</td>
      <td><strong>${escapeHtml(x.code || '')}</strong></td>
      <td><span class="badge" style="background:${x.type === 'Nhập' ? '#e8f4fd' : '#fde8e8'};color:${x.type === 'Nhập' ? '#1e5f8a' : '#8a1e1e'}">${x.type}</span></td>
      <td>${escapeHtml(x.name || '')}</td>
      <td><strong>${x.quantity || 0}</strong></td>
      <td>${x.before ?? '—'}</td>
      <td>${x.after ?? '—'}</td>
      <td>${escapeHtml(x.note || '')}</td>
    </tr>`).join('') || '<tr><td colspan="8">Không có giao dịch trong khoảng đã chọn.</td></tr>';
  }

  calcNXTReport();
}

function calcNXTReport() {
  const sel = document.getElementById('nxtProductSelect');
  if (!sel || !sel.value) return;
  const pid = Number(sel.value);
  const p = products.find(x => x.id === pid);
  if (!p) return;

  const from = document.getElementById('nxtDateFrom')?.value || '';
  const to = document.getElementById('nxtDateTo')?.value || '';
  const day = x => String(x.date || '').slice(0, 10);

  const pImports = imports.filter(x => Number(x.productId) === pid && x.status === 'Hoàn thành');
  const pExports = exportsStock.filter(x => Number(x.productId) === pid);

  const inImports = pImports.filter(x => (!from || day(x) >= from) && (!to || day(x) <= to));
  const inExports = pExports.filter(x => (!from || day(x) >= from) && (!to || day(x) <= to));

  const totalIn = inImports.reduce((s, x) => s + Number(x.quantity || 0), 0);
  const totalOut = inExports.reduce((s, x) => s + Number(x.quantity || 0), 0);

  const postImports = to ? pImports.filter(x => day(x) > to).reduce((s, x) => s + Number(x.quantity || 0), 0) : 0;
  const postExports = to ? pExports.filter(x => day(x) > to).reduce((s, x) => s + Number(x.quantity || 0), 0) : 0;

  const currentStock = Number(p.stock || 0);
  const endingStock = currentStock - postImports + postExports;
  const beginningStock = endingStock - totalIn + totalOut;

  document.getElementById('nxtBeginning').textContent = beginningStock;
  document.getElementById('nxtTotalIn').textContent = totalIn;
  document.getElementById('nxtTotalOut').textContent = totalOut;
  document.getElementById('nxtEnding').textContent = endingStock;

  const details = [
    ...inImports.map(x => ({ date: x.date, code: x.code, type: 'Nhập', quantity: x.quantity, before: x.before, after: x.after, note: x.note })),
    ...inExports.map(x => ({ date: x.date, code: x.code, type: 'Xuất', quantity: x.quantity, before: x.before, after: x.after, note: x.note }))
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  document.getElementById('nxtDetailTable').innerHTML = details.map(x => `
    <tr>
      <td>${escapeHtml(x.date || '')}</td>
      <td><strong>${escapeHtml(x.code || '')}</strong></td>
      <td><span class="badge" style="background:${x.type === 'Nhập' ? '#e8f4fd' : '#fde8e8'};color:${x.type === 'Nhập' ? '#1e5f8a' : '#8a1e1e'}">${x.type}</span></td>
      <td><strong>${x.quantity || 0}</strong></td>
      <td>${x.before ?? '—'}</td>
      <td>${x.after ?? '—'}</td>
      <td>${escapeHtml(x.note || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="7">Không có giao dịch nhập/xuất của sản phẩm này trong khoảng thời gian đã chọn.</td></tr>';
}


function orderDay(o) {
  if (o.createdAt) return o.createdAt.slice(0, 10);
  const m = String(o.date || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

function renderOrders() {
  const k = (document.getElementById('orderSearch')?.value || '').toLowerCase().trim();
  const status = document.getElementById('orderStatusFilter')?.value || '';
  const from = document.getElementById('orderDateFrom')?.value || '';
  const to = document.getElementById('orderDateTo')?.value || '';
  const states = ['Mới đặt', 'Đã xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];

  document.getElementById('orderTable').innerHTML = orders.filter(o =>
    (String(o.id).includes(k) || String(o.customerName || '').toLowerCase().includes(k)) &&
    (!status || o.status === status) &&
    (!from || orderDay(o) >= from) &&
    (!to || orderDay(o) <= to)
  ).map(o => `<tr>
    <td><strong>#${o.id}</strong></td>
    <td>${escapeHtml(o.customerName || 'Khách hàng')}</td>
    <td>${escapeHtml(o.date || '')}</td>
    <td><strong style="color:#b25838">${money(o.total)}</strong></td>
    <td><span class="badge">${escapeHtml(o.status)}</span></td>
    <td>
      <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:4px 8px;font-size:12px">
        ${states.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </td>
    <td><button class="btn-light" type="button" onclick="showOrderDetail(${o.id})">Chi tiết</button></td>
  </tr>`).join('') || '<tr><td colspan="7">Chưa có đơn hàng phù hợp.</td></tr>';
}

function showOrderDetail(id) {
  const o = orders.find(x => String(x.id) === String(id));
  if (!o) return;

  const title = document.getElementById('adminOrderDetailTitle');
  if (title) title.textContent = `Đơn hàng #${o.id} — ${o.status || 'Mới đặt'}`;

  const c = document.getElementById('adminOrderDetailContent');
  if (!c) return;

  const states = ['Mới đặt', 'Đã xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];

  c.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px;font-size:13px;line-height:1.6">
      <div><strong>Khách hàng:</strong> ${escapeHtml(o.customerName || 'Khách hàng')}</div>
      <div><strong>Số điện thoại:</strong> ${escapeHtml(o.phone || 'Chưa có')}</div>
      <div><strong>Ngày đặt:</strong> ${escapeHtml(o.date || '')}</div>
      <div><strong>Hình thức thanh toán:</strong> ${escapeHtml(o.paymentMethod || 'COD')}</div>
      <div style="grid-column:1/-1"><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(o.address || 'Chưa có')}</div>
    </div>
    
    <h3 style="font-size:14px;margin:15px 0 8px">Danh sách sản phẩm đã đặt:</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
        <tbody>
          ${(o.items || []).map(i => `
            <tr>
              <td><strong>${escapeHtml(i.name)}</strong></td>
              <td>${money(i.price)}</td>
              <td>${i.quantity}</td>
              <td><strong>${money(i.price * i.quantity)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid #eee">
      <div>
        <label style="font-size:12px;font-weight:bold;margin-right:8px">Trạng thái:</label>
        <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:6px 10px;font-size:12px">
          ${states.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div style="font-size:16px">Tổng thanh toán: <strong style="color:#b25838">${money(o.total)}</strong></div>
    </div>
  `;

  document.getElementById('adminOrderModalOverlay').style.display = 'block';
  document.getElementById('adminOrderModal').style.display = 'block';
}

function closeAdminOrderDetail() {
  const o = document.getElementById('adminOrderModalOverlay');
  const m = document.getElementById('adminOrderModal');
  if (o) o.style.display = 'none';
  if (m) m.style.display = 'none';
}

function updateOrderStatus(id, status) {

  const order = orders.find(o => o.id === id);
  const prevStatus = order ? order.status : null;


  orders = orders.map(o => o.id === id ? { ...o, status } : o);


  if (status === 'Đã hủy' && prevStatus !== 'Đã hủy' && order && Array.isArray(order.items)) {
    order.items.forEach(item => {

      const prodId = item.id || item.productId;
      const prod = products.find(p => Number(p.id) === Number(prodId));
      if (prod) {
        prod.stock = Number(prod.stock) + Number(item.quantity);
      }
    });

    persistAll();
    renderAdminProducts();
    renderInventory();
  }


  if (prevStatus === 'Đã hủy' && status !== 'Đã hủy' && order && Array.isArray(order.items)) {
    order.items.forEach(item => {
      const prodId = item.id || item.productId;
      const prod = products.find(p => Number(p.id) === Number(prodId));
      if (prod) {
        const newStock = Number(prod.stock) - Number(item.quantity);
        prod.stock = newStock < 0 ? 0 : newStock;
      }
    });
    persistAll();
    renderAdminProducts();
    renderInventory();
  }


  persistAll();
  renderOrders();
  renderDashboard();
  showMessage(`Đã cập nhật trạng thái đơn #${id} thành "${status}".`);
  const title = document.getElementById('adminOrderDetailTitle');
  if (title && document.getElementById('adminOrderModal').style.display !== 'none') {
    title.textContent = `Đơn hàng #${id} — ${status}`;
  }
}


function renderCustomers() {
  const k = (document.getElementById('customerSearch')?.value || '').toLowerCase().trim();
  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(k) ||
    (c.email || '').toLowerCase().includes(k) ||
    (c.phone || '').includes(k)
  );

  document.getElementById('customerTable').innerHTML = filtered.map(c => {
    const b = blockedCustomers.includes(c.email);
    return `<tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.phone || '—')}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.address || '—')}</td>
      <td>
        <span class="badge" style="background:${b ? '#fee' : '#e8eee4'};color:${b ? '#a00' : '#42623a'}">${b ? 'Đã khóa' : 'Hoạt động'}</span>
      </td>
      <td>
        <button class="btn-light" onclick="toggleCustomer('${escapeHtml(c.email).replace(/'/g, "\\'")}')">${b ? 'Mở khóa' : 'Khóa'}</button>
        <button class="btn-light" onclick="resetCustomerPassword('${escapeHtml(c.email).replace(/'/g, "\\'")}')">Đặt lại MK</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6">Chưa có tài khoản khách hàng.</td></tr>';
}

function resetCustomerPassword(email) {
  const next = prompt('Nhập mật khẩu mới (ít nhất 6 ký tự):');
  if (next === null) return;
  if (next.length < 6) {
    alert('Mật khẩu cần ít nhất 6 ký tự.');
    return;
  }
  customers = customers.map(c => c.email === email ? { ...c, password: next } : c);
  persistAll();
  showMessage('Đã đặt lại mật khẩu demo cho ' + email + '.');
}

function toggleCustomer(email) {
  blockedCustomers = blockedCustomers.includes(email) ?
    blockedCustomers.filter(x => x !== email) :
    [...blockedCustomers, email];
  localStorage.setItem('novaBlockedCustomers', JSON.stringify(blockedCustomers));
  renderCustomers();
  showMessage('Đã cập nhật trạng thái khóa tài khoản.');
}


function exportInventoryExcel() {
  const rows = products.map(p => ({
    'Mã sản phẩm': p.code,
    'Tên sản phẩm': p.name,
    'Loại sản phẩm': p.category,
    'Size': p.size,
    'Giá nhập (VNĐ)': Number(p.cost || 0),
    'Giá bán (VNĐ)': Number(p.price || 0),
    'Số lượng tồn': Number(p.stock || 0),
    'Giá trị tồn kho (VNĐ)': Number(p.cost || 0) * Number(p.stock || 0),
    'Trạng thái': p.stock <= 0 ? 'Hết hàng' : p.stock < 10 ? 'Sắp hết hàng' : 'Còn hàng'
  }));

  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Ton kho');
    XLSX.writeFile(wb, 'NOVA_BaoCao_TonKho_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    showMessage('Đã xuất báo cáo tồn kho Excel.');
  } else {
    const csv = '\ufeff' + [Object.keys(rows[0] || { 'Thông báo': 'Không có sản phẩm' }).join(','), ...rows.map(r => Object.values(r).map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'NOVA_BaoCao_TonKho.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showMessage('Đã xuất file báo cáo CSV.');
  }
}

function exportMovementExcel(type) {
  const list = type === 'PN' ? imports : exportsStock;
  const rows = list.map(x => ({
    'Mã phiếu': x.code,
    'Ngày': x.date,
    'Sản phẩm': x.name,
    'Số lượng': x.quantity,
    'Tồn trước': x.before,
    'Tồn sau': x.after,
    'Giá nhập': x.cost || '',
    'Ghi chú': x.note || ''
  }));

  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), type === 'PN' ? 'Phieu nhap' : 'Phieu xuat');
    XLSX.writeFile(wb, `NOVA_${type === 'PN' ? 'PhieuNhap' : 'PhieuXuat'}.xlsx`);
  } else {
    alert('Thư viện Excel chưa sẵn sàng. Bạn có thể kiểm tra kết nối mạng hoặc thử lại.');
  }
}

function logoutAdmin(event) {
  event.preventDefault();
  sessionStorage.removeItem('novaAdminLoggedIn');
  sessionStorage.removeItem('novaAdminUsername');
  window.location.href = 'loginadmin.html';
}

document.getElementById('today').textContent = new Date().toLocaleDateString('vi-VN');

if (!localStorage.getItem('novaProducts')) {
  localStorage.setItem('novaProducts', JSON.stringify(products));
}

renderDashboard();
renderAdminProducts();
renderCategories();

const $ = id => document.getElementById(id);

const storageKeys = ['sales', 'contracts', 'quotes', 'reports', 'payments', 'users'];
const db = Object.fromEntries(
  storageKeys.map(key => [key, JSON.parse(localStorage.getItem(key) || '[]')])
);

const salesStatuses = ['طلب عرض سعر جديد', 'تحت التنفيذ', 'تم إرسال عرض السعر', 'تم التعميد', 'تم الإنجاز', 'لم يتم التعميد - أرشيف'];
const contractStatuses = ['نشط', 'تحت التنفيذ', 'تمت الزيارة', 'يحتاج عرض سعر', 'تم الإنجاز', 'ينتهي قريباً', 'منتهي', 'أرشيف'];
const quoteStatuses = ['تم تحرير عرض سعر', 'تم إرسال العرض', 'تحت التنفيذ', 'تم التعميد', 'لم يتم التعميد - الأرشيف', 'تم عمل الصيانة', 'تم الإنجاز'];
const paymentStatuses = ['لم يتم السداد', 'في الانتظار', 'تم الاستلام', 'تم السداد', 'متأخر'];
const userStatuses = ['نشط', 'موقوف'];

function save() {
  storageKeys.forEach(key => localStorage.setItem(key, JSON.stringify(db[key])));
  render();
}

function seed() {
  if (!db.sales.length && !localStorage.getItem('ernoteSeeded')) {
    db.sales = [
      { client: 'عميل ABC', phone: '0500000000', service: 'عقد صيانة سلامة', value: 12000, status: 'طلب عرض سعر جديد', follow: 'اليوم' },
      { client: 'عميل XYZ', phone: '0550000000', service: 'صيانة طارئة', value: 3200, status: 'تم إرسال عرض السعر', follow: 'تذكير بعد 3 أيام' }
    ];
    db.contracts = [
      { client: 'فندق تجريبي', start: '2026-05-01', end: '2027-05-01', value: 120000, visits: 12, status: 'نشط' },
      { client: 'مجمع تجاري', start: '2026-05-01', end: '2026-05-20', value: 80000, visits: 4, status: 'ينتهي قريباً' }
    ];
    db.quotes = [
      { client: 'عميل ABC', type: 'صيانة مضخة حريق', value: 4500, status: 'تم تحرير عرض سعر', reminder: 'كل 3 أيام' },
      { client: 'عميل XYZ', type: 'استبدال كواشف', value: 6200, status: 'تم التعميد', reminder: 'تم عمل الصيانة' }
    ];
    db.reports = [{ client: 'فندق تجريبي', engineer: 'المهندس أحمد', date: '2026-05-08', excel: 'Excel Sheet', pdf: 'PDF Report', notes: 'تم رفع التقرير' }];
    db.payments = [
      { client: 'فندق تجريبي', payment: 'الأولى', amount: 25000, status: 'تم الاستلام', due: '2026-05-10' },
      { client: 'فندق تجريبي', payment: 'الثانية', amount: 25000, status: 'لم يتم السداد', due: '2026-11-10' }
    ];
    db.users = [
      { name: 'المدير العام', role: 'مدير', permissions: 'كل الصلاحيات', status: 'نشط' },
      { name: 'مهندس صيانة', role: 'مهندس', permissions: 'العقود والتقارير', status: 'نشط' },
      { name: 'فني', role: 'فني', permissions: 'المهام والتقارير', status: 'نشط' },
      { name: 'محاسب', role: 'محاسب', permissions: 'المحاسبة والدفعات', status: 'نشط' }
    ];
    localStorage.setItem('ernoteSeeded', 'yes');
    save();
  }
}

function money(n) {
  return Number(n || 0).toLocaleString('ar-SA') + ' ر.س';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function expiring() {
  return db.contracts.filter(c => {
    const d = Math.ceil((new Date(c.end) - new Date()) / 86400000);
    return d >= 0 && d <= 15;
  }).length;
}

function setPage(id) {
  const page = $(id);
  if (!page) return;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-link').forEach(b => b.classList.remove('active'));
  page.classList.add('active');
  document.querySelector(`[data-target="${id}"]`)?.classList.add('active');
}

document.querySelectorAll('.side-link').forEach(b => b.onclick = () => setPage(b.dataset.target));
document.querySelectorAll('[data-open]').forEach(x => x.onclick = () => setPage(x.dataset.open));

function table(id, arr, fn) {
  $(id).innerHTML = arr.map(fn).join('');
}

function optionList(options, selected) {
  return options.map(s => `<option ${selected === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');
}

function del(collection, index) {
  if (confirm('هل تريد حذف هذا السجل؟')) {
    db[collection].splice(index, 1);
    save();
  }
}
window.del = del;
window.db = db;
window.save = save;

function render() {
  const salesAwarded = db.sales.filter(x => x.status.includes('تعميد')).length;
  const salesArchived = db.sales.filter(x => x.status.includes('أرشيف')).length;
  const quoteAwardedOrArchived = db.quotes.filter(x => x.status.includes('تعميد') || x.status.includes('أرشيف')).length;

  $('newQuotation').textContent = db.sales.filter(x => x.status === 'طلب عرض سعر جديد').length;
  $('inProgress').textContent = db.sales.filter(x => x.status === 'تحت التنفيذ').length;
  $('quotationSent').textContent = db.sales.filter(x => x.status === 'تم إرسال عرض السعر').length;
  $('salesAwarded').textContent = salesAwarded + salesArchived;

  $('totalContracts').textContent = db.contracts.length;
  $('contractsCount').textContent = db.contracts.length;
  $('monthlyVisits').textContent = db.contracts.reduce((sum, c) => sum + (Number(c.visits || 0) >= 12 ? 1 : 0), 0);
  $('visitedCount').textContent = db.contracts.filter(x => x.status === 'تمت الزيارة' || x.status === 'تم الإنجاز').length;
  $('needsQuote').textContent = db.contracts.filter(x => x.status === 'يحتاج عرض سعر').length;
  $('totalValue').textContent = money(db.contracts.reduce((a, b) => a + Number(b.value || 0), 0));
  $('expiringContracts').textContent = expiring();

  $('quotePrepared').textContent = db.quotes.filter(x => x.status === 'تم تحرير عرض سعر').length;
  $('awardedArchived').textContent = quoteAwardedOrArchived;
  $('awardedActive').textContent = db.quotes.filter(x => x.status === 'تم التعميد').length;
  $('maintenanceDone').textContent = db.quotes.filter(x => x.status === 'تم عمل الصيانة' || x.status === 'تم الإنجاز').length;

  table('salesTable', db.sales, (x, i) => `
    <tr>
      <td>${escapeHtml(x.client)}</td>
      <td>${escapeHtml(x.phone)}</td>
      <td>${escapeHtml(x.service)}</td>
      <td>${money(x.value)}</td>
      <td><select onchange="db.sales[${i}].status=this.value;save()">${optionList(salesStatuses, x.status)}</select></td>
      <td>${escapeHtml(x.follow)}</td>
      <td><button class="delete-btn" onclick="del('sales',${i})">حذف</button></td>
    </tr>`);

  table('contractsTable', db.contracts, (x, i) => `
    <tr>
      <td>${escapeHtml(x.client)}</td>
      <td>${escapeHtml(x.start)}</td>
      <td>${escapeHtml(x.end)}</td>
      <td>${money(x.value)}</td>
      <td>${escapeHtml(x.visits)}</td>
      <td><select onchange="db.contracts[${i}].status=this.value;save()">${optionList(contractStatuses, x.status)}</select></td>
      <td><button class="delete-btn" onclick="del('contracts',${i})">حذف</button></td>
    </tr>`);

  table('quotesTable', db.quotes, (x, i) => `
    <tr>
      <td>${escapeHtml(x.client)}</td>
      <td>${escapeHtml(x.type)}</td>
      <td>${money(x.value)}</td>
      <td><select onchange="db.quotes[${i}].status=this.value;save()">${optionList(quoteStatuses, x.status)}</select></td>
      <td>${escapeHtml(x.reminder)}</td>
      <td><button class="delete-btn" onclick="del('quotes',${i})">حذف</button></td>
    </tr>`);

  table('reportsTable', db.reports, (x, i) => `
    <tr>
      <td>${escapeHtml(x.client)}</td>
      <td>${escapeHtml(x.engineer)}</td>
      <td>${escapeHtml(x.date)}</td>
      <td>${escapeHtml(x.excel)}</td>
      <td>${escapeHtml(x.pdf)}</td>
      <td>${escapeHtml(x.notes)}</td>
      <td><button class="delete-btn" onclick="del('reports',${i})">حذف</button></td>
    </tr>`);

  table('paymentsTable', db.payments, (x, i) => `
    <tr>
      <td>${escapeHtml(x.client)}</td>
      <td>${escapeHtml(x.payment)}</td>
      <td>${money(x.amount)}</td>
      <td><select onchange="db.payments[${i}].status=this.value;save()">${optionList(paymentStatuses, x.status)}</select></td>
      <td>${escapeHtml(x.due)}</td>
      <td><button class="delete-btn" onclick="del('payments',${i})">حذف</button></td>
    </tr>`);

  table('usersTable', db.users, (x, i) => `
    <tr>
      <td>${escapeHtml(x.name)}</td>
      <td>${escapeHtml(x.role)}</td>
      <td>${escapeHtml(x.permissions)}</td>
      <td><select onchange="db.users[${i}].status=this.value;save()">${optionList(userStatuses, x.status)}</select></td>
      <td><button class="delete-btn" onclick="del('users',${i})">حذف</button></td>
    </tr>`);
}

function tick() {
  const now = new Date();
  $('time').textContent = now.toLocaleTimeString('en-US');
  $('date').textContent = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' | ' + now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(tick, 1000);
tick();

function openModal(title, fields, onSave) {
  $('modalTitle').textContent = title;
  $('modalFields').innerHTML = fields.map(f => `<div class="field"><label>${f[1]}</label><input name="${f[0]}" type="${f[2] || 'text'}" required></div>`).join('');
  $('modal').showModal();
  $('saveModal').onclick = e => {
    e.preventDefault();
    onSave(Object.fromEntries(new FormData($('modalForm')).entries()));
    $('modalForm').reset();
    $('modal').close();
    save();
  };
}

$('addSalesBtn').onclick = () => openModal('إضافة عميل مبيعات', [['client', 'العميل'], ['phone', 'الجوال'], ['service', 'الخدمة'], ['value', 'القيمة', 'number'], ['follow', 'آخر متابعة']], d => { d.status = 'طلب عرض سعر جديد'; db.sales.push(d); });
$('addContractBtn').onclick = () => openModal('إضافة عقد', [['client', 'العميل'], ['start', 'البداية', 'date'], ['end', 'النهاية', 'date'], ['value', 'القيمة', 'number'], ['visits', 'عدد الزيارات', 'number']], d => { d.status = 'نشط'; db.contracts.push(d); });
$('addQuoteBtn').onclick = () => openModal('إضافة عرض صيانة', [['client', 'العميل'], ['type', 'نوع الصيانة'], ['value', 'القيمة', 'number'], ['reminder', 'التذكير']], d => { d.status = 'تم تحرير عرض سعر'; db.quotes.push(d); });
$('addReportBtn').onclick = () => openModal('إضافة تقرير فني', [['client', 'العميل'], ['engineer', 'المهندس/الفني'], ['date', 'التاريخ', 'date'], ['excel', 'رابط Excel'], ['pdf', 'رابط PDF'], ['notes', 'ملاحظات']], d => db.reports.push(d));
$('addPaymentBtn').onclick = () => openModal('إضافة دفعة', [['client', 'العميل'], ['payment', 'رقم الدفعة'], ['amount', 'قيمة الدفعة', 'number'], ['due', 'تاريخ الاستحقاق', 'date']], d => { d.status = 'لم يتم السداد'; db.payments.push(d); });
$('addUserBtn').onclick = () => openModal('إضافة مستخدم', [['name', 'الاسم'], ['role', 'الدور'], ['permissions', 'الصلاحيات']], d => { d.status = 'نشط'; db.users.push(d); });

seed();
render();

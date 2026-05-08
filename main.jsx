
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell, Search, Plus, LayoutDashboard, ClipboardList, Users, Target,
  Archive, Wrench, ShieldCheck, UserPlus, RotateCcw, Download,
  CheckCircle2, Settings, LockKeyhole, UserRound
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "ernote_erada_react_v1";

const seed = {
  visual: "soft",
  activeUserId: 1,
  users: [
    { id: 1, name: "عثمان المدير", role: "manager", phone: "0542800242" },
    { id: 2, name: "م. أحمد", role: "engineer", phone: "05xxxxxxxx", target: 30 },
    { id: 3, name: "م. خالد", role: "engineer", phone: "05xxxxxxxx", target: 30 },
    { id: 4, name: "فندق المدينة فيو", role: "customer", phone: "05xxxxxxxx", customer: "فندق المدينة فيو" }
  ],
  customers: [
    { id: 101, company: "فندق المدينة فيو", contact: "أبو عبدالله", phone: "05xxxxxxxx", location: "المدينة المنورة", status: "عميل نشط", value: 48000, nextAction: "زيارة وقائية" },
    { id: 102, company: "مجمع النخبة التجاري", contact: "أ. ماجد", phone: "05xxxxxxxx", location: "جدة", status: "عرض سعر مرسل", value: 18000, nextAction: "متابعة تعميد" },
    { id: 103, company: "مصنع الخليج", contact: "أ. تركي", phone: "05xxxxxxxx", location: "الرياض", status: "عميل جديد", value: 0, nextAction: "تحديد موعد كشف" }
  ],
  orders: [
    { id: 9001, type: "أمر صيانة", title: "فحص لوحة إنذار الحريق", customer: "فندق المدينة فيو", phone: "05xxxxxxxx", location: "المدينة المنورة", engineer: "م. أحمد", priority: "عاجل", status: "جديد", date: "2026-05-08", notes: "مطلوب فحص أعطال النظام وإرسال تقرير مختصر." },
    { id: 9002, type: "أمر صيانة", title: "زيارة صيانة شهرية", customer: "مجمع النخبة التجاري", phone: "05xxxxxxxx", location: "جدة", engineer: "م. خالد", priority: "متوسط", status: "تحت التنفيذ", date: "2026-05-08", notes: "زيارة وقائية لأنظمة السلامة ومتابعة الملاحظات." },
    { id: 9003, type: "عرض سعر", title: "تسعير أعمال صيانة إضافية", customer: "مصنع الخليج", phone: "05xxxxxxxx", location: "الرياض", engineer: "م. أحمد", priority: "منخفض", status: "تم التنفيذ", date: "2026-05-07", notes: "تم تجهيز الملاحظات المطلوبة للعرض." }
  ]
};

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed;
  } catch {
    return seed;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clsStatus(status) {
  if (status === "جديد") return "open";
  if (status === "تحت التنفيذ") return "doing";
  if (status === "تم التنفيذ") return "done";
  if (status === "عميل جديد") return "new";
  if (status === "عرض سعر مرسل") return "quote";
  return "active";
}

function roleLabel(role) {
  if (role === "manager") return "مدير";
  if (role === "engineer") return "مهندس";
  return "عميل";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(null);

  const activeUser = data.users.find((u) => u.id === Number(data.activeUserId)) || data.users[0];
  const isAdmin = activeUser.role === "manager";
  const isEngineer = activeUser.role === "engineer";
  const isCustomer = activeUser.role === "customer";

  useEffect(() => {
    saveData(data);
  }, [data]);

  function updateData(next) {
    setData((old) => {
      const resolved = typeof next === "function" ? next(old) : next;
      return resolved;
    });
  }

  function filteredByRole(orders) {
    if (activeUser.role === "engineer") return orders.filter((o) => o.engineer === activeUser.name);
    if (activeUser.role === "customer") return orders.filter((o) => o.customer === activeUser.customer || o.customer === activeUser.name);
    return orders;
  }

  const roleOrders = filteredByRole(data.orders);

  const stats = useMemo(() => ({
    newer: roleOrders.filter((o) => o.status === "جديد").length,
    doing: roleOrders.filter((o) => o.status === "تحت التنفيذ").length,
    done: roleOrders.filter((o) => o.status === "تم التنفيذ").length,
    customers: data.customers.length,
    users: data.users.length,
    archive: data.orders.filter((o) => o.status === "تم التنفيذ" || o.type === "عرض سعر").length + data.customers.length
  }), [data, activeUser]);

  const filteredOrders = roleOrders.filter((o) =>
    `${o.title} ${o.customer} ${o.phone} ${o.location} ${o.engineer} ${o.status} ${o.type} ${o.notes}`.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCustomers = data.customers.filter((c) =>
    `${c.company} ${c.contact} ${c.phone} ${c.location} ${c.status}`.toLowerCase().includes(query.toLowerCase())
  );

  function go(nextView) {
    if (nextView === "kpi" && !isAdmin) nextView = "dashboard";
    if (nextView === "archive" && !isAdmin) nextView = "dashboard";
    if (nextView === "users" && !isAdmin) nextView = "dashboard";
    if (nextView === "crm" && isEngineer) nextView = "orders";
    setView(nextView);
  }

  function setOrderStatus(id, status) {
    updateData((old) => ({
      ...old,
      orders: old.orders.map((o) => o.id === id ? { ...o, status } : o)
    }));
  }

  function addOrder(form) {
    updateData((old) => ({
      ...old,
      orders: [{
        id: Math.floor(1000 + Math.random() * 9000),
        type: form.type,
        title: form.title,
        customer: form.customer,
        phone: form.phone,
        location: form.location,
        engineer: form.engineer,
        priority: form.priority,
        status: form.status,
        date: today(),
        notes: form.notes || "لا توجد ملاحظات."
      }, ...old.orders]
    }));
    setSheet(null);
    setView("orders");
  }

  function addCustomer(form) {
    updateData((old) => ({
      ...old,
      customers: [{
        id: Math.floor(100 + Math.random() * 900),
        company: form.company,
        contact: form.contact || "غير محدد",
        phone: form.phone,
        location: form.location || "غير محدد",
        status: form.status,
        value: Number(form.value || 0),
        nextAction: "متابعة أولى"
      }, ...old.customers]
    }));
    setSheet(null);
    setView("crm");
  }

  function addUser(form) {
    updateData((old) => ({
      ...old,
      users: [...old.users, {
        id: Date.now(),
        name: form.name,
        role: form.role,
        phone: form.phone,
        customer: form.role === "customer" ? (form.customer || form.name) : undefined,
        target: form.role === "engineer" ? 30 : undefined
      }]
    }));
    setSheet(null);
    setView("users");
  }

  function addServiceRequest(form) {
    updateData((old) => {
      const exists = old.customers.find((c) => c.company === form.customer);
      return {
        ...old,
        orders: [{
          id: Math.floor(1000 + Math.random() * 9000),
          type: form.type === "طلب عرض سعر" ? "عرض سعر" : "أمر صيانة",
          title: "طلب جديد - " + form.type,
          customer: form.customer,
          phone: form.phone,
          location: form.location,
          engineer: "غير مسند",
          priority: "متوسط",
          status: "جديد",
          date: today(),
          notes: form.notes || "طلب صيانة من العميل."
        }, ...old.orders],
        customers: exists ? old.customers : [{
          id: Math.floor(100 + Math.random() * 900),
          company: form.customer,
          contact: "غير محدد",
          phone: form.phone,
          location: form.location,
          status: "عميل جديد",
          value: 0,
          nextAction: "مراجعة طلب جديد"
        }, ...old.customers]
      };
    });
    setSheet(null);
    setView("dashboard");
  }

  function resetDemo() {
    if (confirm("هل تريد حذف بيانات التجربة والرجوع للبيانات الافتراضية؟")) {
      localStorage.removeItem(STORAGE_KEY);
      setData(seed);
      setView("dashboard");
    }
  }

  function exportArchive() {
    const rows = [["القسم", "التاريخ", "العميل", "الجوال", "الموقع", "نوع العمل", "المهندس", "الحالة", "ملاحظات"]];
    data.customers.forEach((c) => rows.push(["عميل CRM", "-", c.company, c.phone, c.location, c.status, "-", c.status, `المسؤول: ${c.contact} | القيمة: ${c.value || 0}`]));
    data.orders
      .filter((o) => o.status === "تم التنفيذ" || o.type === "عرض سعر")
      .forEach((o) => rows.push([o.type === "عرض سعر" ? "عرض سعر" : "عملية منتهية", o.date, o.customer, o.phone, o.location, o.type || "أمر صيانة", o.engineer, o.status, o.notes]));
    const csv = rows.map((r) => r.map((x) => `"${String(x || "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ERNOTE_ERADA_ARCHIVE.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const hero = activeUser.role === "manager"
    ? ["👑", "لوحة المدير الرئيسية", "ERNOTE BY ERADA PLUS CO.LLC"]
    : activeUser.role === "engineer"
      ? ["👷", "داشبورد المهندس", "يرى الطلبات المسندة له فقط"]
      : ["🏢", "داشبورد العميل", "يرى طلباته وحالتها فقط"];

  return (
    <div className={`app visual-${data.visual || "soft"}`}>
      <header className="top">
        <div className="brand">
          <button className="notify"><Bell size={20} /> {(stats.newer + stats.doing) > 0 && <span className="dot" />}</button>
          <div className="brandText">
            <small>BY ERADA PLUS CO.LLC</small>
            <h1>ERNOTE</h1>
          </div>
          <div className="logoBox"><img src="/erada-logo.png" alt="ERADA PLUS" /></div>
        </div>

        <div className="loginRow">
          <select value={data.activeUserId} onChange={(e) => updateData((old) => ({ ...old, activeUserId: Number(e.target.value) }))}>
            {data.users.map((u) => <option key={u.id} value={u.id}>{roleLabel(u.role)} - {u.name}</option>)}
          </select>
          <button className="btn secondary" onClick={() => isAdmin ? setSheet("user") : alert("هذه الصلاحية للمدير فقط")}>+ مستخدم</button>
        </div>

        <div className="themeRow">
          <select value={data.visual || "soft"} onChange={(e) => updateData((old) => ({ ...old, visual: e.target.value }))}>
            <option value="soft">أزرق هادئ</option>
            <option value="clean">أبيض وأزرق صافي</option>
            <option value="deep">أزرق ملكي</option>
          </select>
          <button className="btn secondary" onClick={resetDemo}><RotateCcw size={15} /> إعادة التجربة</button>
        </div>

        <div className="search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث عن أمر أو عميل أو مهندس أو رقم جوال..." /></div>
      </header>

      <main className="content">
        {view === "dashboard" && (
          <section>
            <div className="hero">
              <img className="brandLogoWide" src="/erada-logo.png" alt="ERADA PLUS" />
              <div className="heroRow">
                <div className="badgeIcon">{hero[0]}</div>
                <div><p>{hero[1]}</p><h2>{hero[2]}</h2></div>
              </div>
              <div className="miniGrid">
                <div className="mini"><b>{stats.newer}</b><span>طلب جديد</span></div>
                <div className="mini"><b>{stats.doing}</b><span>تحت التنفيذ</span></div>
                <div className="mini"><b>{stats.done}</b><span>تم التنفيذ</span></div>
              </div>
            </div>

            <div className="stats">
              <StatTile danger icon="🚨" label="طلبات جديدة واضحة" value={stats.newer} onClick={() => go("orders")} />
              <StatTile icon="⚙️" label="تحت التنفيذ" value={stats.doing} onClick={() => go("orders")} />
              <StatTile icon="✅" label="تم التنفيذ" value={stats.done} onClick={() => go("orders")} />
              {isAdmin && <StatTile icon="👥" label="عملاء CRM" value={stats.customers} onClick={() => go("crm")} />}
              {isAdmin && <StatTile icon="🗂️" label="الأرشيف الكامل" value={stats.archive} onClick={() => go("archive")} />}
              {isAdmin && <StatTile icon="🔐" label="المستخدمين" value={stats.users} onClick={() => go("users")} />}
            </div>

            {isAdmin && (
              <div className="card">
                <div className="sectionTitle"><button className="btn red" onClick={() => setSheet("order")}>+ طلب جديد</button><h3>آخر الأوامر</h3></div>
                <div className="list">{data.orders.slice(0, 3).map((o) => <OrderCard key={o.id} order={o} canUpdate={isAdmin} setOrderStatus={setOrderStatus} />)}</div>
              </div>
            )}

            {isEngineer && (
              <div className="card">
                <div className="sectionTitle"><h3>مهامي كمهندس</h3></div>
                <div className="list">{roleOrders.filter((o) => o.status !== "تم التنفيذ").map((o) => <OrderCard key={o.id} order={o} canUpdate setOrderStatus={setOrderStatus} />)}</div>
              </div>
            )}

            {isCustomer && (
              <div className="card">
                <div className="sectionTitle"><button className="btn red" onClick={() => setSheet("service")}>+ طلب صيانة جديد</button><h3>بوابة العميل</h3></div>
                <div className="infoGrid">
                  <div className="infoBox">طلبات مفتوحة<b>{roleOrders.filter((o) => o.status !== "تم التنفيذ").length}</b></div>
                  <div className="infoBox">طلبات مكتملة<b>{roleOrders.filter((o) => o.status === "تم التنفيذ").length}</b></div>
                  <div className="infoBox">آخر حالة<b>{roleOrders[0]?.status || "-"}</b></div>
                  <div className="infoBox">الصلاحية<b>عميل</b></div>
                </div>
              </div>
            )}
          </section>
        )}

        {view === "orders" && (
          <section>
            <div className="sectionTitle">{isAdmin && <button className="btn red" onClick={() => setSheet("order")}>+ طلب جديد</button>}<h2>أوامر العمل</h2></div>
            <div className="list">{filteredOrders.length ? filteredOrders.map((o) => <OrderCard key={o.id} order={o} canUpdate={isAdmin || isEngineer} setOrderStatus={setOrderStatus} />) : <Empty />}</div>
          </section>
        )}

        {view === "crm" && (
          <section>
            <div className="sectionTitle">{isAdmin && <button className="btn" onClick={() => setSheet("customer")}>+ عميل</button>}<h2>CRM العملاء</h2></div>
            <div className="list">{filteredCustomers.length ? filteredCustomers.map((c) => <CustomerCard key={c.id} customer={c} orders={data.orders} />) : <Empty />}</div>
          </section>
        )}

        {view === "kpi" && isAdmin && <KpiView users={data.users} orders={data.orders} />}
        {view === "users" && isAdmin && <UsersView users={data.users} />}
        {view === "archive" && isAdmin && <ArchiveView data={data} exportArchive={exportArchive} />}

        {view === "request" && (
          <section>
            <div className="sectionTitle"><h2>إنشاء طلب صيانة</h2></div>
            <FormCard type="service" onSubmit={addServiceRequest} />
          </section>
        )}
      </main>

      <nav className="nav">
        <NavBtn active={view === "dashboard"} icon={<LayoutDashboard size={18} />} label="الرئيسية" onClick={() => go("dashboard")} />
        <NavBtn active={view === "orders"} icon={<ClipboardList size={18} />} label="الأوامر" onClick={() => go("orders")} />
        {!isEngineer && <NavBtn active={view === "crm"} icon={<Users size={18} />} label="العملاء" onClick={() => go("crm")} />}
        {isAdmin && <NavBtn active={view === "kpi"} icon={<Target size={18} />} label="KPI" onClick={() => go("kpi")} />}
        {isAdmin && <NavBtn active={view === "archive"} icon={<Archive size={18} />} label="أرشيف" onClick={() => go("archive")} />}
        <NavBtn active={view === "request"} icon={<Wrench size={18} />} label="طلب" onClick={() => go("request")} />
      </nav>

      {sheet === "order" && <Sheet title="إنشاء طلب جديد للمهندس" onClose={() => setSheet(null)}><OrderForm engineers={data.users.filter((u) => u.role === "engineer")} onSubmit={addOrder} /></Sheet>}
      {sheet === "customer" && <Sheet title="إضافة عميل CRM" onClose={() => setSheet(null)}><CustomerForm onSubmit={addCustomer} /></Sheet>}
      {sheet === "user" && <Sheet title="إضافة مستخدم وصلاحية" onClose={() => setSheet(null)}><UserForm onSubmit={addUser} /></Sheet>}
      {sheet === "service" && <Sheet title="طلب صيانة جديد من العميل" onClose={() => setSheet(null)}><ServiceForm onSubmit={addServiceRequest} /></Sheet>}
    </div>
  );
}

function StatTile({ value, label, icon, onClick, danger }) {
  return <button className={`tile ${danger ? "newAlert" : ""}`} onClick={onClick}><div className="num">{value}</div><div className="label">{label}</div><div className="ico">{icon}</div></button>;
}

function NavBtn({ active, icon, label, onClick }) {
  return <button className={active ? "active" : ""} onClick={onClick}>{icon}<br />{label}</button>;
}

function Empty() {
  return <div className="empty">لا توجد نتائج</div>;
}

function OrderCard({ order, canUpdate, setOrderStatus }) {
  return (
    <div className={`item ${order.status === "جديد" ? "newItem" : ""}`}>
      <div className="itemHead">
        <span className={`pill ${clsStatus(order.status)}`}>{order.status}</span>
        <h3>{order.status === "جديد" ? "🚨 " : ""}{order.title}</h3>
      </div>
      <p>
        رقم: #{order.id} · {order.date}<br />
        النوع: {order.type || "أمر صيانة"}<br />
        العميل: {order.customer}<br />
        جوال العميل: {order.phone || "-"}<br />
        الموقع: {order.location || "-"}<br />
        المهندس: {order.engineer}<br />
        الأولوية: {order.priority}<br />
        {order.notes || ""}
      </p>
      {canUpdate && (
        <div className="itemActions">
          {order.status === "جديد" && <button className="btn blue" onClick={() => setOrderStatus(order.id, "تحت التنفيذ")}>تحت التنفيذ</button>}
          {order.status !== "تم التنفيذ" ? <button className="btn green" onClick={() => setOrderStatus(order.id, "تم التنفيذ")}>تم التنفيذ</button> : <button className="btn secondary" disabled>مؤرشف</button>}
        </div>
      )}
    </div>
  );
}

function CustomerCard({ customer, orders }) {
  const related = orders.filter((o) => o.customer === customer.company);
  return (
    <div className="item">
      <div className="itemHead"><span className={`pill ${clsStatus(customer.status)}`}>{customer.status}</span><h3>{customer.company}</h3></div>
      <p>
        المسؤول: {customer.contact}<br />
        الجوال: {customer.phone}<br />
        الموقع: {customer.location}<br />
        الإجراء التالي: {customer.nextAction || "متابعة"}<br />
        القيمة المتوقعة: {Number(customer.value || 0).toLocaleString()} ريال
      </p>
      <div className="infoGrid">
        <div className="infoBox">عمليات العميل<b>{related.length}</b></div>
        <div className="infoBox">المنتهي<b>{related.filter((o) => o.status === "تم التنفيذ").length}</b></div>
      </div>
    </div>
  );
}

function KpiView({ users, orders }) {
  return (
    <section>
      <div className="sectionTitle"><h2>KPI الموظفين</h2></div>
      <div className="list">
        {users.filter((u) => u.role === "engineer").map((e) => {
          const assigned = orders.filter((o) => o.engineer === e.name);
          const open = assigned.filter((o) => o.status !== "تم التنفيذ").length;
          const closed = assigned.filter((o) => o.status === "تم التنفيذ").length;
          const target = e.target || 30;
          const p = Math.min(100, Math.round((closed / target) * 100));
          return (
            <div className="item" key={e.id}>
              <div className="itemHead"><span className="pill done">{p}% إنجاز</span><h3>{e.name}</h3></div>
              <p>جوال: {e.phone || "-"}<br />الصلاحية: مهندس يرى طلباته فقط</p>
              <div className="miniGrid">
                <div className="mini"><b>{target}</b><span>التارقت</span></div>
                <div className="mini"><b>{closed}</b><span>منجز</span></div>
                <div className="mini"><b>{open}</b><span>مفتوح</span></div>
              </div>
              <div className="kpiBar"><div className="kpiFill" style={{ width: `${p}%` }} /></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UsersView({ users }) {
  return (
    <section>
      <div className="sectionTitle"><h2>المستخدمين والصلاحيات</h2></div>
      <div className="list">
        {users.map((u) => (
          <div className="item" key={u.id}>
            <div className="itemHead"><span className={`pill ${u.role === "manager" ? "quote" : u.role === "engineer" ? "doing" : "active"}`}>{roleLabel(u.role)}</span><h3>{u.name}</h3></div>
            <p>الجوال: {u.phone || "-"}<br />الصلاحية: {u.role === "manager" ? "يرى كل شيء ويضيف مستخدمين وأوامر" : u.role === "engineer" ? "يرى أوامره فقط ويغير الحالة" : `يرى طلبات ${u.customer || u.name} فقط`}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchiveView({ data, exportArchive }) {
  const rows = [];
  data.customers.forEach((c) => rows.push({ kind: "عميل CRM", date: "-", customer: c.company, phone: c.phone, location: c.location, type: c.status, engineer: "-", status: c.status, notes: `المسؤول: ${c.contact} | القيمة: ${c.value || 0}` }));
  data.orders.filter((o) => o.status === "تم التنفيذ" || o.type === "عرض سعر").forEach((o) => rows.push({ kind: o.type === "عرض سعر" ? "عرض سعر" : "عملية منتهية", date: o.date, customer: o.customer, phone: o.phone, location: o.location, type: o.type || "أمر صيانة", engineer: o.engineer, status: o.status, notes: o.notes }));

  return (
    <section>
      <div className="sectionTitle"><button className="btn secondary" onClick={exportArchive}><Download size={15} /> تصدير CSV</button><h2>الأرشيف</h2></div>
      <div className="card">
        <p className="muted">الأرشيف يعرض كل العمليات المنتهية وكل عروض الأسعار والعملاء وبيانات أعمالهم كجدول قريب من Excel.</p>
        <div className="tableWrap">
          <table className="archiveTable">
            <thead><tr><th>القسم</th><th>التاريخ</th><th>العميل</th><th>الجوال</th><th>الموقع</th><th>نوع العمل</th><th>المهندس</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
            <tbody>{rows.map((r, idx) => <tr key={idx}><td>{r.kind}</td><td>{r.date}</td><td>{r.customer}</td><td>{r.phone || "-"}</td><td>{r.location || "-"}</td><td>{r.type}</td><td>{r.engineer}</td><td>{r.status}</td><td>{r.notes || "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Sheet({ title, children, onClose }) {
  return <div className="sheet show"><div className="sheetBox"><div className="sheetTop"><button className="x" onClick={onClose}>×</button><h2>{title}</h2></div>{children}</div></div>;
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

function SelectField({ label, value, onChange, options }) {
  return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}

function TextArea({ label, value, onChange, placeholder }) {
  return <label>{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

function OrderForm({ engineers, onSubmit }) {
  const [form, setForm] = useState({ title: "", customer: "", phone: "", location: "", engineer: engineers[0]?.name || "غير مسند", type: "أمر صيانة", priority: "متوسط", status: "جديد", notes: "" });
  return <div className="form">
    <Field label="عنوان الأمر" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="مثال: فحص لوحة إنذار الحريق" />
    <Field label="اسم العميل" value={form.customer} onChange={(v) => setForm({ ...form, customer: v })} placeholder="اسم المنشأة أو العميل" />
    <Field label="رقم جوال العميل" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" />
    <Field label="الموقع" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="المدينة / الحي / الموقع" />
    <SelectField label="المهندس المكلف" value={form.engineer} onChange={(v) => setForm({ ...form, engineer: v })} options={engineers.map((e) => e.name)} />
    <SelectField label="نوع العملية" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["أمر صيانة", "عرض سعر", "زيارة كشف", "متابعة عميل"]} />
    <SelectField label="الأولوية" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={["عاجل", "متوسط", "منخفض"]} />
    <SelectField label="حالة الأمر" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["جديد", "تحت التنفيذ", "تم التنفيذ"]} />
    <TextArea label="تعليمات للمهندس" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="اكتب الأمر اليومي المطلوب تنفيذه..." />
    <button className="btn red" onClick={() => form.title && form.customer ? onSubmit(form) : alert("اكتب عنوان الأمر واسم العميل")}>حفظ الطلب الجديد</button>
  </div>;
}

function CustomerForm({ onSubmit }) {
  const [form, setForm] = useState({ company: "", contact: "", phone: "", location: "", status: "عميل جديد", value: "" });
  return <div className="form">
    <Field label="اسم الشركة / العميل" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="اسم المنشأة" />
    <Field label="الشخص المسؤول" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="اسم المسؤول" />
    <Field label="رقم الجوال" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" />
    <Field label="الموقع" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="المدينة / الحي" />
    <SelectField label="حالة العميل" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["عميل جديد", "عرض سعر مرسل", "عميل نشط", "مؤرشف"]} />
    <Field label="القيمة المتوقعة" type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} placeholder="0" />
    <button className="btn" onClick={() => form.company && form.phone ? onSubmit(form) : alert("اكتب اسم العميل ورقم الجوال")}>حفظ العميل</button>
  </div>;
}

function UserForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", role: "engineer", phone: "", customer: "" });
  return <div className="form">
    <Field label="اسم المستخدم" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="مثال: م. محمد" />
    <SelectField label="الدور / الصلاحية" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={["engineer", "manager", "customer"]} />
    <Field label="رقم الجوال" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" />
    <Field label="اسم العميل المرتبط إذا كان الدور عميل" value={form.customer} onChange={(v) => setForm({ ...form, customer: v })} placeholder="مثال: فندق المدينة فيو" />
    <button className="btn" onClick={() => form.name ? onSubmit(form) : alert("اكتب اسم المستخدم")}>حفظ المستخدم</button>
  </div>;
}

function ServiceForm({ onSubmit }) {
  const [form, setForm] = useState({ customer: "", phone: "", location: "", type: "نظام إنذار حريق", notes: "" });
  return <div className="form">
    <Field label="اسم العميل / المنشأة" value={form.customer} onChange={(v) => setForm({ ...form, customer: v })} placeholder="مثال: فندق المدينة فيو" />
    <Field label="رقم الجوال" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" />
    <Field label="الموقع" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="المدينة / الحي" />
    <SelectField label="نوع المشكلة" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["نظام إنذار حريق", "مضخات حريق", "رشاشات حريق", "تكييف", "كهرباء", "طلب عرض سعر", "أخرى"]} />
    <TextArea label="وصف الطلب" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="اكتب المشكلة أو الخدمة المطلوبة..." />
    <button className="btn red" onClick={() => form.customer && form.phone ? onSubmit(form) : alert("اكتب اسم العميل ورقم الجوال")}>إرسال طلب جديد</button>
  </div>;
}

function FormCard({ type, onSubmit }) {
  return <div className="card"><ServiceForm onSubmit={onSubmit} /></div>;
}

createRoot(document.getElementById("root")).render(<App />);

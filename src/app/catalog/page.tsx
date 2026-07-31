"use client";

import { useState } from "react";
import Link from "next/link";
import { Product, GST_RATES } from "@/lib/types";
import { getProducts, saveProduct, deleteProduct } from "@/lib/storage";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const emptyProduct: Omit<Product, "id"> = { name: "", hsn: "", rate: 0, gstRate: 18 };

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>(() =>
    typeof window !== "undefined" ? getProducts() : []
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.hsn.includes(search)
  );

  function openAdd() {
    setEditingId(null);
    setForm(emptyProduct);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, hsn: product.hsn, rate: product.rate, gstRate: product.gstRate });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const product: Product = {
      id: editingId || makeId(),
      name: form.name.trim(),
      hsn: form.hsn.trim(),
      rate: form.rate,
      gstRate: form.gstRate,
    };
    saveProduct(product);
    setProducts(getProducts());
    setShowForm(false);
    setForm(emptyProduct);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    deleteProduct(id);
    setProducts(getProducts());
  }

  function updateForm<K extends keyof Omit<Product, "id">>(field: K, value: Omit<Product, "id">[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Product Catalog</h1>
          </div>
          <span className="text-xs text-slate-400">{products.length} items</span>
        </div>
        <div className="h-px bg-gradient-to-r from-indigo-500/40 via-indigo-400/20 to-transparent mb-6" />

        {showForm ? (
          /* ---- ADD/EDIT FORM ---- */
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-4 shadow-sm">
            <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">
              {editingId ? "Edit Product" : "New Product"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Basmati Rice"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">HSN</label>
                  <input
                    type="text"
                    placeholder="Code"
                    value={form.hsn}
                    onChange={(e) => updateForm("hsn", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">Rate</label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={form.rate || ""}
                    onChange={(e) => updateForm("rate", parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">GST%</label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => updateForm("gstRate", parseInt(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 min-h-[48px]"
              >
                {editingId ? "Update" : "Save"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyProduct); }}
                className="bg-slate-100 text-slate-600 py-3 px-4 rounded-xl font-semibold text-sm hover:bg-slate-200 active:scale-[0.98] transition-all duration-150 min-h-[48px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 bg-white shadow-sm focus:border-indigo-300 transition-colors duration-150 min-h-[48px]"
              />
            </div>

            {/* Add button */}
            <button
              onClick={openAdd}
              className="w-full bg-indigo-600 text-white py-3.5 px-5 rounded-xl font-semibold text-base hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.98] transition-all duration-150 mb-6 shadow-sm shadow-indigo-200 min-h-[52px]"
            >
              + Add Product
            </button>
          </>
        )}

        {/* Product list */}
        {!showForm && (
          filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">
                {search ? "No matches" : "No products yet"}
              </p>
              <p className="text-sm text-slate-400">
                {search ? "Try a different search" : "Add products to quickly insert them into bills"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {product.hsn && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            HSN {product.hsn}
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60">
                          {product.gstRate}% GST
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-bold text-slate-900">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(product.rate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex-1 text-sm font-medium py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors duration-150 min-h-[40px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-sm font-medium py-2 px-3 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-colors duration-150 min-h-[40px] border border-red-200/60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

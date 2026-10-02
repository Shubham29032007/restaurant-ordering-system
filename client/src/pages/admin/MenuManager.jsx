import { useState, useEffect } from 'react';

const CATEGORIES = ['All', 'Appetizers', 'Mains', 'Breads', 'Desserts', 'Beverages'];

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    category: 'Mains',
    description: '',
    basePrice: '',
    isVeg: true,
    available: true,
    avgPrepMinutes: 15,
    imageUrl: '',
    variants: [],
    addOns: [],
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function fetchMenuItems() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/menu/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch menu items');
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAvailability(item) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/menu/${item._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ available: !item.available }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update item');

      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, available: data.item.available } : i))
      );
      showToast(`${item.name} is now ${data.item.available ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      alert(err.message);
    }
  }

  function openCreateModal() {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'Mains',
      description: item.description || '',
      basePrice: item.basePrice || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      available: item.available !== undefined ? item.available : true,
      avgPrepMinutes: item.avgPrepMinutes || 15,
      imageUrl: item.imageUrl || '',
      variants: item.variants ? item.variants.map((v) => ({ name: v.name, priceDelta: v.priceDelta })) : [],
      addOns: item.addOns ? item.addOns.map((a) => ({ name: a.name, price: a.price })) : [],
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        avgPrepMinutes: parseInt(formData.avgPrepMinutes, 10) || 15,
        variants: formData.variants.map((v) => ({
          name: v.name.trim(),
          priceDelta: parseFloat(v.priceDelta) || 0,
        })),
        addOns: formData.addOns.map((a) => ({
          name: a.name.trim(),
          price: parseFloat(a.price) || 0,
        })),
      };

      const url = editingItem ? `/api/menu/${editingItem._id}` : '/api/menu';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save menu item');

      if (editingItem) {
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? data.item : i)));
        showToast(`Updated "${data.item.name}"`);
      } else {
        setItems((prev) => [data.item, ...prev]);
        showToast(`Added "${data.item.name}" to menu`);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Are you sure you want to mark "${item.name}" as inactive/deleted?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/menu/${item._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to deactivate item');

      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, available: false } : i))
      );
      showToast(`Marked "${item.name}" as unavailable`);
    } catch (err) {
      alert(err.message);
    }
  }

  // Variant helper functions
  function addVariantField() {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: '', priceDelta: 0 }],
    }));
  }
  function updateVariantField(idx, field, value) {
    setFormData((prev) => {
      const next = [...prev.variants];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, variants: next };
    });
  }
  function removeVariantField(idx) {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  }

  // AddOn helper functions
  function addAddOnField() {
    setFormData((prev) => ({
      ...prev,
      addOns: [...prev.addOns, { name: '', price: 0 }],
    }));
  }
  function updateAddOnField(idx, field, value) {
    setFormData((prev) => {
      const next = [...prev.addOns];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, addOns: next };
    });
  }
  function removeAddOnField(idx) {
    setFormData((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== idx),
    }));
  }

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiet =
      dietFilter === 'ALL' ||
      (dietFilter === 'VEG' && item.isVeg) ||
      (dietFilter === 'NON_VEG' && !item.isVeg);
    return matchesCat && matchesSearch && matchesDiet;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-gray-950 font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Menu Manager</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {items.length} total items
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure items, pricing, variants, add-ons, and toggle instant kitchen availability.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-400 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Item</span>
        </button>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search dishes or ingredients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <svg
              className="w-5 h-5 text-gray-500 absolute left-3 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Diet Filter */}
          <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 self-start">
            <button
              onClick={() => setDietFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                dietFilter === 'ALL' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDietFilter('VEG')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${
                dietFilter === 'VEG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Veg Only</span>
            </button>
            <button
              onClick={() => setDietFilter('NON_VEG')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${
                dietFilter === 'NON_VEG' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-800/80">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-orange-500 text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse p-5"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <span className="text-4xl mb-3 block">🔍</span>
          <h3 className="text-lg font-semibold text-white">No menu items found</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new menu item to this category.
          </p>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`group bg-gray-900 border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between ${
                item.available ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800/60 opacity-60 bg-gray-900/40'
              }`}
            >
              <div>
                {/* Header row: Veg dot + category + price */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      className={`inline-flex items-center justify-center w-4 h-4 rounded border text-[9px] font-bold ${
                        item.isVeg
                          ? 'border-emerald-500 text-emerald-500'
                          : 'border-rose-500 text-rose-500'
                      }`}
                    >
                      ●
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white">
                    ₹{item.basePrice.toFixed(2)}
                  </div>
                </div>

                {/* Name & Description */}
                <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description || 'No description provided.'}
                </p>

                {/* Badges / Extras */}
                <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span>⏱</span>
                    <span>{item.avgPrepMinutes || 15}m prep</span>
                  </span>
                  {item.variants && item.variants.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-gray-800/80 text-gray-300">
                      {item.variants.length} variant{item.variants.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {item.addOns && item.addOns.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-gray-800/80 text-gray-300">
                      {item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Availability switch & Edit button */}
              <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={() => handleToggleAvailability(item)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                  <span className={`text-xs font-semibold ${item.available ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {item.available ? 'In Stock' : 'Sold Out'}
                  </span>
                </label>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                    title="Edit Item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Deactivate item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? `Edit: ${editingItem.name}` : 'Add New Menu Item'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set prices, modifiers, and prep details.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Paneer Tikka"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Appetizing description of ingredients, spices, and preparation..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="250.00"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Avg Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.avgPrepMinutes}
                    onChange={(e) => setFormData({ ...formData, avgPrepMinutes: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Dietary Type
                  </label>
                  <div className="flex items-center space-x-3 pt-2">
                    <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="isVeg"
                        checked={formData.isVeg === true}
                        onChange={() => setFormData({ ...formData, isVeg: true })}
                        className="text-emerald-500 focus:ring-emerald-500 bg-gray-950 border-gray-700"
                      />
                      <span className="text-emerald-400 font-semibold">Veg</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="isVeg"
                        checked={formData.isVeg === false}
                        onChange={() => setFormData({ ...formData, isVeg: false })}
                        className="text-rose-500 focus:ring-rose-500 bg-gray-950 border-gray-700"
                      />
                      <span className="text-rose-400 font-semibold">Non-Veg</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Variants Builder */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Variants (Portion / Size)
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      e.g., Half (+0), Full (+100)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantField}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-800 text-orange-400 hover:bg-gray-700 transition"
                  >
                    + Add Variant
                  </button>
                </div>

                {formData.variants.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No variants configured.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.variants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Variant Name (e.g. Large)"
                          value={v.name}
                          onChange={(e) => updateVariantField(idx, 'name', e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">₹+</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Delta"
                            value={v.priceDelta}
                            onChange={(e) => updateVariantField(idx, 'priceDelta', e.target.value)}
                            className="w-24 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantField(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AddOns Builder */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Add-Ons (Customizations)
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      e.g., Extra Cheese (+30), Garlic Dip (+20)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addAddOnField}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-800 text-orange-400 hover:bg-gray-700 transition"
                  >
                    + Add Add-On
                  </button>
                </div>

                {formData.addOns.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No add-ons configured.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.addOns.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add-on Name (e.g. Extra Dip)"
                          value={a.name}
                          onChange={(e) => updateAddOnField(idx, 'name', e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            value={a.price}
                            onChange={(e) => updateAddOnField(idx, 'price', e.target.value)}
                            className="w-24 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAddOnField(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving…' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

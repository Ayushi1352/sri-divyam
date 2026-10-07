"use client";

import { Phone, PenSquare, Trash2, Plus, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";

export default function AddressesPage() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [deleteAddressId, setDeleteAddressId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const [formData, setFormData] = useState({
        title: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
        mobile: "",
        isDefault: false
    });

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get("/api/auth/addresses");
            setAddresses(data.addresses || data.data || data || []);
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const openAddModal = () => {
        setFormData({ title: "", street: "", city: "", state: "", zipCode: "", country: "India", mobile: "", isDefault: false });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (addr) => {
        setFormData({
            title: addr.title || "",
            street: addr.street || "",
            city: addr.city || "",
            state: addr.state || "",
            zipCode: addr.zipCode || "",
            country: addr.country || "India",
            mobile: addr.mobile || "",
            isDefault: addr.isDefault || false
        });
        setCurrentId(addr._id || addr.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (isEditing) {
                await apiClient.put(`/api/auth/addresses/${currentId}`, formData);
            } else {
                await apiClient.post("/api/auth/addresses", formData);
            }
            setShowModal(false);
            fetchAddresses();
            showToast(isEditing ? "Address updated successfully!" : "Address added successfully!");
        } catch (error) {
            alert(error.message || "Failed to save address");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = (id) => {
        setDeleteAddressId(id);
    };

    const confirmDeleteAddress = async () => {
        if (!deleteAddressId) return;
        try {
            await apiClient.delete(`/api/auth/addresses/${deleteAddressId}`);
            fetchAddresses();
            setDeleteAddressId(null);
            showToast("Address deleted successfully!");
        } catch (error) {
            alert(error.message || "Failed to delete address");
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await apiClient.put(`/api/auth/addresses/${id}/default`);
            fetchAddresses();
            showToast("Primary address updated successfully!");
        } catch (error) {
            alert(error.message || "Failed to set default address");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-[17px] sm:text-[28px] font-playfair font-bold text-[#135B42]">Saved Addresses</h2>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-[#135B42] text-white text-[12px] font-bold py-2.5 px-4 rounded-md hover:bg-[#0c4a34] transition-colors shadow-sm shrink-0">
                    <Plus size={16} />
                    Add Address
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-5 sm:p-6">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#135B42]" size={30} /></div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-[13px]">
                        No saved addresses found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <div key={addr._id || addr.id} className={`rounded-lg p-5 bg-[#FAF8F5] relative transition-all ${addr.isDefault ? 'border-2 border-[#135B42] shadow-[0_4px_15px_rgba(19,91,66,0.1)]' : 'border border-gray-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-gray-300'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="font-bold text-[14px] text-[#303030]">{addr.title}</span>
                                    {addr.isDefault && (
                                        <span className="text-[10px] bg-[#E8F0EA] text-[#135B42] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Primary</span>
                                    )}
                                </div>
                                
                                <div className="text-[13px] text-gray-600 space-y-1 mb-4">
                                    <p>{addr.street}</p>
                                    <p>{addr.city}, {addr.state} - {addr.zipCode}</p>
                                    <p>{addr.country}</p>
                                </div>

                                <div className="flex items-center gap-2 text-[13px] text-gray-600 mb-6">
                                    <Phone size={14} className="text-[#135B42]" />
                                    {addr.mobile}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                                    <button onClick={() => openEditModal(addr)} className="flex items-center gap-1.5 text-[12px] font-bold text-[#135B42] hover:underline">
                                        <PenSquare size={14} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(addr._id || addr.id)} className="flex items-center gap-1.5 text-[12px] font-bold text-[#e11d48] hover:underline">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                    {!addr.isDefault && (
                                        <button onClick={() => handleSetDefault(addr._id || addr.id)} className="text-[11px] font-medium text-gray-500 hover:text-[#135B42] underline ml-auto">
                                            Set as Primary
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-[#303030]">{isEditing ? "Edit Address" : "Add Address"}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Title (e.g., Home, Office)</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Street Address</label>
                                    <input required type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                                    <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                                    <input required type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Zip Code</label>
                                    <input required type="text" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Country</label>
                                    <input required type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Mobile</label>
                                    <input required type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} className="rounded text-[#135B42]" />
                                    <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">Set as Primary Address</label>
                                </div>
                            </div>
                            
                            <button type="submit" disabled={formLoading} className="w-full bg-[#135B42] text-white py-2.5 rounded-md font-bold text-sm flex justify-center items-center gap-2 mt-4">
                                {formLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                {isEditing ? "Update Address" : "Save Address"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Address Modal */}
            {deleteAddressId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-[#fff1f2] px-6 py-4 flex items-center justify-between border-b border-[#ffe4e6]">
                            <h3 className="text-[#be123c] text-[17px] font-bold">Confirm Removal</h3>
                            <button onClick={() => setDeleteAddressId(null)} className="text-[#e11d48] hover:text-[#9f1239]">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 pb-8">
                            <p className="text-[#303030] text-[15px] leading-relaxed font-medium">
                                Are you sure you want to delete this address?
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button 
                                onClick={() => setDeleteAddressId(null)}
                                className="px-5 py-2.5 rounded-md bg-white border border-gray-300 text-[14px] font-bold text-[#1F2937] hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteAddress}
                                className="px-5 py-2.5 rounded-md bg-[#e00000] hover:bg-[#be0000] text-white text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2"
                            >
                                Delete Address
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-24 right-4 z-[9999] bg-[#F8FAF9] px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[#1f2937] flex items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2 max-w-[400px] border border-gray-100">
                    <div className="shrink-0 mt-0.5 sm:mt-0">
                        {toast.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        )}
                    </div>
                    <span className="text-[15px] font-medium leading-snug flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 -mr-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

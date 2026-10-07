"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import { Loader2, Plus, X, Package, Pencil } from "lucide-react";

export default function RefundsPage() {
    const [returns, setReturns] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showForm, setShowForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formData, setFormData] = useState({
        order_id: "",
        reason: "",
        type: "refund", // or replacement
        description: ""
    });
    const [formMessage, setFormMessage] = useState(null);

    // Edit/Update Modal state (PUT /api/returns/:id)
    const [showEditForm, setShowEditForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editFormData, setEditFormData] = useState({ reason: "", type: "refund", description: "" });
    const [editFiles, setEditFiles] = useState([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editMessage, setEditMessage] = useState(null);

    const fetchData = async () => {
        try {
            // Fetch both returns and orders
            const [returnsRes, ordersRes] = await Promise.all([
                apiClient.get("/api/returns"),
                apiClient.get("/api/orders")
            ]);

            const returnsData = returnsRes.returns || returnsRes.data || (Array.isArray(returnsRes) ? returnsRes : []);
            setReturns(Array.isArray(returnsData) ? returnsData : []);

            const ordersData = ordersRes.orders || ordersRes.data || (Array.isArray(ordersRes) ? ordersRes : []);
            const validOrders = Array.isArray(ordersData) ? ordersData : [];
            const delivered = validOrders.filter(o => (o.status || "").toLowerCase() === "delivered");
            setDeliveredOrders(delivered);

        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load data. " + (err.message || ""));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setFormMessage(null);
        try {
            const fd = new FormData();
            fd.append("orderId", formData.order_id);
            fd.append("type", formData.type);
            fd.append("reason", formData.reason);
            fd.append("description", formData.description);

            // Fetch items from the selected order
            const selectedOrder = deliveredOrders.find(o => String(o.id || o._id || o.order_id) === String(formData.order_id));
            const itemsToSend = selectedOrder?.items || selectedOrder?.order_items || [];
            fd.append("items", JSON.stringify(itemsToSend));
            if (formData.files) {
                formData.files.forEach(file => {
                    if (file.type.startsWith('video/')) {
                        fd.append('videos', file);
                    } else {
                        fd.append('photos', file);
                    }
                });
            }

            await apiClient.post("/api/returns/request", fd);
            setFormMessage({ type: "success", text: "Return request submitted successfully." });
            setFormData({ order_id: "", reason: "", type: "refund", description: "", files: [] });
            fetchData(); // refresh list
            setTimeout(() => setShowForm(false), 2000);
        } catch (err) {
            setFormMessage({ type: "error", text: err.message || err?.response?.data?.message || "Failed to submit request." });
        } finally {
            setSubmitLoading(false);
        }
    };

    // PUT /api/returns/:id — Form-Data (updated details + optional photos/videos)
    const openEditModal = (ret) => {
        setEditTarget(ret);
        setEditFormData({
            reason: ret.reason || "",
            type: ret.type || "refund",
            description: ret.description || ret.comments || ""
        });
        setEditFiles([]);
        setEditMessage(null);
        setShowEditForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editTarget) return;
        setEditLoading(true);
        setEditMessage(null);
        try {
            const fd = new FormData();
            fd.append("type", editFormData.type);
            fd.append("reason", editFormData.reason);
            fd.append("description", editFormData.description);
            editFiles.forEach(file => {
                if (file.type.startsWith('video/')) {
                    fd.append('videos', file);
                } else {
                    fd.append('photos', file);
                }
            });
            await apiClient.put(`/api/returns/${editTarget.id || editTarget._id}`, fd);
            setEditMessage({ type: "success", text: "Request updated successfully." });
            fetchData();
            setTimeout(() => setShowEditForm(false), 1500);
        } catch (err) {
            setEditMessage({ type: "error", text: err.message || err?.response?.data?.message || "Failed to update request." });
        } finally {
            setEditLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || "pending").toLowerCase();
        if (s === "approved") return "bg-green-100 text-green-700";
        if (s === "rejected" || s === "denied") return "bg-red-100 text-red-700";
        if (s === "processing" || s === "in review") return "bg-blue-100 text-blue-700";
        return "bg-amber-100 text-amber-700";
    };

    if (loading) {
        return <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-[#135B42]" size={32} /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center gap-4">
                <h2 className="text-[17px] sm:text-[28px] font-playfair font-bold text-[#135B42] flex items-center gap-2">
                    My Return/Replacement Requests
                </h2>
                {deliveredOrders.length > 0 && (
                    <button
                        onClick={() => { setShowForm(true); setFormMessage(null); }}
                        className="flex items-center gap-1.5 bg-[#135B42] text-white text-[12px] font-bold px-4 py-2 rounded hover:bg-[#0c402d] transition-colors"
                    >
                        <Plus size={14} /> New Request
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                {error ? (
                    <div className="text-red-500 text-center py-12">{error}</div>
                ) : returns.length > 0 ? (
                    <div className="space-y-4">
                        {returns.map((ret, idx) => (
                            <div key={ret.id || ret._id || idx} className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
                                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                                    <div>
                                        <h4 className="font-bold text-[#303030] text-[14px]">Order {ret.order_id}</h4>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Requested on {new Date(ret.created_at || ret.createdAt || ret.date || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusBadge(ret.status)}`}>
                                            {ret.status || "Pending"}
                                        </span>
                                        {(ret.status || "pending").toLowerCase() === "pending" && (
                                            <button
                                                onClick={() => openEditModal(ret)}
                                                className="text-gray-400 hover:text-[#135B42] transition-colors"
                                                title="Edit request"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="text-[13px] text-gray-600 space-y-1">
                                    <p><span className="font-semibold text-gray-800">Type:</span> <span className="capitalize">{ret.type === 'refund' ? 'Refund' : (ret.type || "Refund")}</span></p>
                                    <p><span className="font-semibold text-gray-800">Reason:</span> {ret.reason}</p>
                                    {(ret.description || ret.comments) && (
                                        <p><span className="font-semibold text-gray-800">Description:</span> {ret.description || ret.comments}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#FAF8F5] rounded-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                        <Package size={40} className="text-gray-200 mb-3" />
                        <p className="text-[13px] text-gray-500 font-medium">No return or replacement requests on file.</p>
                        {deliveredOrders.length > 0 && (
                            <button
                                onClick={() => { setShowForm(true); setFormMessage(null); }}
                                className="mt-4 bg-[#135B42] text-white text-[12px] font-bold px-5 py-2 rounded hover:bg-[#0c402d] transition-colors"
                            >
                                Make a Request
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-md w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#FAF8F5]">
                            <h3 className="font-playfair font-bold text-[#135B42]">Request Return/Replacement</h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Select Delivered Order</label>
                                <select
                                    required
                                    value={formData.order_id}
                                    onChange={e => setFormData({ ...formData, order_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                >
                                    <option value="">-- Select an Order --</option>
                                    {deliveredOrders.map(order => (
                                        <option key={order.id || order._id} value={order.id || order._id || order.order_id}>
                                            Order {order.id || order._id || order.order_id}
                                            ({new Date(order.created_at || order.createdAt || order.date || Date.now()).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Request Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="refund">Return/Refund</option>
                                    <option value="replacement">Replacement</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Reason</label>
                                <select
                                    required
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Damaged product">Damaged product</option>
                                    <option value="Wrong item received">Wrong item received</option>
                                    <option value="Not as described">Not as described</option>
                                    <option value="Quality issue">Quality issue</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Additional Comments (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] h-20 resize-none focus:outline-none focus:border-[#135B42]"
                                    placeholder="Please provide details..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Upload Photos/Videos (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={e => {
                                        const files = e.target.files ? Array.from(e.target.files) : [];
                                        setFormData({ ...formData, files });
                                    }}
                                    className="w-full text-[12px] text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[12px] file:font-bold file:bg-[#135B42] file:text-white hover:file:bg-[#0c402d] cursor-pointer"
                                />
                                {formData.files && formData.files.length > 0 && (
                                    <p className="text-[11px] text-gray-500 mt-1">{formData.files.length} file(s) selected</p>
                                )}
                            </div>

                            {formMessage && (
                                <div className={`text-[12px] font-medium p-2 rounded-sm ${formMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {formMessage.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="w-full bg-[#135B42] text-white py-2.5 rounded-sm font-bold text-[13px] hover:bg-[#0c402d] transition-colors flex justify-center items-center gap-2"
                                >
                                    {submitLoading && <Loader2 size={16} className="animate-spin" />}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── EDIT REQUEST MODAL (PUT /api/returns/:id) ── */}
            {showEditForm && editTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-md w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#FAF8F5]">
                            <h3 className="font-bold text-[#135B42]">Update Request — Order {editTarget.order_id}</h3>
                            <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Request Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                    value={editFormData.type}
                                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                                >
                                    <option value="refund">Return/Refund</option>
                                    <option value="replacement">Replacement</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Reason</label>
                                <select
                                    required
                                    value={editFormData.reason}
                                    onChange={e => setEditFormData({ ...editFormData, reason: e.target.value })}
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Damaged product">Damaged product</option>
                                    <option value="Wrong item received">Wrong item received</option>
                                    <option value="Not as described">Not as described</option>
                                    <option value="Quality issue">Quality issue</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Additional Comments</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-sm p-2 text-[13px] h-20 resize-none focus:outline-none focus:border-[#135B42]"
                                    placeholder="Update your comments..."
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 mb-1">Upload Updated Photos/Videos (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={e => setEditFiles(e.target.files ? Array.from(e.target.files) : [])}
                                    className="w-full text-[12px] text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[12px] file:font-bold file:bg-[#135B42] file:text-white hover:file:bg-[#0c402d] cursor-pointer"
                                />
                                {editFiles.length > 0 && (
                                    <p className="text-[11px] text-gray-500 mt-1">{editFiles.length} file(s) selected</p>
                                )}
                            </div>

                            {editMessage && (
                                <div className={`text-[12px] font-medium p-2 rounded-sm ${editMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {editMessage.text}
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditForm(false)}
                                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-sm font-bold text-[13px] hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 bg-[#135B42] text-white py-2.5 rounded-sm font-bold text-[13px] hover:bg-[#0c402d] transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                                >
                                    {editLoading && <Loader2 size={16} className="animate-spin" />}
                                    Update Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Business, Transaction, Coupon, AppSettings, TenantFile } from "../types";
import { HostingFileManager } from "./HostingFileManager";
import {
  Users,
  CreditCard,
  Settings,
  Calendar,
  FolderCode,
  FileCode,
  Trash2,
  Edit,
  Plus,
  Search,
  Upload,
  Download,
  AlertOctagon,
  Key,
  Database,
  ExternalLink,
  Shield,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Code2,
  Copy,
  Check,
  Lock,
  LogOut,
  Globe,
  DollarSign,
} from "lucide-react";

export const AdminPortal: React.FC = () => {
  // Authentication state - Persisted safely in localStorage across browser refreshes
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("digimoms_admin_token"));
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("digimoms_admin_token") || "";
    }
    return "";
  });
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogout = () => {
    try {
      localStorage.removeItem("digimoms_admin_token");
    } catch {}
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  // Admin Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>("");
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  const [changePasswordLoading, setChangePasswordLoading] = useState<boolean>(false);

  // Manual Plan Edit Modal State
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState<boolean>(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editPlanName, setEditPlanName] = useState<string>("");
  const [editPlanMobile, setEditPlanMobile] = useState<string>("");
  const [editPlanSubdomain, setEditPlanSubdomain] = useState<string>("");
  const [editPlanCustomDomain, setEditPlanCustomDomain] = useState<string>("");
  const [editPlanStartDate, setEditPlanStartDate] = useState<string>("");
  const [editPlanEndDate, setEditPlanEndDate] = useState<string>("");
  const [editPlanServiceDate, setEditPlanServiceDate] = useState<string>("");
  const [editPlanStatus, setEditPlanStatus] = useState<"Active" | "Inactive">("Active");
  const [editPlanLoading, setEditPlanLoading] = useState<boolean>(false);
  const [editPlanMessage, setEditPlanMessage] = useState<string | null>(null);
  const [editPlanError, setEditPlanError] = useState<string | null>(null);

  // Custom Pricing State (Per-Client Pricing Override)
  const [editUseCustomPricing, setEditUseCustomPricing] = useState<boolean>(false);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<string>("");
  const [editMonthlyStrike, setEditMonthlyStrike] = useState<string>("");
  const [editSixMonthPrice, setEditSixMonthPrice] = useState<string>("");
  const [editSixMonthStrike, setEditSixMonthStrike] = useState<string>("");
  const [editOneYearPrice, setEditOneYearPrice] = useState<string>("");
  const [editOneYearStrike, setEditOneYearStrike] = useState<string>("");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "directory" | "override" | "controls" | "cms" | "deployment"
  >("directory");

  // Data states
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Chronological Override State
  const [selectedBusinessForOverride, setSelectedBusinessForOverride] = useState<Business | null>(null);
  const [overrideEndDate, setOverrideEndDate] = useState<string>("");
  const [overrideServiceDate, setOverrideServiceDate] = useState<string>("");
  const [overrideStatus, setOverrideStatus] = useState<"Active" | "Inactive">("Active");
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  // New Business Modal
  const [isAddBizModalOpen, setIsAddBizModalOpen] = useState<boolean>(false);
  const [newBizName, setNewBizName] = useState<string>("");
  const [newBizMobile, setNewBizMobile] = useState<string>("");
  const [newBizSubdomain, setNewBizSubdomain] = useState<string>("");
  const [newBizCustomDomain, setNewBizCustomDomain] = useState<string>("");
  const [newBizMonths, setNewBizMonths] = useState<number>(1);

  // Coupon Form
  const [newCouponCode, setNewCouponCode] = useState<string>("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("fixed");
  const [newCouponVal, setNewCouponVal] = useState<number>(50);
  const [newCouponMin, setNewCouponMin] = useState<number>(99);

  // CMS Virtual File Manager State
  const [selectedBusinessForCMS, setSelectedBusinessForCMS] = useState<Business | null>(null);
  const [tenantFiles, setTenantFiles] = useState<TenantFile[]>([]);
  const [activeFileForEdit, setActiveFileForEdit] = useState<TenantFile | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFileContent, setNewFileContent] = useState<string>("");
  const [isCreateFileOpen, setIsCreateFileOpen] = useState<boolean>(false);
  const [nuclearConfirmId, setNuclearConfirmId] = useState<string | null>(null);

  // SQL Script / Deployment Guide
  const [sqlScript, setSqlScript] = useState<string>("");
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Headers for API calls
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${passwordInput}`,
    "x-admin-key": passwordInput,
  });

  // Fetch all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [bizRes, txRes, cpnRes, setRes] = await Promise.all([
        fetch("/api/admin/businesses", { headers }),
        fetch("/api/admin/transactions", { headers }),
        fetch("/api/admin/coupons", { headers }),
        fetch("/api/admin/settings", { headers }),
      ]);

      if (bizRes.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const bizData = await bizRes.json();
      const txData = await txRes.json();
      const cpnData = await cpnRes.json();
      const setData = await setRes.json();

      setBusinesses(bizData.businesses || []);
      setTransactions(txData.transactions || []);
      setTotalVolume(txData.total_volume || 0);
      setCoupons(cpnData.coupons || []);
      setSettings(setData.settings || null);

      if (bizData.businesses?.length > 0 && !selectedBusinessForCMS) {
        setSelectedBusinessForCMS(bizData.businesses[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Load tenant files when CMS business changes
  const loadTenantFiles = async (bizId: string) => {
    try {
      const res = await fetch(`/api/admin/cms/${bizId}/files`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setTenantFiles(data.files || []);
      if (data.files?.length > 0) {
        setActiveFileForEdit(data.files[0]);
      } else {
        setActiveFileForEdit(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedBusinessForCMS) {
      loadTenantFiles(selectedBusinessForCMS.id);
    }
  }, [selectedBusinessForCMS]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          try {
            localStorage.setItem("digimoms_admin_token", passwordInput);
          } catch {}
          setAuthError(null);
        } else {
          setAuthError(data.error || "Invalid administrator credentials");
        }
      } else {
        const text = await res.text();
        setAuthError(`Server error (HTTP ${res.status}): ${text.substring(0, 120) || "API returned non-JSON response."}`);
      }
    } catch (err: any) {
      setAuthError(err?.message ? `Connection error: ${err.message}` : "Failed to connect to authentication server.");
    }
  };

  // Handle Admin Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    if (!newPasswordInput || newPasswordInput.length < 6) {
      setChangePasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setChangePasswordLoading(true);
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: currentPasswordInput,
          new_password: newPasswordInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChangePasswordSuccess("Admin password updated successfully!");
        setPasswordInput(data.token || newPasswordInput);
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setChangePasswordSuccess(null);
        }, 1800);
      } else {
        setChangePasswordError(data.error || "Failed to change administrator password.");
      }
    } catch (err: any) {
      setChangePasswordError(err.message || "Network error while changing password.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Open manual plan editing modal for a selected business
  const handleOpenEditPlan = (biz: Business) => {
    setEditingBusiness(biz);
    setEditPlanName(biz.name);
    setEditPlanMobile(biz.mobile);
    setEditPlanSubdomain(biz.subdomain);
    setEditPlanCustomDomain(biz.custom_domain || "");
    setEditPlanStartDate(biz.plan_start_date ? biz.plan_start_date.split("T")[0] : "");
    const endStr = biz.plan_end_date ? biz.plan_end_date.split("T")[0] : "";
    setEditPlanEndDate(endStr);
    setEditPlanServiceDate(biz.service_date ? biz.service_date.split("T")[0] : endStr);
    const endMs = new Date(biz.plan_end_date).getTime();
    if (biz.status === "Inactive" || (!isNaN(endMs) && endMs <= Date.now())) {
      setEditPlanStatus("Inactive");
    } else {
      setEditPlanStatus("Active");
    }
    setEditPlanMessage(null);
    setEditPlanError(null);

    // Populate custom pricing if set
    if (biz.custom_pricing && biz.custom_pricing.use_custom) {
      setEditUseCustomPricing(true);
      setEditMonthlyPrice(biz.custom_pricing.monthly_price !== undefined ? String(biz.custom_pricing.monthly_price) : "");
      setEditMonthlyStrike(biz.custom_pricing.monthly_strike !== undefined ? String(biz.custom_pricing.monthly_strike) : "");
      setEditSixMonthPrice(biz.custom_pricing.six_month_price !== undefined ? String(biz.custom_pricing.six_month_price) : "");
      setEditSixMonthStrike(biz.custom_pricing.six_month_strike !== undefined ? String(biz.custom_pricing.six_month_strike) : "");
      setEditOneYearPrice(biz.custom_pricing.one_year_price !== undefined ? String(biz.custom_pricing.one_year_price) : "");
      setEditOneYearStrike(biz.custom_pricing.one_year_strike !== undefined ? String(biz.custom_pricing.one_year_strike) : "");
    } else {
      setEditUseCustomPricing(false);
      setEditMonthlyPrice("");
      setEditMonthlyStrike("");
      setEditSixMonthPrice("");
      setEditSixMonthStrike("");
      setEditOneYearPrice("");
      setEditOneYearStrike("");
    }

    setIsEditPlanModalOpen(true);
  };

  // Immediate expiration toggle button
  const handleSetExpired = () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    setEditPlanEndDate(yesterday);
    setEditPlanServiceDate(yesterday);
    setEditPlanStatus("Inactive");
    setEditPlanMessage(`Expiry set to yesterday (${yesterday}). Saving will turn OFF public website immediately.`);
  };

  // When expiry date is changed in picker
  const handleEndDateChange = (newDateStr: string) => {
    setEditPlanEndDate(newDateStr);
    setEditPlanServiceDate(newDateStr);
    const endMs = new Date(newDateStr).getTime();
    if (!isNaN(endMs) && endMs <= Date.now()) {
      setEditPlanStatus("Inactive");
      setEditPlanMessage(`Date is today or past: Status set to Inactive (Website will turn OFF).`);
    } else {
      setEditPlanStatus("Active");
      setEditPlanMessage(null);
    }
  };

  // Quick extend plan by N days
  const handleQuickExtendDays = (days: number) => {
    const currentStr = editPlanEndDate || new Date().toISOString().split("T")[0];
    const current = new Date(currentStr);
    const base = current.getTime() < Date.now() ? new Date() : current;
    base.setDate(base.getDate() + days);
    const updatedStr = base.toISOString().split("T")[0];
    setEditPlanEndDate(updatedStr);
    setEditPlanServiceDate(updatedStr);
    setEditPlanStatus("Active");
    setEditPlanMessage(`Added +${days} days to validity. Expiry updated to ${updatedStr}`);
  };

  // Save manual plan changes
  const handleSaveBusinessPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;

    try {
      setEditPlanLoading(true);
      setEditPlanError(null);
      setEditPlanMessage(null);

      const customPricingPayload = editUseCustomPricing
        ? {
            use_custom: true,
            monthly_price: editMonthlyPrice ? Number(editMonthlyPrice) : undefined,
            monthly_strike: editMonthlyStrike ? Number(editMonthlyStrike) : undefined,
            six_month_price: editSixMonthPrice ? Number(editSixMonthPrice) : undefined,
            six_month_strike: editSixMonthStrike ? Number(editSixMonthStrike) : undefined,
            one_year_price: editOneYearPrice ? Number(editOneYearPrice) : undefined,
            one_year_strike: editOneYearStrike ? Number(editOneYearStrike) : undefined,
          }
        : { use_custom: false };

      const res = await fetch(`/api/admin/businesses/${editingBusiness.id}/plan`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editPlanName,
          mobile: editPlanMobile,
          subdomain: editPlanSubdomain,
          custom_domain: editPlanCustomDomain || null,
          plan_start_date: editPlanStartDate,
          plan_end_date: editPlanEndDate,
          service_date: editPlanServiceDate,
          status: editPlanStatus,
          custom_pricing: customPricingPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditPlanMessage(`Plan & pricing successfully updated for ${editPlanName}!`);
        await loadAdminData();
        setTimeout(() => {
          setIsEditPlanModalOpen(false);
          setEditPlanMessage(null);
        }, 1200);
      } else {
        setEditPlanError(data.error || "Failed to update business plan.");
      }
    } catch (err: any) {
      setEditPlanError(err.message || "Network error while saving plan changes.");
    } finally {
      setEditPlanLoading(false);
    }
  };

  // Chronological Override Submission
  const [confirmingTxId, setConfirmingTxId] = useState<string | null>(null);

  const handleConfirmTransaction = async (txId: string) => {
    try {
      setConfirmingTxId(txId);
      const res = await fetch(`/api/admin/transactions/${txId}/confirm`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Payment verified and store subscription activated!");
        await loadAdminData();
      } else {
        alert(data.error || "Failed to confirm transaction.");
      }
    } catch (err: any) {
      alert("Error confirming transaction: " + err.message);
    } finally {
      setConfirmingTxId(null);
    }
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessForOverride) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/businesses/${selectedBusinessForOverride.id}/override`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          plan_end_date: overrideEndDate,
          service_date: overrideServiceDate,
          status: overrideStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOverrideMessage(`Successfully applied chronological override for ${selectedBusinessForOverride.name}!`);
        await loadAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Business Submission
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newBizName,
          mobile: newBizMobile,
          subdomain: newBizSubdomain,
          custom_domain: newBizCustomDomain || undefined,
          plan_duration_months: newBizMonths,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddBizModalOpen(false);
        setNewBizName("");
        setNewBizMobile("");
        setNewBizSubdomain("");
        setNewBizCustomDomain("");
        await loadAdminData();
      } else {
        alert(data.error || "Failed to create business");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Global Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        alert("Global configuration saved successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Coupon Creation
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: newCouponCode,
          discount_type: newCouponType,
          discount_value: newCouponVal,
          min_amount: newCouponMin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCouponCode("");
        await loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to sunset/delete this coupon?")) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // CMS: Save File Content
  const handleSaveFileContent = async () => {
    if (!selectedBusinessForCMS || !activeFileForEdit) return;
    try {
      const res = await fetch(
        `/api/admin/cms/${selectedBusinessForCMS.id}/files/${activeFileForEdit.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: activeFileForEdit.content }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(`Saved ${activeFileForEdit.name} successfully!`);
        await loadTenantFiles(selectedBusinessForCMS.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CMS: Create new file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessForCMS || !newFileName.trim()) return;

    try {
      const res = await fetch(`/api/admin/cms/${selectedBusinessForCMS.id}/files`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newFileName.trim(),
          content: newFileContent,
          content_type: newFileName.endsWith(".html")
            ? "text/html"
            : newFileName.endsWith(".css")
            ? "text/css"
            : newFileName.endsWith(".js")
            ? "application/javascript"
            : "text/plain",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateFileOpen(false);
        setNewFileName("");
        setNewFileContent("");
        await loadTenantFiles(selectedBusinessForCMS.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CMS: Delete single file
  const handleDeleteFile = async (fileId: string) => {
    if (!selectedBusinessForCMS || !confirm("Erase this redundant file from tenant bucket?")) return;
    try {
      await fetch(`/api/admin/cms/${selectedBusinessForCMS.id}/files/${fileId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await loadTenantFiles(selectedBusinessForCMS.id);
    } catch (err) {
      console.error(err);
    }
  };

  // SECTION 5: NUCLEAR "Delete Business Terminally"
  // Wipes core database registry row and flushes all physical media directories in that client's specific Supabase asset path.
  const handleNuclearDelete = async (bizId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/businesses/${bizId}/terminal`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setNuclearConfirmId(null);
        await loadAdminData();
        if (selectedBusinessForCMS?.id === bizId) {
          setSelectedBusinessForCMS(null);
        }
      } else {
        alert("Failed to execute nuclear delete: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered businesses
  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mobile.includes(searchTerm)
  );

  // Authentication Gate Screen
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl text-neutral-100">
        <div className="w-12 h-12 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-800">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-center text-white">Master Command Console</h2>
        <p className="text-xs text-neutral-400 text-center mt-1">
          Protected credentials-guarded directory &bull; web.digimoms.in
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Administrator Master Key
            </label>
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                id="admin-master-key-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter master password"
                className="w-full px-4 py-2.5 pr-10 bg-neutral-950 border border-neutral-700 focus:border-blue-500 rounded-xl text-sm font-mono outline-none text-white"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="text-neutral-400 hover:text-neutral-200 absolute right-3 top-3 transition"
                title={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-neutral-500" />
              <span>Strict secure access &bull; Authorized administrators only</span>
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
              {authError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl text-sm text-white transition shadow-sm"
          >
            Authenticate &amp; Enter Console
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Admin Navigation Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "directory"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Business Directory &amp; Ledger
          </button>

          <button
            onClick={() => setActiveTab("override")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "override"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Chronological Override Panel
          </button>

          <button
            onClick={() => setActiveTab("controls")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "controls"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Global Management Controls
          </button>

          <button
            onClick={() => setActiveTab("cms")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "cms"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <FolderCode className="w-3.5 h-3.5" /> Multi-Tenant CMS &amp; Files
          </button>

          <button
            onClick={() => setActiveTab("deployment")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "deployment"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> SQL &amp; Host Routing Guide
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2 flex-wrap">
          <button
            onClick={() => {
              setCurrentPasswordInput("");
              setNewPasswordInput("");
              setConfirmPasswordInput("");
              setChangePasswordError(null);
              setChangePasswordSuccess(null);
              setIsChangePasswordOpen(true);
            }}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
            title="Change Master Administrator Password"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" /> Change Password
          </button>
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
            title="Refresh All Ledgers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPasswordInput("");
            }}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Secure Admin Logout (Session auto-resets on refresh)"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <span className="text-xs text-neutral-500 font-mono hidden md:inline">web.digimoms.in</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODULE 1: Business Directory & Ledger */}
      {/* ========================================================================= */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by store name, mobile, or subdomain..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddBizModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Store Tenant
              </button>
            </div>
          </div>

          {/* Reactive Data Grid: Businesses */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Registered Multi-Tenant Stores</h3>
                <p className="text-xs text-neutral-400">
                  Total {businesses.length} client registries managed under Digimoms Cloud
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-3">Store Name &amp; Tenant</th>
                    <th className="px-4 py-3">Registered Mobile</th>
                    <th className="px-4 py-3">Subdomain &amp; Domain</th>
                    <th className="px-4 py-3">Plan Validity</th>
                    <th className="px-4 py-3">Live Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredBusinesses.map((biz) => {
                    const now = new Date();
                    const endDate = new Date(biz.plan_end_date);
                    const isExpired = now.getTime() >= endDate.getTime() || biz.status === "Inactive";
                    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isOnline = !isExpired && biz.status === "Active";

                    return (
                      <tr key={biz.id} className="hover:bg-neutral-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-neutral-100 text-sm">{biz.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">ID: {biz.id.slice(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-4 font-mono text-neutral-200">+91 {biz.mobile}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 font-mono text-blue-400 text-xs">
                            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <a
                              href={`https://web.digimoms.in/${biz.subdomain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline font-semibold"
                            >
                              web.digimoms.in/{biz.subdomain}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-emerald-300/90 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded font-mono">
                              Path-based &bull; No DNS setup
                            </span>
                            {biz.custom_pricing?.use_custom && (
                              <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5 font-bold">
                                <DollarSign className="w-2.5 h-2.5" /> Custom Plan: &#8377;{biz.custom_pricing.monthly_price}/mo
                              </span>
                            )}
                          </div>
                          {biz.custom_domain && (
                            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{biz.custom_domain}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-mono font-medium text-neutral-200">
                            {new Date(biz.plan_end_date).toLocaleDateString()}
                          </div>
                          <div
                            className={`text-[11px] ${
                              isExpired ? "text-red-400 font-semibold" : "text-emerald-400"
                            }`}
                          >
                            {isExpired ? "Expired / Web OFF" : `${diffDays} days remaining`}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              isOnline
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-red-950 text-red-300 border border-red-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? "bg-emerald-400" : "bg-red-400 animate-pulse"
                              }`}
                            />
                            {isOnline ? "Active (Online)" : "Suspended (OFF)"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditPlan(biz)}
                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white rounded-lg text-xs font-medium transition"
                            title="Manually edit business plan, dates, and profile"
                          >
                            <Edit className="w-3 h-3 inline mr-1" /> Edit Plan
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBusinessForOverride(biz);
                              setOverrideEndDate(biz.plan_end_date.split("T")[0]);
                              setOverrideServiceDate((biz.service_date || biz.plan_end_date).split("T")[0]);
                              setOverrideStatus(biz.status);
                              setActiveTab("override");
                            }}
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition"
                            title="Override validity"
                          >
                            <Calendar className="w-3 h-3 inline mr-1" /> Override
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBusinessForCMS(biz);
                              setActiveTab("cms");
                            }}
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition"
                            title="Open virtual file manager"
                          >
                            <FolderCode className="w-3 h-3 inline mr-1" /> CMS Files
                          </button>
                          <button
                            onClick={() => setNuclearConfirmId(biz.id)}
                            className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-medium transition"
                            title="Terminal Nuclear Delete"
                          >
                            <Trash2 className="w-3 h-3 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Financial Timeline & Transaction Ledger */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Payment &amp; Renewal Financial Timeline</h3>
                <p className="text-xs text-neutral-400">
                  Comprehensive audit ledger tracking PayU gateway payments, amounts, coupons, and timestamps
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400">Total Volume Collected:</span>
                <div className="text-lg font-bold font-mono text-emerald-400">&#8377;{totalVolume.toFixed(2)}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-3">Transaction ID &amp; Ref</th>
                    <th className="px-4 py-3">Store Name</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Amount &amp; Coupon</th>
                    <th className="px-4 py-3">Gateway Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                    <th className="px-6 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-800/40 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-mono font-bold text-neutral-200">{tx.payu_txnid}</div>
                        {tx.payu_payment_id && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Gateway Ref: {tx.payu_payment_id}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-white">{tx.business_name || "Merchant"}</td>
                      <td className="px-4 py-3.5 capitalize font-mono text-blue-400">
                        {tx.plan_tier.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold font-mono text-neutral-100">&#8377;{tx.amount.toFixed(2)}</div>
                        {tx.coupon_code && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Coupon: {tx.coupon_code} (-&#8377;{tx.discount_amount})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === "Success"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : tx.status === "Pending"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-red-950 text-red-300 border border-red-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {tx.status === "Pending" ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmTransaction(tx.id)}
                            disabled={confirmingTxId === tx.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
                            title="Manually verify payment and activate store plan"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            {confirmingTxId === tx.id ? "Confirming..." : "Confirm & Activate"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {tx.status === "Success" ? "Verified" : "Closed"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-neutral-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODULE 2: Chronological Override Panel */}
      {/* ========================================================================= */}
      {activeTab === "override" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-white">Chronological Override Command Panel</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Manually extend, retract, or override <code className="text-blue-400">plan_end_date</code> and{" "}
              <code className="text-blue-400">service_date</code> for any store to accommodate manual cash handlings or VIP exceptions.
            </p>
          </div>

          {overrideMessage && (
            <div className="p-4 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {overrideMessage}
            </div>
          )}

          <form onSubmit={handleApplyOverride} className="space-y-6 max-w-2xl">
            {/* Store Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Select Business Profile
              </label>
              <select
                value={selectedBusinessForOverride?.id || ""}
                onChange={(e) => {
                  const b = businesses.find((item) => item.id === e.target.value);
                  if (b) {
                    setSelectedBusinessForOverride(b);
                    setOverrideEndDate(b.plan_end_date.split("T")[0]);
                    setOverrideServiceDate((b.service_date || b.plan_end_date).split("T")[0]);
                    setOverrideStatus(b.status);
                  }
                }}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-neutral-100 outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Store to Override --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.subdomain}.digimoms.in) - Current Status: {b.status}
                  </option>
                ))}
              </select>
            </div>

            {selectedBusinessForOverride && (
              <div className="space-y-4 p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Calendar Input: Plan End Date */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Plan End Date (Validity)
                    </label>
                    <input
                      type="date"
                      value={overrideEndDate}
                      onChange={(e) => setOverrideEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-mono outline-none"
                    />
                  </div>

                  {/* Calendar Input: Service Date */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Service Date (Next Review)
                    </label>
                    <input
                      type="date"
                      value={overrideServiceDate}
                      onChange={(e) => setOverrideServiceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Manual Store State Force
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOverrideStatus("Active")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition ${
                        overrideStatus === "Active"
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-900 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Force Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideStatus("Inactive")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition ${
                        overrideStatus === "Inactive"
                          ? "bg-red-600 text-white"
                          : "bg-neutral-900 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Force Inactive / Suspended
                    </button>
                  </div>
                </div>

                {/* Quick Increment Presets */}
                <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-neutral-500">Quick Extension:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(overrideEndDate || Date.now());
                      d.setMonth(d.getMonth() + 1);
                      setOverrideEndDate(d.toISOString().split("T")[0]);
                      setOverrideStatus("Active");
                    }}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono"
                  >
                    +1 Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(overrideEndDate || Date.now());
                      d.setMonth(d.getMonth() + 6);
                      setOverrideEndDate(d.toISOString().split("T")[0]);
                      setOverrideStatus("Active");
                    }}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono"
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(overrideEndDate || Date.now());
                      d.setFullYear(d.getFullYear() + 1);
                      setOverrideEndDate(d.toISOString().split("T")[0]);
                      setOverrideStatus("Active");
                    }}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono"
                  >
                    +1 Year
                  </button>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition"
                  >
                    <Save className="w-4 h-4" /> Save Chronological Override
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODULE 3: Global Management Controls & Coupon Manager */}
      {/* ========================================================================= */}
      {activeTab === "controls" && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PayU Merchant Keys & Gateway Settings */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">PayU Gateway Keys &amp; Encryption</h3>
            </div>
            <p className="text-xs text-neutral-400">
              The application retrieves the encrypted Merchant Key and Salt directly from the Supabase configuration settings row, rather than hardcoding them into client files.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  PayU Merchant Key
                </label>
                <input
                  type="text"
                  value={settings.payu_merchant_key}
                  onChange={(e) => setSettings({ ...settings, payu_merchant_key: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  PayU Merchant Salt (Encrypted Secret)
                </label>
                <input
                  type="password"
                  value={settings.payu_salt}
                  onChange={(e) => setSettings({ ...settings, payu_salt: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  PayU Environment Mode
                </label>
                <select
                  value={settings.payu_env}
                  onChange={(e) => setSettings({ ...settings, payu_env: e.target.value as "test" | "prod" })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white outline-none"
                >
                  <option value="test">Sandbox / Test Mode (https://test.payu.in)</option>
                  <option value="prod">Production Live Mode (https://secure.payu.in)</option>
                </select>
              </div>

              {/* WhatsApp Support Configuration */}
              <div className="border-t border-neutral-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Custom Domain WhatsApp Redirection
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Pre-filled Message
                  </label>
                  <input
                    type="text"
                    value={settings.whatsapp_message}
                    onChange={(e) => setSettings({ ...settings, whatsapp_message: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-4 h-4" /> Save Gateway &amp; Global Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Subscription Pricing Matrix & Coupon Manager */}
          <div className="space-y-6">
            {/* Dynamic Package Pricing Matrix Editor */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-white">Subscription Renewal Tier Pricing</h3>
              <p className="text-xs text-neutral-400">
                Variables set here dynamically populate the 3-tier payment package matrix on the public renewal portal.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-neutral-400 font-semibold">Monthly Live Cost (&#8377;)</label>
                  <input
                    type="number"
                    value={settings.monthly_price}
                    onChange={(e) => setSettings({ ...settings, monthly_price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-semibold">Monthly Strike Price (&#8377;)</label>
                  <input
                    type="number"
                    value={settings.monthly_strike}
                    onChange={(e) => setSettings({ ...settings, monthly_strike: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-semibold">6-Month Live Cost (&#8377;)</label>
                  <input
                    type="number"
                    value={settings.six_month_price}
                    onChange={(e) => setSettings({ ...settings, six_month_price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-semibold">6-Month Strike Price (&#8377;)</label>
                  <input
                    type="number"
                    value={settings.six_month_strike}
                    onChange={(e) => setSettings({ ...settings, six_month_strike: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-semibold">1-Year Live Cost (&#8377;)</label>
                  <input
                    type="number"
                    value={settings.one_year_price}
                    onChange={(e) => setSettings({ ...settings, one_year_price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-semibold">1-Year Strike Price (&#8377;)</label>
                  <input
                    type="number"
                    value={settings.one_year_strike}
                    onChange={(e) => setSettings({ ...settings, one_year_strike: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white mt-1"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg text-xs transition"
              >
                Update Pricing Matrix
              </button>
            </div>

            {/* Coupon Manager */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-white">Coupon &amp; Voucher Manager</h3>
              <p className="text-xs text-neutral-400">Create, toggle, or sunset discount promo vouchers.</p>

              {/* Create coupon form */}
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="CODE (e.g. MEGA50)"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono uppercase text-white outline-none"
                  required
                />
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as "percentage" | "fixed")}
                  className="px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                >
                  <option value="fixed">Fixed (&#8377;)</option>
                  <option value="percentage">Percent (%)</option>
                </select>
                <input
                  type="number"
                  placeholder="Discount"
                  value={newCouponVal}
                  onChange={(e) => setNewCouponVal(Number(e.target.value))}
                  className="px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg font-mono text-white outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
                >
                  Add Code
                </button>
              </form>

              {/* Active Coupons List */}
              <div className="space-y-2 mt-3">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-white mr-2">{c.code}</span>
                      <span className="text-neutral-400">
                        {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `&#8377;${c.discount_value} OFF`}
                      </span>
                      <span className="text-neutral-500 ml-2">(Min: &#8377;{c.min_amount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c.id, c.is_active)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.is_active
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {c.is_active ? "Active" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-1 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Master Security & Admin Password */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3 shadow-sm md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" /> Master Administrator Security
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Manage access credentials for <code className="text-blue-400">web.digimoms.in/admin</code>. Current active password: <code className="text-white font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">{passwordInput}</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPasswordInput("");
                    setNewPasswordInput("");
                    setConfirmPasswordInput("");
                    setChangePasswordError(null);
                    setChangePasswordSuccess(null);
                    setIsChangePasswordOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Key className="w-3.5 h-3.5" /> Change Admin Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODULE 4: Multi-Tenant CMS & Online Hosting File Manager */}
      {/* ========================================================================= */}
      {activeTab === "cms" && (
        <HostingFileManager
          selectedBusiness={selectedBusinessForCMS}
          businesses={businesses}
          onSelectBusiness={(b) => setSelectedBusinessForCMS(b)}
          getAuthHeaders={getAuthHeaders}
          onDeleteBusinessTerminal={(bizId) => setNuclearConfirmId(bizId)}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-MODULE 5: SQL Deployment Scripts & Host Routing Instructions */}
      {/* ========================================================================= */}
      {activeTab === "deployment" && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" /> Supabase Database Schema &amp; web.digimoms.in Routing
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Step-by-step instructions for database deployment scripts, Row Level Security (RLS) policies, and configuration steps for hosting under <code className="text-blue-300 font-bold">web.digimoms.in</code>.
              </p>
            </div>

            {/* Architecture Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                <div className="font-bold text-neutral-200">1. Supabase SQL Execution</div>
                <p className="text-neutral-400">
                  Open your Supabase Project Dashboard &gt; <strong>SQL Editor</strong> &gt; Click <strong>New Query</strong>, paste the schema script below and click <strong>Run</strong>.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                <div className="font-bold text-neutral-200">2. DNS Routing for web.digimoms.in</div>
                <p className="text-neutral-400">
                  Create a DNS <strong>CNAME</strong> or <strong>A Record</strong> for <code className="text-blue-300">web.digimoms.in</code> pointing to this application server with automated SSL.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                <div className="font-bold text-neutral-200">3. PayU Webhook URL</div>
                <p className="text-neutral-400">
                  Inside PayU Merchant Dashboard &gt; Webhooks, configure callback to: <code className="text-blue-300">https://web.digimoms.in/api/payu-webhook</code>.
                </p>
              </div>
            </div>

            {/* Copyable SQL Schema Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300 uppercase tracking-wider">
                  Production PostgreSQL / Supabase Schema (Tables, RLS &amp; RPC Functions)
                </span>
                <button
                  onClick={() => {
                    const fullSql = `-- SUPABASE POSTGRESQL SCHEMA FOR web.digimoms.in
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    service_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    mobile VARCHAR(20),
    plan_tier VARCHAR(50) NOT NULL CHECK (plan_tier IN ('monthly', 'six_month', 'one_year')),
    amount NUMERIC(10, 2) NOT NULL,
    original_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    coupon_code VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
    payu_txnid VARCHAR(100) NOT NULL UNIQUE,
    payu_payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_amount NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
    payu_merchant_key VARCHAR(255) DEFAULT 'gtKFFx',
    payu_salt VARCHAR(255) DEFAULT 'eCwWELxi',
    payu_env VARCHAR(10) DEFAULT 'test',
    whatsapp_number VARCHAR(30) DEFAULT '+919475388085',
    whatsapp_message TEXT DEFAULT 'I want to renewal domain',
    monthly_price NUMERIC(10, 2) DEFAULT 99.00,
    monthly_strike NUMERIC(10, 2) DEFAULT 999.00,
    six_month_price NUMERIC(10, 2) DEFAULT 499.00,
    six_month_strike NUMERIC(10, 2) DEFAULT 594.00,
    one_year_price NUMERIC(10, 2) DEFAULT 949.00,
    one_year_strike NUMERIC(10, 2) DEFAULT 1188.00,
    admin_password VARCHAR(255) DEFAULT 'admin123456'
);

-- RPC Function: Live Supabase Database Size in Bytes
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_size BIGINT;
BEGIN
    SELECT pg_database_size(current_database()) INTO db_size;
    RETURN db_size;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_database_size() TO anon, authenticated, service_role;

-- Row Level Security (RLS)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can query their business by mobile" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND expiry_date > NOW());
CREATE POLICY "Service Role Full Access" ON public.businesses FOR ALL TO service_role USING (true);
CREATE POLICY "Service Role Tx" ON public.transactions FOR ALL TO service_role USING (true);
CREATE POLICY "Service Role Settings" ON public.settings FOR ALL TO service_role USING (true);
CREATE POLICY "Service Role Coupons" ON public.coupons FOR ALL TO service_role USING (true);`;

                    navigator.clipboard.writeText(fullSql);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? "Copied SQL to Clipboard" : "Copy Complete SQL Script"}
                </button>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-300 overflow-x-auto max-h-72">
                <pre>{`-- Live Supabase Storage Function (Section 1 requirement):
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_size BIGINT;
BEGIN
    SELECT pg_database_size(current_database()) INTO db_size;
    RETURN db_size;
END;
$$;

-- Tables: businesses, transactions, coupons, settings
-- RLS policies: Service role write permissions + public read lookups
-- Storage bucket: client-assets under buckets/{client_id}/assets/`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Store Tenant */}
      {isAddBizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 text-neutral-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Business Profile</h3>
            <form onSubmit={handleCreateBusiness} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Business / Store Name</label>
                <input
                  type="text"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Royal Sweets & Bakers"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Registered Mobile Number</label>
                <input
                  type="text"
                  value={newBizMobile}
                  onChange={(e) => setNewBizMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Website Path Link (No GoDaddy DNS needed!)
                </label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 bg-neutral-800 border border-neutral-700 border-r-0 rounded-l-lg text-neutral-400 font-mono text-xs">
                    web.digimoms.in/
                  </span>
                  <input
                    type="text"
                    value={newBizSubdomain}
                    onChange={(e) => setNewBizSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                    placeholder="e.g. royalsweets"
                    className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-r-lg text-white font-mono text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-emerald-400 mt-1">
                  Live URL will be: <code>web.digimoms.in/{newBizSubdomain || "xyz"}</code> (Instant, no Godaddy CNAME/A-records needed).
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Custom Domain (Optional)
                </label>
                <input
                  type="text"
                  value={newBizCustomDomain}
                  onChange={(e) => setNewBizCustomDomain(e.target.value)}
                  placeholder="e.g. royalsweets.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Initial Plan Term (Months)
                </label>
                <select
                  value={newBizMonths}
                  onChange={(e) => setNewBizMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                >
                  <option value={1}>1 Month (Monthly Tier)</option>
                  <option value={6}>6 Months (Half-Year Tier)</option>
                  <option value={12}>12 Months (1-Year Tier)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBizModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Virtual File in CMS */}
      {isCreateFileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 text-neutral-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Add File to Tenant Storage Bucket</h3>
            <form onSubmit={handleCreateFile} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  File Name (e.g. index.html, style.css, app.js)
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="index.html"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Initial Code / Content</label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Enter HTML or code here..."
                  className="w-full h-36 p-3 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFileOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Save to Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuclear Delete Confirmation Dialog */}
      {nuclearConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border-2 border-red-700 w-full max-w-md rounded-2xl p-6 text-neutral-100 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-700 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-white">Confirm Nuclear Terminal Delete</h3>
            <p className="text-xs text-neutral-300 text-center mt-2 leading-relaxed">
              This action will permanently purge the business from the registry and delete all physical media directories inside that client&apos;s specific Supabase asset path.
            </p>
            <div className="bg-red-950/50 p-3 rounded-lg border border-red-800 text-[11px] text-red-200 mt-4 text-center">
              ⚠️ This action cannot be undone. All static website code files will be destroyed.
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setNuclearConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleNuclearDelete(nuclearConfirmId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Execute Nuclear Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Change Master Admin Password */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Master Admin Password</h3>
                  <p className="text-[11px] text-neutral-400">Update the master security key for web.digimoms.in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-neutral-400 hover:text-white text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Current Master Password
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current master password"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-semibold">New Master Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> {showPasswordText ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new master password (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Confirm New Master Password
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter new master password"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                  required
                />
              </div>

              {changePasswordError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                  {changePasswordError}
                </div>
              )}

              {changePasswordSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{changePasswordSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition shadow-md"
                >
                  {changePasswordLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manual Business Plan & Profile Editor */}
      {isEditPlanModalOpen && editingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl p-6 text-neutral-100 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/40">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manual Plan &amp; Store Editor</h3>
                  <p className="text-[11px] text-neutral-400">
                    Modifying: <span className="text-white font-semibold">{editingBusiness.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPlanModalOpen(false)}
                className="text-neutral-400 hover:text-white text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBusinessPlan} className="space-y-4 text-xs">
              {/* Store Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editPlanName}
                    onChange={(e) => setEditPlanName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Registered Mobile (+91)</label>
                  <input
                    type="text"
                    value={editPlanMobile}
                    onChange={(e) => setEditPlanMobile(e.target.value)}
                    maxLength={10}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Path Routing (Subdomain) & Custom Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Website Path Link (No GoDaddy DNS needed!)
                  </label>
                  <div className="flex items-center">
                    <span className="bg-neutral-800 border border-r-0 border-neutral-700 px-2.5 py-2 text-neutral-400 rounded-l-xl font-mono text-xs">
                      web.digimoms.in/
                    </span>
                    <input
                      type="text"
                      value={editPlanSubdomain}
                      onChange={(e) => setEditPlanSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-r-xl text-blue-400 font-mono text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Custom Domain (Optional)</label>
                  <input
                    type="text"
                    value={editPlanCustomDomain}
                    onChange={(e) => setEditPlanCustomDomain(e.target.value)}
                    placeholder="e.g. apexstudio.com"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick Plan Extension Buttons */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <label className="block text-neutral-300 font-semibold">
                  ⚡ Quick Plan Validity Extension (One-Click)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickExtendDays(30)}
                    className="py-1.5 px-2 bg-neutral-900 hover:bg-blue-600 hover:text-white border border-neutral-700 rounded-lg text-neutral-200 text-center font-medium transition text-xs"
                  >
                    +30 Days (1 Mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtendDays(90)}
                    className="py-1.5 px-2 bg-neutral-900 hover:bg-blue-600 hover:text-white border border-neutral-700 rounded-lg text-neutral-200 text-center font-medium transition text-xs"
                  >
                    +90 Days (3 Mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtendDays(180)}
                    className="py-1.5 px-2 bg-neutral-900 hover:bg-blue-600 hover:text-white border border-neutral-700 rounded-lg text-neutral-200 text-center font-medium transition text-xs"
                  >
                    +180 Days (6 Mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtendDays(365)}
                    className="py-1.5 px-2 bg-neutral-900 hover:bg-blue-600 hover:text-white border border-neutral-700 rounded-lg text-neutral-200 text-center font-medium transition text-xs"
                  >
                    +365 Days (1 Yr)
                  </button>
                  <button
                    type="button"
                    onClick={handleSetExpired}
                    className="py-1.5 px-2 bg-red-950/80 hover:bg-red-700 hover:text-white border border-red-700/60 rounded-lg text-red-200 text-center font-bold transition text-xs flex items-center justify-center gap-1"
                    title="Expire subscription to turn OFF website immediately"
                  >
                    🔴 Expire (Web OFF)
                  </button>
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Plan Start Date</label>
                  <input
                    type="date"
                    value={editPlanStartDate}
                    onChange={(e) => setEditPlanStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Plan Expiry Date</label>
                  <input
                    type="date"
                    value={editPlanEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Service Cutoff Date</label>
                  <input
                    type="date"
                    value={editPlanServiceDate}
                    onChange={(e) => setEditPlanServiceDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Status Preview Banner */}
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                editPlanStatus === "Inactive" || (editPlanEndDate && new Date(editPlanEndDate).getTime() <= Date.now())
                  ? "bg-red-950/40 border-red-800 text-red-300"
                  : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              }`}>
                {editPlanStatus === "Inactive" || (editPlanEndDate && new Date(editPlanEndDate).getTime() <= Date.now()) ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <div>
                      <strong className="block text-red-200">🔴 Website Service Suspended (Web OFF)</strong>
                      <span className="text-[11px] text-red-400">Visitors to /{editPlanSubdomain} will see the Renewal Suspended screen.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div>
                      <strong className="block text-emerald-200">🟢 Store Active &amp; Online (Web ON)</strong>
                      <span className="text-[11px] text-emerald-400">Visitors can browse /{editPlanSubdomain} normally.</span>
                    </div>
                  </>
                )}
              </div>

              {/* Custom Pricing Module for this specific business */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-neutral-200 font-bold flex items-center gap-1.5 text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      Custom Renewal Pricing for this Client
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      Charge custom monthly / yearly renewal rates specifically for this business instead of global rates.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUseCustomPricing}
                      onChange={(e) => setEditUseCustomPricing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {editUseCustomPricing && (
                  <div className="pt-2 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Monthly tier */}
                    <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-lg space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-300 block">1 Month Plan</span>
                      <div>
                        <label className="text-[10px] text-neutral-400 block">Price (&#8377;)</label>
                        <input
                          type="number"
                          placeholder="e.g. 999"
                          value={editMonthlyPrice}
                          onChange={(e) => setEditMonthlyPrice(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-white font-mono text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 block">Strike Price (&#8377;)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1999"
                          value={editMonthlyStrike}
                          onChange={(e) => setEditMonthlyStrike(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-400 font-mono text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* 6 Month tier */}
                    <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-lg space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-300 block">6 Month Plan</span>
                      <div>
                        <label className="text-[10px] text-neutral-400 block">Price (&#8377;)</label>
                        <input
                          type="number"
                          placeholder="e.g. 4999"
                          value={editSixMonthPrice}
                          onChange={(e) => setEditSixMonthPrice(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-white font-mono text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 block">Strike Price (&#8377;)</label>
                        <input
                          type="number"
                          placeholder="e.g. 8999"
                          value={editSixMonthStrike}
                          onChange={(e) => setEditSixMonthStrike(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-400 font-mono text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* 1 Year tier */}
                    <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-lg space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-300 block">1 Year Plan</span>
                      <div>
                        <label className="text-[10px] text-neutral-400 block">Price (&#8377;)</label>
                        <input
                          type="number"
                          placeholder="e.g. 8999"
                          value={editOneYearPrice}
                          onChange={(e) => setEditOneYearPrice(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-white font-mono text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 block">Strike Price (&#8377;)</label>
                        <input
                          type="number"
                          placeholder="e.g. 15999"
                          value={editOneYearStrike}
                          onChange={(e) => setEditOneYearStrike(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-400 font-mono text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Live Store Operational Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditPlanStatus("Active")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      editPlanStatus === "Active"
                        ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Active (Store Live)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPlanStatus("Inactive")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      editPlanStatus === "Inactive"
                        ? "bg-red-950/80 border-red-600 text-red-300 shadow-sm"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Inactive (Service Suspended)
                  </button>
                </div>
              </div>

              {editPlanError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                  {editPlanError}
                </div>
              )}

              {editPlanMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{editPlanMessage}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editPlanLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition shadow-md"
                >
                  {editPlanLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Plan Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

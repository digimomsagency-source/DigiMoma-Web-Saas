import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderPlus,
  FileCode,
  FilePlus,
  Upload,
  RefreshCw,
  Trash2,
  Edit,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Save,
  X,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ArrowUp,
  Globe,
  HardDrive,
  Code,
} from "lucide-react";
import { Business, TenantFile } from "../types";

interface HostingFileManagerProps {
  selectedBusiness: Business | null;
  businesses: Business[];
  onSelectBusiness: (biz: Business) => void;
  getAuthHeaders: () => Record<string, string>;
  onDeleteBusinessTerminal: (bizId: string) => void;
}

export const HostingFileManager: React.FC<HostingFileManagerProps> = ({
  selectedBusiness,
  businesses,
  onSelectBusiness,
  getAuthHeaders,
  onDeleteBusinessTerminal,
}) => {
  const [files, setFiles] = useState<TenantFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentFolder, setCurrentFolder] = useState<string>(""); // "" = root public_html
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");

  const [isCreateFileOpen, setIsCreateFileOpen] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFileContent, setNewFileContent] = useState<string>("");

  const [isRenameOpen, setIsRenameOpen] = useState<boolean>(false);
  const [renameTarget, setRenameTarget] = useState<TenantFile | null>(null);
  const [renameNewName, setRenameNewName] = useState<string>("");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Editor
  const [editingFile, setEditingFile] = useState<TenantFile | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [isSavingCode, setIsSavingCode] = useState<boolean>(false);
  const [editorSuccess, setEditorSuccess] = useState<string | null>(null);

  // Image viewer
  const [viewingImage, setViewingImage] = useState<TenantFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async (bizId?: string) => {
    const id = bizId || selectedBusiness?.id;
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/cms/${id}/files`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load tenant files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBusiness) {
      setCurrentFolder("");
      setEditingFile(null);
      loadFiles(selectedBusiness.id);
    }
  }, [selectedBusiness?.id]);

  const liveWebLink = selectedBusiness
    ? `https://web.digimoms.in/${selectedBusiness.subdomain}`
    : "";

  const handleCopyLink = () => {
    if (!liveWebLink) return;
    navigator.clipboard.writeText(liveWebLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter items in the current virtual directory
  const currentItems = files.filter((f) => {
    const parent = f.parent_path || "";
    return parent.toLowerCase() === currentFolder.toLowerCase();
  });

  // Calculate stats
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !newFolderName.trim()) return;

    try {
      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/create-folder`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          folder_name: newFolderName.trim(),
          parent_path: currentFolder,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files);
        setIsCreateFolderOpen(false);
        setNewFolderName("");
      } else {
        alert(data.error || "Failed to create folder");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create folder");
    }
  };

  // Create File
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !newFileName.trim()) return;

    try {
      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/create-file`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          file_name: newFileName.trim(),
          parent_path: currentFolder,
          content: newFileContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files);
        setIsCreateFileOpen(false);
        setNewFileName("");
        setNewFileContent("");
      } else {
        alert(data.error || "Failed to create file");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create file");
    }
  };

  // Rename File or Folder
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !renameTarget || !renameNewName.trim()) return;

    try {
      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/rename`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          file_id: renameTarget.id,
          new_name: renameNewName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files);
        setIsRenameOpen(false);
        setRenameTarget(null);
        setRenameNewName("");
      } else {
        alert(data.error || "Failed to rename item");
      }
    } catch (err: any) {
      alert(err.message || "Failed to rename item");
    }
  };

  // Delete Item (File or Folder)
  const handleDeleteItem = async (item: TenantFile) => {
    if (!selectedBusiness) return;
    const confirmMsg = item.is_directory
      ? `Delete directory '${item.name}' and all files inside it?`
      : `Delete '${item.name}' from website storage?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/files/${item.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files);
        if (editingFile?.id === item.id) {
          setEditingFile(null);
        }
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  // Clear All Files
  const handleClearAllFiles = async () => {
    if (!selectedBusiness) return;
    if (!confirm(`Are you sure you want to empty the entire website file storage for '${selectedBusiness.name}'? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/clear-all`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles([]);
        setEditingFile(null);
        setCurrentFolder("");
        alert("Website storage emptied successfully.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to clear files");
    }
  };

  // Process and Upload Selected Files
  const processAndUploadFiles = async (fileList: FileList | File[]) => {
    if (!selectedBusiness || !fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadStatus(`Preparing ${fileList.length} item(s)...`);

    const uploadPayload: Array<{
      name: string;
      path: string;
      content: string;
      content_type: string;
      size: number;
      is_directory?: boolean;
    }> = [];

    const readFile = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const isImage = file.type.startsWith("image/");
        const isText =
          file.type.startsWith("text/") ||
          file.name.endsWith(".html") ||
          file.name.endsWith(".htm") ||
          file.name.endsWith(".css") ||
          file.name.endsWith(".js") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".svg") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".txt");

        const relativePath = (file as any).webkitRelativePath || file.name;
        const targetPath = currentFolder ? `${currentFolder}/${relativePath}` : relativePath;

        if (isImage && !file.name.endsWith(".svg")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadPayload.push({
              name: file.name,
              path: targetPath,
              content: (e.target?.result as string) || "",
              content_type: file.type || "image/png",
              size: file.size,
            });
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(file);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadPayload.push({
              name: file.name,
              path: targetPath,
              content: (e.target?.result as string) || "",
              content_type: file.type || (file.name.endsWith(".css") ? "text/css" : file.name.endsWith(".js") ? "application/javascript" : "text/html"),
              size: file.size,
            });
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsText(file);
        }
      });
    };

    try {
      const filesArray = Array.from(fileList);
      for (let i = 0; i < filesArray.length; i++) {
        setUploadStatus(`Reading (${i + 1}/${filesArray.length}): ${filesArray[i].name}...`);
        await readFile(filesArray[i]);
      }

      setUploadStatus(`Uploading ${uploadPayload.length} items to DigiMoms cloud storage...`);

      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/files/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ files: uploadPayload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files);
        setUploadStatus(null);
        setIsUploading(false);
        setIsUploadModalOpen(false);
      } else {
        alert(data.error || "Upload failed");
        setIsUploading(false);
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
      setIsUploading(false);
    }
  };

  // Save Code in Editor
  const handleSaveCode = async () => {
    if (!selectedBusiness || !editingFile) return;

    try {
      setIsSavingCode(true);
      const res = await fetch(`/api/admin/cms/${selectedBusiness.id}/files/${editingFile.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: editingContent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditorSuccess("File saved successfully!");
        setFiles((prev) =>
          prev.map((f) => (f.id === editingFile.id ? { ...f, content: editingContent, size: data.file.size } : f))
        );
        setTimeout(() => setEditorSuccess(null), 2500);
      } else {
        alert(data.error || "Failed to save file");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save file");
    } finally {
      setIsSavingCode(false);
    }
  };

  // Get file icon by extension
  const getFileIcon = (file: TenantFile) => {
    if (file.is_directory) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "html" || ext === "htm") {
      return <FileCode className="w-4 h-4 text-orange-400" />;
    }
    if (ext === "css") {
      return <Code className="w-4 h-4 text-blue-400" />;
    }
    if (ext === "js" || ext === "ts") {
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    }
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) {
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
    return <FileText className="w-4 h-4 text-neutral-400" />;
  };

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Top Header Card: Store Selector & Web Link */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <HardDrive className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Online Hosting File Manager</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                cPanel Style
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Permanent Storage Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Upload your website folders, HTML, CSS, JavaScript, and assets from scratch. Live website is served directly on your custom path link. All files are permanently saved on disk and database.
            </p>
          </div>

          {/* Business Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-neutral-400 whitespace-nowrap">Select Store:</label>
            <select
              value={selectedBusiness?.id || ""}
              onChange={(e) => {
                const b = businesses.find((item) => item.id === e.target.value);
                if (b) onSelectBusiness(b);
              }}
              className="px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-medium outline-none focus:border-blue-500"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (/{b.subdomain})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live URL & Path Routing Card */}
        {selectedBusiness && (
          <div className="mt-5 p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Live Public Web Link (Path-Based Routing)</span>
                <span className="text-[10px] text-neutral-400 normal-case bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  No GoDaddy DNS setup needed
                </span>
              </div>
              <div className="font-mono text-sm text-blue-400 font-bold flex items-center gap-2">
                <span>{liveWebLink}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>

              <a
                href={liveWebLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Website
              </a>

              <button
                type="button"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                  showLivePreview
                    ? "bg-purple-950 text-purple-200 border-purple-800"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> {showLivePreview ? "Hide Preview" : "Split Preview"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main File Manager Workspace */}
      {selectedBusiness && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Explorer Column (Left / Main) */}
          <div className={showLivePreview ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Files / Folder
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400" /> New Folder
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateFileOpen(true)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-blue-400" /> New File
                  </button>

                  <button
                    type="button"
                    onClick={() => loadFiles()}
                    disabled={loading}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs transition border border-neutral-700"
                    title="Reload directory"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-mono">
                    {files.length} items &bull; {formatSize(totalSize)}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    disabled={files.length === 0}
                    className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-950 border border-red-900/60 text-red-300 rounded-lg text-[11px] font-medium transition disabled:opacity-30"
                    title="Clear all files in storage"
                  >
                    Empty Storage
                  </button>
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300">
                <span className="text-neutral-500">Path:</span>
                <button
                  type="button"
                  onClick={() => setCurrentFolder("")}
                  className={`hover:text-blue-400 font-semibold ${!currentFolder ? "text-blue-400" : "text-neutral-400"}`}
                >
                  public_html
                </button>

                {currentFolder.split("/").filter(Boolean).map((part, idx, arr) => {
                  const pathUpTo = arr.slice(0, idx + 1).join("/");
                  const isLast = idx === arr.length - 1;
                  return (
                    <React.Fragment key={pathUpTo}>
                      <ChevronRight className="w-3 h-3 text-neutral-600" />
                      <button
                        type="button"
                        onClick={() => setCurrentFolder(pathUpTo)}
                        className={`hover:text-blue-400 ${isLast ? "text-blue-400 font-semibold" : "text-neutral-400"}`}
                      >
                        {part}
                      </button>
                    </React.Fragment>
                  );
                })}

                {currentFolder && (
                  <button
                    type="button"
                    onClick={() => {
                      const parts = currentFolder.split("/").filter(Boolean);
                      parts.pop();
                      setCurrentFolder(parts.join("/"));
                    }}
                    className="ml-auto flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                  >
                    <ArrowUp className="w-3 h-3" /> Up One Level
                  </button>
                )}
              </div>

              {/* Files / Directory Explorer Table */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider font-semibold border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Size</th>
                      <th className="px-3 py-2.5">Modified</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {/* Up one folder row if in subfolder */}
                    {currentFolder && (
                      <tr
                        onClick={() => {
                          const parts = currentFolder.split("/").filter(Boolean);
                          parts.pop();
                          setCurrentFolder(parts.join("/"));
                        }}
                        className="hover:bg-neutral-800/40 cursor-pointer text-neutral-400 font-mono transition"
                      >
                        <td colSpan={5} className="px-4 py-2 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-neutral-500" />
                          <span>.. (Parent Directory)</span>
                        </td>
                      </tr>
                    )}

                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto mb-3 text-neutral-600">
                            <Folder className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-semibold text-neutral-300">No files in this folder</p>
                          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                            Upload website files (such as <code>index.html</code>, style.css, images) to publish your site on{" "}
                            <code>web.digimoms.in/{selectedBusiness.subdomain}</code>
                          </p>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsUploadModalOpen(true)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                            >
                              Upload Website Files
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewFileName("index.html");
                                setNewFileContent(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${selectedBusiness.name}</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Welcome to ${selectedBusiness.name}</h1>
  <p>Website is live and running under web.digimoms.in/${selectedBusiness.subdomain}</p>
</body>
</html>`);
                                setIsCreateFileOpen(true);
                              }}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-700"
                            >
                              + Create index.html
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-neutral-800/40 transition group"
                        >
                          {/* Name */}
                          <td className="px-4 py-2.5">
                            <div
                              onClick={() => {
                                if (item.is_directory) {
                                  setCurrentFolder(item.path);
                                } else if (item.content_type?.startsWith("image/")) {
                                  setViewingImage(item);
                                } else {
                                  setEditingFile(item);
                                  setEditingContent(item.content || "");
                                }
                              }}
                              className="flex items-center gap-2.5 cursor-pointer"
                            >
                              {getFileIcon(item)}
                              <span
                                className={`font-mono text-xs truncate max-w-xs ${
                                  item.is_directory
                                    ? "text-white font-semibold hover:text-amber-300"
                                    : "text-neutral-200 hover:text-blue-400"
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-3 py-2.5 text-neutral-400 font-mono text-[11px]">
                            {item.is_directory ? "Directory" : item.content_type || "File"}
                          </td>

                          {/* Size */}
                          <td className="px-3 py-2.5 text-neutral-400 font-mono text-[11px]">
                            {item.is_directory ? "-" : formatSize(item.size)}
                          </td>

                          {/* Modified */}
                          <td className="px-3 py-2.5 text-neutral-500 font-mono text-[11px]">
                            {new Date(item.updated_at).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-2.5 text-right space-x-1">
                            {!item.is_directory && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.content_type?.startsWith("image/")) {
                                    setViewingImage(item);
                                  } else {
                                    setEditingFile(item);
                                    setEditingContent(item.content || "");
                                  }
                                }}
                                className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-blue-400 transition"
                                title={item.content_type?.startsWith("image/") ? "View image" : "Edit code"}
                              >
                                {item.content_type?.startsWith("image/") ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <Edit className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setRenameTarget(item);
                                setRenameNewName(item.name);
                                setIsRenameOpen(true);
                              }}
                              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-amber-400 transition"
                              title="Rename"
                            >
                              <Edit className="w-3 h-3 text-neutral-500 hover:text-amber-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Terminal Danger Zone */}
              <div className="mt-8 pt-4 border-t border-red-950/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Terminal Purge Store
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Wipes out all database records and storage bucket files for {selectedBusiness.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteBusinessTerminal(selectedBusiness.id)}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg text-xs font-semibold transition"
                >
                  Nuclear Delete
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Column (Right, if enabled) */}
          {showLivePreview && (
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col h-[700px]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Live Site Preview</span>
                  <span className="text-[10px] text-neutral-400 font-mono">/{selectedBusiness.subdomain}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLivePreview(false)}
                  className="text-neutral-400 hover:text-white text-lg leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 bg-white rounded-xl overflow-hidden border border-neutral-800 relative">
                <iframe
                  src={`/api/tenant/render/${selectedBusiness.subdomain}?t=${Date.now()}`}
                  title="Tenant Website Live Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Code Editor */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            {/* Editor Header */}
            <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{editingFile.path}</h3>
                  <p className="text-[11px] text-neutral-400">
                    {formatSize(Buffer.byteLength(editingContent, "utf8"))} &bull; {editingFile.content_type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editorSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {editorSuccess}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveCode}
                  disabled={isSavingCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingCode ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Textarea Editor */}
            <div className="flex-1 bg-neutral-950 p-4">
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-neutral-950 text-neutral-100 font-mono text-xs p-3 leading-relaxed outline-none resize-none border border-neutral-800 rounded-xl focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Image Viewer */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 max-w-2xl w-full rounded-2xl p-5 text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">{viewingImage.name}</h3>
                <p className="text-[11px] text-neutral-400">{formatSize(viewingImage.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="text-neutral-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden max-h-[60vh]">
              {viewingImage.content?.startsWith("data:") ? (
                <img
                  src={viewingImage.content}
                  alt={viewingImage.name}
                  className="max-h-[50vh] max-w-full object-contain rounded-lg"
                />
              ) : (
                <p className="text-xs text-neutral-500">Image preview not available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Upload Files / Folders */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 text-neutral-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Upload Website Files</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Target directory: <code className="text-blue-300 font-mono">public_html/{currentFolder}</code>
              <br />
              Select all files (HTML, CSS, JS, Images) or pick an entire website folder to upload.
            </p>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => {
                if (e.target.files) processAndUploadFiles(e.target.files);
              }}
              className="hidden"
            />
            <input
              type="file"
              ref={folderInputRef}
              {...({ webkitdirectory: "true", directory: "true" } as any)}
              onChange={(e) => {
                if (e.target.files) processAndUploadFiles(e.target.files);
              }}
              className="hidden"
            />

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  processAndUploadFiles(e.dataTransfer.files);
                }
              }}
              className="border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-2xl p-8 text-center space-y-3 bg-neutral-950/60 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Drag &amp; drop website files here</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Supports .html, .css, .js, .png, .jpg, etc.</p>
              </div>
            </div>

            {uploadStatus && (
              <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-400" /> Select Files
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => folderInputRef.current?.click()}
                className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" /> Upload Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Folder */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-sm rounded-2xl p-6 text-neutral-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-400" /> Create Directory
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Directory Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. css, js, images, assets"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create File */}
      {isCreateFileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 text-neutral-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-blue-400" /> Create New File
            </h3>
            <form onSubmit={handleCreateFile} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  File Name (e.g. index.html, style.css)
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="index.html"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Initial Content</label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="<!DOCTYPE html>..."
                  className="w-full h-32 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono text-xs resize-none outline-none focus:border-blue-500"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rename */}
      {isRenameOpen && renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-sm rounded-2xl p-6 text-neutral-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit className="w-4 h-4 text-amber-400" /> Rename {renameTarget.is_directory ? "Directory" : "File"}
            </h3>
            <form onSubmit={handleRename} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">New Name</label>
                <input
                  type="text"
                  value={renameNewName}
                  onChange={(e) => setRenameNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl"
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

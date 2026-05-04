import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  X, Plus, Trash2, Shield, Heart, Zap, Brain, Sparkles, 
  FolderPlus, ChevronRight, ChevronDown, Folder, MoreVertical,
  PlusCircle, Edit3, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";

const SYSTEM_GROUPS = [
  {
    name: "Физические сферы",
    icon: <Heart className="w-4 h-4 text-cyan-400" />,
    systems: ["1", "2"]
  },
  {
    name: "Эмоциональные сферы",
    icon: <Sparkles className="w-4 h-4 text-pink-400" />,
    systems: ["3", "4", "5"]
  },
  {
    name: "Духовные сферы",
    icon: <Zap className="w-4 h-4 text-purple-400" />,
    systems: ["6", "7"]
  },
  {
    name: "Ментальные сферы",
    icon: <Brain className="w-4 h-4 text-yellow-400" />,
    systems: ["8", "9", "10"]
  }
];

export default function IdentityPage() {
  const { 
    identityValues, identityValueFolders, 
    addIdentityValue, updateIdentityValue, deleteIdentityValue,
    addIdentityValueFolder, deleteIdentityValueFolder,
    identitySystems, identitySystemFolders, identitySystemIdeas,
    addIdentitySystemFolder, deleteIdentitySystemFolder,
    addIdentitySystemIdea, updateIdentitySystemIdea, deleteIdentitySystemIdea
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<"values" | "systems">("values");
  const [expandedAspect, setExpandedAspect] = useState<string | null>(null);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);

  // --- Values Logic ---
  const [newValueText, setNewValueText] = useState("");
  const [selectedValFolder, setSelectedValFolder] = useState<string | undefined>(undefined);
  const [showValFolderInput, setShowValFolderInput] = useState(false);
  const [newValFolderName, setNewValFolderName] = useState("");

  const handleAddValue = () => {
    if (newValueText.trim()) {
      addIdentityValue(newValueText.trim(), selectedValFolder);
      setNewValueText("");
    }
  };

  const handleAddValFolder = () => {
    if (newValFolderName.trim()) {
      addIdentityValueFolder(newValFolderName.trim());
      setNewValFolderName("");
      setShowValFolderInput(false);
    }
  };

  // --- Systems Logic ---
  const [newIdeaText, setNewIdeaText] = useState("");
  const [selectedSysFolder, setSelectedSysFolder] = useState<string | undefined>(undefined);
  const [showSysFolderInput, setShowSysFolderInput] = useState(false);
  const [newSysFolderName, setNewSysFolderName] = useState("");

  const handleAddIdea = (aspectId: string) => {
    if (newIdeaText.trim()) {
      addIdentitySystemIdea(aspectId, newIdeaText.trim(), selectedSysFolder);
      setNewIdeaText("");
    }
  };

  const handleAddSysFolder = (aspectId: string) => {
    if (newSysFolderName.trim()) {
      addIdentitySystemFolder(aspectId, newSysFolderName.trim());
      setNewSysFolderName("");
      setShowSysFolderInput(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-8 pb-12 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-purple-500/20 rounded-[24px] mb-6 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
          >
            <Shield className="w-10 h-10 text-purple-400" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Самоидентификация
          </h1>
          <p className="text-slate-400 text-lg max-w-lg font-medium leading-relaxed">
            Фундамент вашей личности: ценности, которыми вы дорожите, и системы убеждений, которые вас направляют.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Tabs */}
        <div className="flex p-1.5 bg-slate-900/50 backdrop-blur-xl rounded-[24px] border border-white/5 mb-10 shadow-xl">
          <button
            onClick={() => setActiveTab("values")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-black uppercase tracking-widest rounded-[18px] transition-all ${
              activeTab === "values" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Ценности
          </button>
          <button
            onClick={() => setActiveTab("systems")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-black uppercase tracking-widest rounded-[18px] transition-all ${
              activeTab === "systems" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Shield className="w-4 h-4" />
            Системы
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "values" ? (
            <motion.div
              key="values"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Values Folders */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedValFolder(undefined)}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                    selectedValFolder === undefined 
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400" 
                      : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Все
                </button>
                {identityValueFolders.map(folder => (
                  <div key={folder.id} className="relative group">
                    <button
                      onClick={() => setSelectedValFolder(folder.id)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all pr-8 ${
                        selectedValFolder === folder.id 
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-400" 
                          : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {folder.name}
                    </button>
                    <button 
                      onClick={() => deleteIdentityValueFolder(folder.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {showValFolderInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newValFolderName}
                      onChange={(e) => setNewValFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddValFolder()}
                      className="bg-slate-900 border border-purple-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-32"
                      placeholder="Название..."
                    />
                    <button onClick={handleAddValFolder} className="text-emerald-400 hover:text-emerald-300">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowValFolderInput(true)}
                    className="px-4 py-2 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all flex items-center gap-2 text-sm font-bold"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Новая папка
                  </button>
                )}
              </div>

              {/* Add Value Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newValueText}
                    onChange={(e) => setNewValueText(e.target.value)}
                    placeholder="Какая ваша ценность сегодня?"
                    onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-[20px] px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all shadow-inner"
                  />
                  {selectedValFolder && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <Folder className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">
                        {identityValueFolders.find(f => f.id === selectedValFolder)?.name}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddValue}
                  className="px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-[20px] transition-all shadow-lg active:scale-95 font-bold"
                >
                  Добавить
                </button>
              </div>

              {/* Values List */}
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {identityValues
                    .filter(v => !selectedValFolder || v.folderId === selectedValFolder)
                    .map((v) => (
                      <motion.div
                        key={v.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="group flex items-center gap-4 bg-slate-900/40 border border-white/5 p-5 rounded-[24px] hover:border-white/10 transition-all hover:bg-slate-900/60"
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        <input
                          type="text"
                          value={v.text}
                          onChange={(e) => updateIdentityValue(v.id, e.target.value)}
                          className="flex-1 bg-transparent border-none text-slate-200 focus:outline-none font-medium"
                        />
                        <button
                          onClick={() => deleteIdentityValue(v.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                </AnimatePresence>
                
                {identityValues.length === 0 && (
                  <div className="text-center py-20 bg-slate-900/20 rounded-[32px] border border-dashed border-white/5">
                    <p className="text-slate-500 text-sm italic">Мир ждет ваших ценностей...</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="systems"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {SYSTEM_GROUPS.map((group) => (
                <div key={group.name} className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    {group.icon}
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{group.name}</h3>
                  </div>
                  
                  <div className="grid gap-3">
                    {group.systems.map((id) => {
                      const aspect = identitySystems.find(s => s.id === id);
                      if (!aspect) return null;
                      const isExpanded = expandedAspect === id;
                      
                      return (
                        <div 
                          key={id} 
                          className={`rounded-[28px] border transition-all duration-300 overflow-hidden ${
                            isExpanded ? "bg-slate-900/60 border-white/10 shadow-2xl" : "bg-slate-900/30 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <button
                            onClick={() => {
                              setExpandedAspect(isExpanded ? null : id);
                              setSelectedSysFolder(undefined);
                            }}
                            className="w-full flex items-center justify-between p-5 text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-3 h-3 rounded-full shadow-lg" 
                                style={{ backgroundColor: aspect.color, boxShadow: `0 0 12px ${aspect.color}40` }} 
                              />
                              <span className="text-lg font-black text-slate-100 tracking-tight">{aspect.aspect}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                {identitySystemIdeas.filter(idea => idea.aspectId === id).length} идей
                              </span>
                              {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6"
                              >
                                {/* System Folders */}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => setSelectedSysFolder(undefined)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                      selectedSysFolder === undefined 
                                        ? "bg-white/10 border-white/20 text-white" 
                                        : "bg-slate-800/40 border-transparent text-slate-500 hover:text-slate-300"
                                    }`}
                                  >
                                    Все
                                  </button>
                                  {identitySystemFolders.filter(f => f.aspectId === id).map(folder => (
                                    <div key={folder.id} className="relative group">
                                      <button
                                        onClick={() => setSelectedSysFolder(folder.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all pr-7 ${
                                          selectedSysFolder === folder.id 
                                            ? "bg-white/10 border-white/20 text-white" 
                                            : "bg-slate-800/40 border-transparent text-slate-500 hover:text-slate-300"
                                        }`}
                                      >
                                        {folder.name}
                                      </button>
                                      <button 
                                        onClick={() => deleteIdentitySystemFolder(folder.id)}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {showSysFolderInput ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        autoFocus
                                        type="text"
                                        value={newSysFolderName}
                                        onChange={(e) => setNewSysFolderName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddSysFolder(id)}
                                        className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none w-24"
                                        placeholder="Имя..."
                                      />
                                      <button onClick={() => handleAddSysFolder(id)} className="text-emerald-400">
                                        <PlusCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowSysFolderInput(true)}
                                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-500 transition-all flex items-center gap-1.5"
                                    >
                                      <FolderPlus className="w-3 h-3" />
                                      Папка
                                    </button>
                                  )}
                                </div>

                                {/* Add Idea Input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newIdeaText}
                                    onChange={(e) => setNewIdeaText(e.target.value)}
                                    placeholder="Ваша новая идея или убеждение..."
                                    onKeyDown={(e) => e.key === "Enter" && handleAddIdea(id)}
                                    className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-white/10 transition-all"
                                  />
                                  <button
                                    onClick={() => handleAddIdea(id)}
                                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all active:scale-95"
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </div>

                                {/* Ideas List */}
                                <div className="space-y-2">
                                  <AnimatePresence mode="popLayout">
                                    {identitySystemIdeas
                                      .filter(idea => idea.aspectId === id && (!selectedSysFolder || idea.folderId === selectedSysFolder))
                                      .map((idea) => (
                                        <motion.div
                                          key={idea.id}
                                          layout
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 10 }}
                                          className="group flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 transition-all"
                                        >
                                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                                          <textarea
                                            value={idea.text}
                                            onChange={(e) => updateIdentitySystemIdea(idea.id, e.target.value)}
                                            rows={1}
                                            className="flex-1 bg-transparent border-none text-sm text-slate-300 focus:outline-none resize-none no-scrollbar h-auto py-0"
                                            style={{ height: 'auto' }}
                                            onInput={(e) => {
                                              const target = e.target as HTMLTextAreaElement;
                                              target.style.height = 'auto';
                                              target.style.height = target.scrollHeight + 'px';
                                            }}
                                          />
                                          <button
                                            onClick={() => deleteIdentitySystemIdea(idea.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </motion.div>
                                      ))}
                                  </AnimatePresence>
                                  {identitySystemIdeas.filter(idea => idea.aspectId === id).length === 0 && (
                                    <p className="text-center py-4 text-xs text-slate-600 italic">Нет идей в этом аспекте</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

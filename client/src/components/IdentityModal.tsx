import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { X, Plus, Trash2, Shield, Heart, Zap, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IdentityModalProps {
  onClose: () => void;
}

const SYSTEM_GROUPS = [
  {
    name: "Физические сферы",
    icon: <Heart className="w-4 h-4 text-cyan-400" />,
    systems: ["1", "2"] // IDs from DEFAULT_IDENTITY_SYSTEMS
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

export default function IdentityModal({ onClose }: IdentityModalProps) {
  const { 
    identityValues, 
    identitySystems, 
    addIdentityValue, 
    updateIdentityValue, 
    deleteIdentityValue, 
    updateIdentitySystem 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<"values" | "systems">("values");
  const [newValue, setNewValue] = useState("");

  const handleAddValue = () => {
    if (newValue.trim()) {
      addIdentityValue(newValue.trim());
      setNewValue("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-[32px] border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Самоидентификация</h2>
              <p className="text-xs text-slate-400 font-medium">Ваши ценности и системы убеждений</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-black/20 mx-6 mt-6 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("values")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "values" ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Ценности
          </button>
          <button
            onClick={() => setActiveTab("systems")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "systems" ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Системы
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {activeTab === "values" ? (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                <p className="text-xs text-blue-300 font-medium leading-relaxed">
                  Ценности — это то, как вы воспринимаете мир вокруг. Ваши фундаментальные принципы и ориентиры.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Добавить новую ценность..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button
                  onClick={handleAddValue}
                  className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {identityValues.map((v) => (
                    <motion.div
                      key={v.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all"
                    >
                      <input
                        type="text"
                        value={v.text}
                        onChange={(e) => updateIdentityValue(v.id, e.target.value)}
                        className="flex-1 bg-transparent border-none text-sm text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() => deleteIdentityValue(v.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {identityValues.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm italic">Список ценностей пока пуст</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                <p className="text-xs text-purple-300 font-medium leading-relaxed">
                  Системы — это ваши убеждения о себе в различных апектах жизни. Опишите свои стандарты и веру в себя.
                </p>
              </div>

              {SYSTEM_GROUPS.map((group) => (
                <div key={group.name} className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    {group.icon}
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{group.name}</h3>
                  </div>
                  <div className="grid gap-3">
                    {group.systems.map((id) => {
                      const system = identitySystems.find(s => s.id === id);
                      if (!system) return null;
                      return (
                        <div key={id} className="relative group">
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-full opacity-60"
                            style={{ backgroundColor: system.color }}
                          />
                          <div className="pl-4">
                            <label className="block text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-1.5 ml-1">
                              {system.aspect}
                            </label>
                            <textarea
                              value={system.belief}
                              onChange={(e) => updateIdentitySystem(id, e.target.value)}
                              placeholder={`Ваше убеждение о сфере "${system.aspect.toLowerCase()}"...`}
                              rows={2}
                              className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/10 transition-all resize-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Ваша личность определяет ваше будущее
          </p>
        </div>
      </motion.div>
    </div>
  );
}

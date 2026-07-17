import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  ExternalLink,
  FolderPlus,
  Heart,
  Link2,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { EmptyState, PageHeader, PageShell, SegmentedControl } from "@/components/AppUI";

const SYSTEM_GROUPS = [
  { name: "Тело", icon: Heart, systems: ["1", "2"] },
  { name: "Отношения", icon: Sparkles, systems: ["3", "4", "5"] },
  { name: "Внутренний мир", icon: Zap, systems: ["6", "7"] },
  { name: "Реализация", icon: Brain, systems: ["8", "9", "10"] },
];

function normalizeNotionUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^(https?:\/\/|notion:\/\/)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function IdentityPage() {
  const {
    identityValues,
    identityValueFolders,
    addIdentityValue,
    updateIdentityValue,
    deleteIdentityValue,
    addIdentityValueFolder,
    deleteIdentityValueFolder,
    identitySystems,
    updateIdentitySystem,
    identitySystemFolders,
    identitySystemIdeas,
    addIdentitySystemFolder,
    deleteIdentitySystemFolder,
    addIdentitySystemIdea,
    updateIdentitySystemIdea,
    deleteIdentitySystemIdea,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"values" | "systems">("values");
  const [selectedValueFolder, setSelectedValueFolder] = useState<string | undefined>();
  const [newValue, setNewValue] = useState("");
  const [newValueFolder, setNewValueFolder] = useState("");
  const [showValueFolderInput, setShowValueFolderInput] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [expandedSystemId, setExpandedSystemId] = useState<string | null>(null);
  const [editingNotionId, setEditingNotionId] = useState<string | null>(null);
  const [notionDraft, setNotionDraft] = useState("");
  const [newIdea, setNewIdea] = useState("");
  const [newSystemFolder, setNewSystemFolder] = useState("");
  const [showSystemFolderInput, setShowSystemFolderInput] = useState<string | null>(null);
  const [selectedSystemFolder, setSelectedSystemFolder] = useState<string | undefined>();
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    addIdentityValue(newValue.trim(), selectedValueFolder);
    setNewValue("");
  };

  const saveNotionUrl = (systemId: string) => {
    updateIdentitySystem(systemId, { notionUrl: normalizeNotionUrl(notionDraft) });
    setEditingNotionId(null);
    setNotionDraft("");
  };

  return (
    <PageShell className="identity-page">
      <PageHeader
        eyebrow="Личная опора"
        title="Моя идентичность"
        description="Ценности задают направление, а системы превращают его в понятные действия и связанные рабочие пространства Notion."
        actions={
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel="Раздел идентичности"
            items={[
              { value: "values", label: "Ценности", icon: Sparkles, count: identityValues.length },
              { value: "systems", label: "Системы", icon: Shield, count: identitySystems.length },
            ]}
          />
        }
      />

      <AnimatePresence mode="wait">
        {activeTab === "values" ? (
          <motion.section key="values" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="identity-content">
            <div className="identity-hero-card">
              <div className="identity-hero-icon"><Sparkles className="size-6" /></div>
              <div><strong>Ценности — ваш внутренний фильтр</strong><span>Соберите короткий список ориентиров, к которому легко возвращаться при выборе целей.</span></div>
            </div>

            <div className="identity-folder-row">
              <button type="button" className={`identity-filter ${selectedValueFolder === undefined ? "is-active" : ""}`} onClick={() => setSelectedValueFolder(undefined)}>Все</button>
              {identityValueFolders.map(folder => (
                <div key={folder.id} className="identity-filter-wrap">
                  <button type="button" className={`identity-filter ${selectedValueFolder === folder.id ? "is-active" : ""}`} onClick={() => setSelectedValueFolder(folder.id)}>{folder.name}</button>
                  <button type="button" className="identity-filter-delete" onClick={() => deleteIdentityValueFolder(folder.id)} aria-label={`Удалить ${folder.name}`}><X className="size-3" /></button>
                </div>
              ))}
              {showValueFolderInput ? (
                <div className="identity-inline-form">
                  <input autoFocus value={newValueFolder} onChange={event => setNewValueFolder(event.target.value)} onKeyDown={event => {
                    if (event.key === "Enter" && newValueFolder.trim()) { addIdentityValueFolder(newValueFolder.trim()); setNewValueFolder(""); setShowValueFolderInput(false); }
                  }} placeholder="Название папки" />
                  <button type="button" onClick={() => { if (newValueFolder.trim()) { addIdentityValueFolder(newValueFolder.trim()); setNewValueFolder(""); setShowValueFolderInput(false); } }}><Check className="size-4" /></button>
                </div>
              ) : <button type="button" className="identity-add-filter" onClick={() => setShowValueFolderInput(true)}><FolderPlus className="size-4" /> Новая папка</button>}
            </div>

            <div className="identity-add-row">
              <input value={newValue} onChange={event => setNewValue(event.target.value)} onKeyDown={event => event.key === "Enter" && handleAddValue()} placeholder="Например: говорить с собой с уважением" />
              <button type="button" className="app-button" onClick={handleAddValue}><Plus className="size-4" /> Добавить</button>
            </div>

            <div className="identity-values-grid">
              {identityValues.filter(value => selectedValueFolder === undefined || value.folderId === selectedValueFolder).map((value, index) => (
                <motion.article key={value.id} layout className="identity-value-card" style={{ "--value-accent": ["#315cff", "#7765f5", "#ff6b35", "#149c76"][index % 4] } as React.CSSProperties}>
                  <span className="identity-value-number">{String(index + 1).padStart(2, "0")}</span>
                  {editingValueId === value.id ? (
                    <input autoFocus defaultValue={value.text} onBlur={event => { updateIdentityValue(value.id, event.target.value.trim() || value.text); setEditingValueId(null); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
                  ) : <p>{value.text}</p>}
                  <div className="identity-card-actions">
                    <button type="button" onClick={() => setEditingValueId(value.id)} aria-label="Изменить"><Edit3 className="size-4" /></button>
                    <button type="button" onClick={() => deleteIdentityValue(value.id)} aria-label="Удалить"><Trash2 className="size-4" /></button>
                  </div>
                </motion.article>
              ))}
            </div>
            {!identityValues.length && <EmptyState title="Добавьте первую ценность" description="Пусть это будет короткая фраза, которая помогает принимать решения." />}
          </motion.section>
        ) : (
          <motion.section key="systems" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="identity-content">
            <div className="identity-hero-card is-notion">
              <div className="identity-hero-icon"><Link2 className="size-6" /></div>
              <div><strong>Свяжите каждую систему с Notion</strong><span>Вставьте ссылку на нужную страницу или базу. Она сохранится вместе с вашими данными и будет открываться из карточки системы.</span></div>
            </div>

            <div className="identity-system-groups">
              {SYSTEM_GROUPS.map(group => {
                const GroupIcon = group.icon;
                return (
                  <section key={group.name} className="identity-system-group">
                    <div className="identity-group-title"><GroupIcon className="size-4" /><span>{group.name}</span></div>
                    <div className="identity-systems-grid">
                      {group.systems.map(id => {
                        const system = identitySystems.find(item => item.id === id);
                        if (!system) return null;
                        const expanded = expandedSystemId === id;
                        const folders = identitySystemFolders.filter(folder => folder.aspectId === id);
                        const ideas = identitySystemIdeas.filter(idea => idea.aspectId === id && (!selectedSystemFolder || idea.folderId === selectedSystemFolder));
                        return (
                          <article key={id} className={`identity-system-card ${expanded ? "is-expanded" : ""}`} style={{ "--system-color": system.color } as React.CSSProperties}>
                            <div className="identity-system-head">
                              <button type="button" className="identity-system-toggle" onClick={() => { setExpandedSystemId(expanded ? null : id); setSelectedSystemFolder(undefined); }}>
                                <span className="identity-system-index">{id}</span>
                                <span className="identity-system-title"><strong>{system.aspect}</strong><small>{system.notionUrl ? "Notion подключён" : "Добавьте ссылку Notion"}</small></span>
                                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                              </button>
                              {system.notionUrl ? <a href={system.notionUrl} target="_blank" rel="noreferrer" className="identity-notion-open" aria-label={`Открыть ${system.aspect} в Notion`}><span>N</span><ExternalLink className="size-4" /></a> : <button type="button" className="identity-notion-open is-empty" onClick={() => { setEditingNotionId(id); setNotionDraft(""); }}><Link2 className="size-4" /></button>}
                            </div>

                            <AnimatePresence>
                              {expanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="identity-system-body">
                                  <div className="identity-notion-editor">
                                    <div><Link2 className="size-4" /><span>Страница системы в Notion</span></div>
                                    {editingNotionId === id ? (
                                      <div className="identity-notion-form">
                                        <input autoFocus value={notionDraft} onChange={event => setNotionDraft(event.target.value)} onKeyDown={event => event.key === "Enter" && saveNotionUrl(id)} placeholder="https://www.notion.so/..." />
                                        <button type="button" onClick={() => saveNotionUrl(id)}><Check className="size-4" /></button>
                                        <button type="button" onClick={() => setEditingNotionId(null)}><X className="size-4" /></button>
                                      </div>
                                    ) : (
                                      <div className="identity-notion-current">
                                        <span>{system.notionUrl ? "Ссылка сохранена" : "Ссылка ещё не добавлена"}</span>
                                        <button type="button" onClick={() => { setEditingNotionId(id); setNotionDraft(system.notionUrl || ""); }}><Edit3 className="size-4" /> {system.notionUrl ? "Изменить" : "Подключить"}</button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="identity-folder-row is-system">
                                    <button type="button" className={`identity-filter ${selectedSystemFolder === undefined ? "is-active" : ""}`} onClick={() => setSelectedSystemFolder(undefined)}>Все идеи</button>
                                    {folders.map(folder => <div key={folder.id} className="identity-filter-wrap"><button type="button" className={`identity-filter ${selectedSystemFolder === folder.id ? "is-active" : ""}`} onClick={() => setSelectedSystemFolder(folder.id)}>{folder.name}</button><button type="button" className="identity-filter-delete" onClick={() => deleteIdentitySystemFolder(folder.id)}><X className="size-3" /></button></div>)}
                                    {showSystemFolderInput === id ? <div className="identity-inline-form"><input autoFocus value={newSystemFolder} onChange={event => setNewSystemFolder(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && newSystemFolder.trim()) { addIdentitySystemFolder(id, newSystemFolder.trim()); setNewSystemFolder(""); setShowSystemFolderInput(null); } }} placeholder="Папка" /><button type="button" onClick={() => { if (newSystemFolder.trim()) { addIdentitySystemFolder(id, newSystemFolder.trim()); setNewSystemFolder(""); setShowSystemFolderInput(null); } }}><Check className="size-4" /></button></div> : <button type="button" className="identity-add-filter" onClick={() => setShowSystemFolderInput(id)}><FolderPlus className="size-4" /> Папка</button>}
                                  </div>

                                  <div className="identity-add-row is-compact">
                                    <input value={newIdea} onChange={event => setNewIdea(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && newIdea.trim()) { addIdentitySystemIdea(id, newIdea.trim(), selectedSystemFolder); setNewIdea(""); } }} placeholder="Новая идея или правило системы" />
                                    <button type="button" className="app-button" onClick={() => { if (newIdea.trim()) { addIdentitySystemIdea(id, newIdea.trim(), selectedSystemFolder); setNewIdea(""); } }}><Plus className="size-4" /></button>
                                  </div>

                                  <div className="identity-idea-list">
                                    {ideas.map(idea => <div key={idea.id} className="identity-idea"><span className="identity-idea-dot" />{editingIdeaId === idea.id ? <input autoFocus defaultValue={idea.text} onBlur={event => { updateIdentitySystemIdea(idea.id, event.target.value.trim() || idea.text); setEditingIdeaId(null); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <p>{idea.text}</p>}<button type="button" onClick={() => setEditingIdeaId(idea.id)}><Edit3 className="size-3.5" /></button><button type="button" onClick={() => deleteIdentitySystemIdea(idea.id)}><Trash2 className="size-3.5" /></button></div>)}
                                    {!ideas.length && <p className="identity-system-empty">Здесь пока нет правил или идей.</p>}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

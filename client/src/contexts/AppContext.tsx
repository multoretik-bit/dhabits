import React, { createContext, useContext, useState, useEffect } from "react";
import { storage, StorageData } from "@/lib/storage";
import { defaultShopItems } from "@/lib/defaultShopItems";
import { supabase } from "@/lib/supabase";
import { syncSave, syncLoad } from "@/lib/sync";
import { toast } from "sonner";

// Color palette for folders/goals/blocks
export const FOLDER_COLORS = [
  { name: "cyan", border: "#00d9ff", text: "#00d9ff", bg: "rgba(0, 217, 255, 0.1)" },
  { name: "blue", border: "#0066ff", text: "#0066ff", bg: "rgba(0, 102, 255, 0.1)" },
  { name: "purple", border: "#cc00ff", text: "#cc00ff", bg: "rgba(204, 0, 255, 0.1)" },
  { name: "green", border: "#00cc00", text: "#00cc00", bg: "rgba(0, 204, 0, 0.1)" },
  { name: "yellow", border: "#ffcc00", text: "#ffcc00", bg: "rgba(255, 204, 0, 0.1)" },
  { name: "red", border: "#ff0000", text: "#ff0000", bg: "rgba(255, 0, 0, 0.1)" },
  { name: "pink", border: "#ff00ff", text: "#ff00ff", bg: "rgba(255, 0, 255, 0.1)" },
  { name: "orange", border: "#ff6600", text: "#ff6600", bg: "rgba(255, 102, 0, 0.1)" },
];

export function getFolderColor(index: number) {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
}

// Helper to get today's date string in YYYY-MM-DD format
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  folder: string;
  daysOfWeek: number[];
  blockId: string;
  streak: number;
  coinsPerComplete: number;
  completedDates: Record<string, boolean>;
  completed?: boolean;
  lastCompletedDate?: string;
  initialStreak?: number;
  units: number;
  coinsPerUnit?: number;
  progressUnit?: string;
  unitsTracking: boolean;
  isOneTime?: boolean;
}

export interface HabitBlock {
  id: string;
  name: string;
  collapsed: boolean;
  habits: Habit[];
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  colorIndex?: number;
  color?: string;
  systemUrl?: string;
  daysOfWeek?: number[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  emoji: string;
  blockId?: string;
  daysOfWeek: number[]; // [] = every day
  specificDate?: string; // YYYY-MM-DD
  isAllDay: boolean;
  color: string;
  completedDates: Record<string, boolean>;
  coins?: number;
  isOneTime?: boolean;
  subtasks?: SubTask[];
}


export function getCurrentBlock(blocks: HabitBlock[], now: Date): HabitBlock | null {
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  return blocks.find((b) => {
    if (!b.startTime || !b.endTime) return false;
    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);
    return total >= sh * 60 + sm && total < eh * 60 + em;
  }) ?? null;
}

export function getNextBlock(blocks: HabitBlock[], now: Date): HabitBlock | null {
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  const upcoming = blocks
    .filter((b) => {
      if (!b.startTime) return false;
      const [sh, sm] = b.startTime.split(":").map(Number);
      return sh * 60 + sm > total;
    })
    .sort((a, b) => {
      const [ash, asm] = a.startTime!.split(":").map(Number);
      const [bsh, bsm] = b.startTime!.split(":").map(Number);
      return ash * 60 + asm - (bsh * 60 + bsm);
    });
  return upcoming[0] ?? null;
}

export interface HabitFolder {
  id: string;
  name: string;
  emoji?: string;
  color: string;
  collapsed: boolean;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  description: string;
  linkedHabits: string[];
  coins: number;
  streak: number;
  folder: string;
  completed: boolean;
  startValue: number;
  targetValue: number;
  currentValue: number;
  color: string;
  deadline?: string;
}

export interface GoalFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  collapsed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: "reward" | "clothing" | "background" | "vehicle" | "pets" | "character";
  folder: string;
  purchased: boolean;
  assetPath?: string;
  slot?: "head" | "body" | "hands" | "feet" | "accessory" | "background" | "vehicle" | "pet";
  createdAt: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "legacy";
  version?: string | number;
  description?: string;
}

export interface CharacterState {
  head?: string;
  body?: string;
  hands?: string;
  feet?: string;
  accessory?: string;
  background?: string;
  vehicle?: string;
  pet?: string;
}

export interface SnapshotEntry {
  id: string;
  startTime: number; // minutes from midnight
  duration: number;  // minutes
  label: string;
  color?: string;
  category?: string;
}

export interface ShopFolder {
  id: string;
  name: string;
  collapsed: boolean;
}

interface AppContextType {
  // ... existing ...
  wakeUpTimes: Record<string, string>;
  setWakeUpTime: (dateStr: string, timeStr: string) => void;
  daySnapshots: Record<string, SnapshotEntry[]>;
  addSnapshotEntry: (dateStr: string, entry: SnapshotEntry) => void;
  updateSnapshotEntry: (dateStr: string, id: string, updates: Partial<SnapshotEntry>) => void;
  deleteSnapshotEntry: (dateStr: string, id: string) => void;
  // ... existing fields ...
  customColors: string[];
  addCustomColor: (color: string) => void;
  removeCustomColor: (color: string) => void;
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  habits: Habit[];
  blocks: HabitBlock[];
  habitFolders: HabitFolder[];
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string, dateStr?: string) => void;
  isHabitCompletedToday: (habit: Habit) => boolean;
  moveHabit: (habitId: string, targetBlockId: string, targetIndex: number) => void;
  addBlock: (block: HabitBlock) => void;
  updateBlock: (id: string, block: Partial<HabitBlock>) => void;
  deleteBlock: (id: string) => void;
  toggleBlockCollapse: (id: string) => void;
  addHabitFolder: (folder: HabitFolder) => void;
  updateHabitFolder: (id: string, folder: Partial<HabitFolder>) => void;
  deleteHabitFolder: (id: string) => void;
  toggleHabitFolderCollapse: (id: string) => void;
  goals: Goal[];
  goalFolders: GoalFolder[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalFolder: (folder: GoalFolder) => void;
  updateGoalFolder: (id: string, folder: Partial<GoalFolder>) => void;
  deleteGoalFolder: (id: string) => void;
  toggleGoalFolderCollapse: (id: string) => void;
  shopItems: ShopItem[];
  shopFolders: ShopFolder[];
  characterState: CharacterState;
  addShopItem: (item: ShopItem) => void;
  updateShopItem: (id: string, item: Partial<ShopItem>) => void;
  deleteShopItem: (id: string) => void;
  purchaseItem: (id: string) => boolean;
  addShopFolder: (folder: ShopFolder) => void;
  deleteShopFolder: (id: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: keyof CharacterState) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<boolean>;
  addProgressToHabit: (habitId: string, amount: number) => void;
  resetProgressForHabit: (habitId: string) => void;
  addUnitsToHabit: (habitId: string, amount: number) => void;
  resetUnitsForHabit: (habitId: string) => void;
  moveHabitUp: (habitId: string) => void;
  moveHabitDown: (habitId: string) => void;
  moveHabitFolderUp: (folderId: string) => void;
  moveHabitFolderDown: (folderId: string) => void;
  moveGoalUp: (goalId: string) => void;
  moveGoalDown: (goalId: string) => void;
  moveGoalFolderUp: (folderId: string) => void;
  moveGoalFolderDown: (folderId: string) => void;
  moveBlockUp: (blockId: string) => void;
  moveBlockDown: (blockId: string) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, dateStr?: string) => void;
  isTaskCompletedToday: (task: Task) => boolean;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  isSyncing: boolean;
  isOnline: boolean;
  syncLogs: {time: string, event: string, status: 'success' | 'error' | 'pending'}[];
  syncWithCloud: () => Promise<void>;
  forceSyncFromCloud: () => Promise<void>;
  forcePushToCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function migrateHabit(habit: any): Habit {
  if (!habit.completedDates) {
    const completedDates: Record<string, boolean> = {};
    if (habit.completed === true && habit.lastCompletedDate) {
      completedDates[habit.lastCompletedDate] = true;
    }
    return { ...habit, completedDates, completed: undefined };
  }
  return habit as Habit;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(0);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [blocks, setBlocks] = useState<HabitBlock[]>([]);
  const [habitFolders, setHabitFolders] = useState<HabitFolder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalFolders, setGoalFolders] = useState<GoalFolder[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopFolders, setShopFolders] = useState<ShopFolder[]>([]);
  const [characterState, setCharacterState] = useState<CharacterState>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [syncLogs, setSyncLogs] = useState<{time: string, event: string, status: 'success' | 'error' | 'pending'}[]>([]);
  const [wakeUpTimes, setWakeUpTimes] = useState<Record<string, string>>({});
  const [daySnapshots, setDaySnapshots] = useState<Record<string, SnapshotEntry[]>>({});

  const logSyncEvent = (event: string, status: 'success' | 'error' | 'pending') => {
    setSyncLogs(prev => [{ time: new Date().toLocaleTimeString(), event, status }, ...prev].slice(0, 10));
  };
  
  // Refs for sync management
  const isInitialLoadRef = React.useRef(true);
  const isRemoteUpdateRef = React.useRef(false);
  const syncTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = React.useRef<string>(localStorage.getItem("dhabits_client_id") || Math.random().toString(36).substring(7));

  // State ref to avoid stale closures in sync calls
  const currentStateRef = React.useRef({
    coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, wakeUpTimes, daySnapshots
  });

  useEffect(() => {
    localStorage.setItem("dhabits_client_id", clientIdRef.current);
  }, []);

  useEffect(() => {
    currentStateRef.current = {
      coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, wakeUpTimes, daySnapshots
    };
  }, [coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, wakeUpTimes, daySnapshots]);

  useEffect(() => {
    const savedData = storage.getData();
    let folders = savedData.habitFolders || [];
    const generalFolder = folders.find((f: HabitFolder) => f.id === "general");
    if (!generalFolder) {
      folders = [{ id: "general", name: "Общие", color: "#94a3b8", collapsed: false } as HabitFolder, ...folders];
    }
    setCoins(savedData.coins || 0);
    const migratedHabits = (savedData.habits || []).map(migrateHabit);
    setHabits(migratedHabits);
    setBlocks(savedData.blocks || []);
    setHabitFolders(folders);

    let gFolders = savedData.goalFolders || [];
    if (!gFolders.find((f: any) => f.id === "general")) {
      gFolders = [{ id: "general", name: "Общие", emoji: "🏆", color: "#94a3b8", collapsed: false }, ...gFolders];
    }
    setGoals(savedData.goals || []);
    setGoalFolders(gFolders);
    const savedShopItems = savedData.shopItems || [];
    const savedIds = new Set(savedShopItems.map((i: ShopItem) => i.id));
    const newDefaults = defaultShopItems.filter((d: ShopItem) => !savedIds.has(d.id));
    setShopItems([...savedShopItems, ...newDefaults]);
    setShopFolders(savedData.shopFolders || []);
    setCharacterState(savedData.characterState || {});
    setTasks(savedData.tasks || []);
    setWakeUpTimes(savedData.wakeUpTimes || {});
    setDaySnapshots(savedData.daySnapshots || {});

    // Initial cloud sync and real-time subscription
    let activeChannel: any = null;

    const startSync = async () => {
      setIsSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Sync active for user:", session.user.id);
        
        // 1. Initial Load
        try {
          const remoteData = await syncLoad(session.user.id) as any;
          if (remoteData) {
            const localLastUpdated = savedData.lastUpdated || 0;
            const remoteLastUpdated = remoteData.lastUpdated || 0;
            const isLocalEmpty = !savedData.habits?.length && !savedData.tasks?.length && (savedData.coins || 0) === 0;
            
            if (isLocalEmpty || !localLastUpdated || (remoteLastUpdated && new Date(remoteLastUpdated) > new Date(localLastUpdated))) {
              console.log("Sync: Applying remote data (newer or local empty)");
              isRemoteUpdateRef.current = true;
              setCoins(remoteData.coins || 0);
              setHabits((remoteData.habits || []).map(migrateHabit));
              setBlocks(remoteData.blocks || []);
              setHabitFolders(remoteData.habitFolders || []);
              setGoals(remoteData.goals || []);
              setGoalFolders(remoteData.goalFolders || []);
              const remoteShopItems = remoteData.shopItems || [];
              const rsIds = new Set(remoteShopItems.map((i: ShopItem) => i.id));
              const rNewDefaults = defaultShopItems.filter((d: ShopItem) => !rsIds.has(d.id));
              setShopItems([...remoteShopItems, ...rNewDefaults]);
              
              setShopFolders(remoteData.shopFolders || []);
              setCharacterState({
                pet: undefined,
                background: undefined,
                vehicle: undefined,
                ...(remoteData.characterState || {})
              });
              setTasks(remoteData.tasks || []);
              setCustomColors(remoteData.customColors || []);
              setWakeUpTimes(remoteData.wakeUpTimes || {});
              setDaySnapshots(remoteData.daySnapshots || {});
              storage.saveData(remoteData);
              setTimeout(() => { isRemoteUpdateRef.current = false; }, 200);
            }
          }
        } catch (err) {
          console.error("Sync: Initial fetch failed", err);
        }

        // 2. Real-time Subscription
        activeChannel = supabase
          .channel(`user_data_${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_data',
              filter: `user_id=eq.${session.user.id}`
            },
            (payload: any) => {
              console.log("Sync: Event received from cloud:", payload.eventType);
              const newData = payload.new?.data;
              if (newData && newData.lastUpdated) {
                // 1. Ignore updates from THIS client
                if (String(newData.clientId) === String(clientIdRef.current)) {
                  console.log("Sync: Ignoring update from THIS device");
                  return;
                }
                
                // 2. Strict timestamp comparison
                const currentData = storage.getData();
                const remoteTime = new Date(newData.lastUpdated).getTime();
                const localTime = currentData.lastUpdated ? new Date(currentData.lastUpdated).getTime() : 0;
                
                if (remoteTime > localTime) {
                  console.log("Sync: Applying NEWER remote data (Remote:", newData.lastUpdated, "Local:", currentData.lastUpdated, ")");
                  isRemoteUpdateRef.current = true;
                  setCoins(newData.coins || 0);
                  setHabits((newData.habits || []).map(migrateHabit));
                  setBlocks(newData.blocks || []);
                  setHabitFolders(newData.habitFolders || []);
                  setGoals(newData.goals || []);
                  setGoalFolders(newData.goalFolders || []);
                  const pushShopItems = newData.shopItems || [];
                  const psIds = new Set(pushShopItems.map((i: ShopItem) => i.id));
                  const pNewDefaults = defaultShopItems.filter((d: ShopItem) => !psIds.has(d.id));
                  setShopItems([...pushShopItems, ...pNewDefaults]);

                  setShopFolders(newData.shopFolders || []);
                  setCharacterState({
                    pet: undefined,
                    background: undefined,
                    vehicle: undefined,
                    ...(newData.characterState || {})
                  });
                  setTasks(newData.tasks || []);
                  setCustomColors(newData.customColors || []);
                  setWakeUpTimes(newData.wakeUpTimes || {});
                  setDaySnapshots(newData.daySnapshots || {});
                  storage.saveData(newData);
                  setTimeout(() => { isRemoteUpdateRef.current = false; }, 500);
                } else {
                  console.log("Sync: Ignoring OLDER or SAME remote data (Remote:", newData.lastUpdated, "Local:", currentData.lastUpdated, ")");
                }
              }
            }
          )
          .subscribe((status: string) => {
            console.log("Sync: Channel status change:", status);
            setIsOnline(status === 'SUBSCRIBED');
          });
      }
      setIsSyncing(false);
      isInitialLoadRef.current = false;
    };

    startSync();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  // Centralized Sync Effect
  useEffect(() => {
    if (isInitialLoadRef.current || isRemoteUpdateRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(async () => {
      if (isRemoteUpdateRef.current) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // CRITICAL: Read the data directly from storage as the source of truth
      const data = storage.getData();
      if (!data || !data.lastUpdated) return;
      
      console.log("Sync: Sending auto-update to cloud (origin:", clientIdRef.current, ")");
      logSyncEvent("Авто-сохранение...", "pending");
      
      try {
        await syncSave(session.user.id, data);
        logSyncEvent("Сохранено в облаке", "success");
        setIsSyncing(false);
      } catch (err) {
        logSyncEvent("Ошибка сохранения: " + (err as any).message, "error");
        setIsSyncing(false);
      }
    }, 500); 

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, wakeUpTimes, daySnapshots]);

  // Handle mobile wake/focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("Sync: Window focused, checking sync...");
      syncWithCloud();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, []);

  const forcePushToCloud = async () => {
    setIsSyncing(true);
    logSyncEvent("Принудительная отправка...", "pending");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Пользователь не авторизован");
      
      const data: StorageData = {
        ...currentStateRef.current,
        clientId: clientIdRef.current,
        lastUpdated: new Date().toISOString(),
        character: {},
        progress: {},
        streaks: {},
        shop: [],
        folders: [],
        wakeUpTimes: currentStateRef.current.wakeUpTimes,
        daySnapshots: currentStateRef.current.daySnapshots,
      };
      
      storage.saveData(data);
      await syncSave(session.user.id, data);
      logSyncEvent("Данные успешно отправлены", "success");
      toast.success("Данные отправлены в облако!");
    } catch (err) {
      logSyncEvent("Ошибка отправки: " + (err as any).message, "error");
      toast.error("Ошибка при отправке данных в облако");
    } finally {
      setIsSyncing(false);
    }
  };

  const forceSyncFromCloud = async () => {
    setIsSyncing(true);
    logSyncEvent("Принудительная загрузка...", "pending");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Пользователь не авторизован");
      
      const remoteData = await syncLoad(session.user.id) as any;
      if (!remoteData) throw new Error("Данные в облаке не найдены");
      
      console.log("Force Sync: Overwriting local state with remote data");
      setCoins(remoteData.coins || 0);
      setHabits((remoteData.habits || []).map(migrateHabit));
      setBlocks(remoteData.blocks || []);
      setHabitFolders(remoteData.habitFolders || []);
      setGoals(remoteData.goals || []);
      setGoalFolders(remoteData.goalFolders || []);
      const fSyncShopItems = remoteData.shopItems || [];
      const fsIds = new Set(fSyncShopItems.map((i: ShopItem) => i.id));
      const fNewDefaults = defaultShopItems.filter((d: ShopItem) => !fsIds.has(d.id));
      setShopItems([...fSyncShopItems, ...fNewDefaults]);

      setShopFolders(remoteData.shopFolders || []);
      setCharacterState({
        pet: undefined,
        background: undefined,
        vehicle: undefined,
        ...(remoteData.characterState || {})
      });
      setTasks(remoteData.tasks || []);
      setCustomColors(remoteData.customColors || []);
      setWakeUpTimes(remoteData.wakeUpTimes || {});
      setDaySnapshots(remoteData.daySnapshots || {});
      storage.saveData(remoteData);
      
      logSyncEvent("Данные загружены из облака", "success");
      toast.success("Данные успешно загружены из облака!");
    } catch (err: any) {
      logSyncEvent("Ошибка загрузки: " + err.message, "error");
      console.error("Force Sync Error:", err);
      toast.error(`Ошибка принудительной синхронизации: ${err.message}`);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const isHabitCompletedToday = (habit: Habit): boolean => {
    const today = getTodayDateString();
    return !!(habit.completedDates && habit.completedDates[today]);
  };

  const saveAllData = (
    coinsValue: number,
    habitsValue: Habit[],
    blocksValue: HabitBlock[],
    habitFoldersValue: HabitFolder[],
    goalsValue: Goal[],
    goalFoldersValue: GoalFolder[],
    shopItemsValue: ShopItem[],
    shopFoldersValue: ShopFolder[],
    characterStateValue: CharacterState,
    tasksValue: Task[],
    customColorsValue: string[],
    wakeUpTimesValue?: Record<string, string>,
    daySnapshotsValue?: Record<string, SnapshotEntry[]>
  ) => {
    const data: StorageData = {
      coins: coinsValue,
      habits: habitsValue,
      blocks: blocksValue,
      habitFolders: habitFoldersValue,
      goals: goalsValue,
      goalFolders: goalFoldersValue,
      shopItems: shopItemsValue,
      shopFolders: shopFoldersValue,
      character: {},
      characterState: characterStateValue,
      tasks: tasksValue,
      customColors: customColorsValue,
      wakeUpTimes: wakeUpTimesValue || wakeUpTimes,
      daySnapshots: daySnapshotsValue || daySnapshots,
      progress: {},
      streaks: {},
      shop: [],
      folders: [],
      lastUpdated: new Date().toISOString(),
      clientId: clientIdRef.current,
    };
    storage.saveData(data);
  };

  const syncWithCloud = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const remoteData = await syncLoad(session.user.id) as any;
      if (remoteData) {
        console.log("Sync: Manual fetch success, updating local state");
        isRemoteUpdateRef.current = true;
        setCoins(remoteData.coins || 0);
        setHabits((remoteData.habits || []).map(migrateHabit));
        setBlocks(remoteData.blocks || []);
        setHabitFolders(remoteData.habitFolders || []);
        setGoals(remoteData.goals || []);
        setGoalFolders(remoteData.goalFolders || []);
        setShopItems(remoteData.shopItems || []);
        setShopFolders(remoteData.shopFolders || []);
        setCharacterState(remoteData.characterState || {});
        setTasks(remoteData.tasks || []);
        setCustomColors(remoteData.customColors || []);
        setWakeUpTimes(remoteData.wakeUpTimes || {});
        setDaySnapshots(remoteData.daySnapshots || {});
        storage.saveData(remoteData);
        setTimeout(() => { isRemoteUpdateRef.current = false; }, 500);
      }
    } catch (err) {
      console.error("Manual sync failed", err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const addCoins = (amount: number) => {
    const newCoins = Math.round((coins + amount) * 100) / 100;
    setCoins(newCoins);
    saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const spendCoins = (amount: number): boolean => {
    if (coins < amount) return false;
    const newCoins = Math.round((coins - amount) * 100) / 100;
    setCoins(newCoins);
    saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    return true;
  };

  const addHabit = (habit: Habit) => {
    const newHabits = [...habits, habit];
    setHabits(newHabits);
    saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    const newHabits = habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
    setHabits(newHabits);
    saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const deleteHabit = (id: string) => {
    const newHabits = habits.filter((h) => h.id !== id);
    const newBlocks = blocks.map((b) => ({ ...b, habits: b.habits.filter((h) => h.id !== id) }));
    setHabits(newHabits);
    setBlocks(newBlocks);
    saveAllData(coins, newHabits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const completeHabit = (id: string, dateStr?: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const targetDate = dateStr || getTodayDateString();
    const isCompletedOnDate = !!(habit.completedDates && habit.completedDates[targetDate]);
    if (!isCompletedOnDate) {
      const newCompletedDates = { ...(habit.completedDates || {}), [targetDate]: true };
      const newStreak = habit.streak + 1;
      const newCoins = Math.round((coins + habit.coinsPerComplete) * 100) / 100;
      if (habit.isOneTime) {
        deleteHabit(id);
      } else {
        const newHabits = habits.map((h) =>
          h.id === id ? { ...h, completedDates: newCompletedDates, streak: newStreak, lastCompletedDate: targetDate } : h
        );
        setHabits(newHabits);
        setCoins(newCoins);
        saveAllData(newCoins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
      }
    } else {
      const newCompletedDates = { ...(habit.completedDates || {}) };
      delete newCompletedDates[targetDate];
      const newStreak = Math.max(0, habit.streak - 1);
      const newCoins = Math.round((coins - habit.coinsPerComplete) * 100) / 100;
      const newHabits = habits.map((h) =>
        h.id === id ? { ...h, completedDates: newCompletedDates, streak: newStreak } : h
      );
      setHabits(newHabits);
      setCoins(newCoins);
      saveAllData(newCoins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveHabit = (habitId: string, targetBlockId: string, targetIndex: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const updatedHabits = habits.map((h) => (h.id === habitId ? { ...h, blockId: targetBlockId } : h));
    const newBlocks = blocks.map((block) => {
      let newHabits = block.habits.filter((h) => h.id !== habitId);
      if (block.id === targetBlockId) {
        const updatedHabit = updatedHabits.find((h) => h.id === habitId);
        if (updatedHabit) newHabits.splice(targetIndex, 0, updatedHabit);
      }
      return { ...block, habits: newHabits };
    });
    setHabits(updatedHabits);
    setBlocks(newBlocks);
    saveAllData(coins, updatedHabits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const addBlock = (block: HabitBlock) => {
    const newBlocks = [...blocks, block];
    setBlocks(newBlocks);
    saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const addCustomColor = (color: string) => {
    if (!customColors.includes(color)) {
      const newColors = [...customColors, color];
      setCustomColors(newColors);
      saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, newColors);
    }
  };

  const removeCustomColor = (color: string) => {
    const newColors = customColors.filter(c => c !== color);
    setCustomColors(newColors);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, newColors);
  };

  const updateBlock = (id: string, updates: Partial<HabitBlock>) => {
    const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBlocks(newBlocks);
    saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const toggleBlockCollapse = (id: string) => {
    updateBlock(id, { collapsed: !blocks.find((b) => b.id === id)?.collapsed });
  };

  const addHabitFolder = (folder: HabitFolder) => {
    const newFolders = [...habitFolders, folder];
    setHabitFolders(newFolders);
    saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const updateHabitFolder = (id: string, updates: Partial<HabitFolder>) => {
    const newFolders = habitFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setHabitFolders(newFolders);
    saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const deleteHabitFolder = (id: string) => {
    const newFolders = habitFolders.filter((f) => f.id !== id);
    setHabitFolders(newFolders);
    saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const toggleHabitFolderCollapse = (id: string) => {
    updateHabitFolder(id, { collapsed: !habitFolders.find((f) => f.id === id)?.collapsed });
  };

  const addGoal = (goal: Goal) => {
    const newGoals = [...goals, goal];
    setGoals(newGoals);
    saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const newGoals = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    setGoals(newGoals);
    saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const deleteGoal = (id: string) => {
    const newGoals = goals.filter((g) => g.id !== id);
    setGoals(newGoals);
    saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const addGoalFolder = (folder: GoalFolder) => {
    const newFolders = [...goalFolders, folder];
    setGoalFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const updateGoalFolder = (id: string, updates: Partial<GoalFolder>) => {
    const newFolders = goalFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setGoalFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const deleteGoalFolder = (id: string) => {
    const newFolders = goalFolders.filter((f) => f.id !== id);
    setGoalFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks, customColors);
  };

  const toggleGoalFolderCollapse = (id: string) => {
    updateGoalFolder(id, { collapsed: !goalFolders.find((f) => f.id === id)?.collapsed });
  };

  const addShopItem = (item: ShopItem) => {
    const newItems = [...shopItems, item];
    setShopItems(newItems);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks, customColors);
  };

  const updateShopItem = (id: string, updates: Partial<ShopItem>) => {
    const newItems = shopItems.map((i) => (i.id === id ? { ...i, ...updates } : i));
    setShopItems(newItems);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks, customColors);
  };

  const deleteShopItem = (id: string) => {
    const newItems = shopItems.filter((i) => i.id !== id);
    setShopItems(newItems);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks, customColors);
  };

  const purchaseItem = (id: string): boolean => {
    const item = shopItems.find((i) => i.id === id);
    if (!item || item.purchased || coins < item.price) return false;
    const newCoins = Math.round((coins - item.price) * 100) / 100;
    const newItems = shopItems.map((i) => (i.id === id ? { ...i, purchased: true } : i));
    setCoins(newCoins);
    setShopItems(newItems);
    saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks, customColors);
    return true;
  };

  const addShopFolder = (folder: ShopFolder) => {
    const newFolders = [...shopFolders, folder];
    setShopFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, newFolders, characterState, tasks, customColors);
  };

  const deleteShopFolder = (id: string) => {
    const newFolders = shopFolders.filter((f) => f.id !== id);
    setShopFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, newFolders, characterState, tasks, customColors);
  };

  const equipItem = (itemId: string) => {
    const item = shopItems.find((i) => i.id === itemId);
    if (!item || !item.slot) return;
    const newCharacterState = { ...characterState, [item.slot]: itemId };
    setCharacterState(newCharacterState);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, newCharacterState, tasks, customColors);
  };

  const unequipItem = (slot: keyof CharacterState) => {
    const newCharacterState = { ...characterState };
    delete newCharacterState[slot];
    setCharacterState(newCharacterState);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, newCharacterState, tasks, customColors);
  };

  const exportBackup = () => {
    const blob = storage.exportBackup();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dhabits_backup_${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addUnitsToHabit = (habitId: string, amount: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit && amount > 0) {
      const newUnits = habit.units + amount;
      const coinsEarned = (habit.coinsPerUnit || 0) * amount;
      
      const newHabits = habits.map((h) => (h.id === habitId ? { ...h, units: newUnits, unitsTracking: true } : h));
      const newCoins = Math.round((coins + coinsEarned) * 100) / 100;
      
      setHabits(newHabits);
      setCoins(newCoins);
      saveAllData(newCoins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const resetUnitsForHabit = (habitId: string) => {
    updateHabit(habitId, { units: 0 });
  };

  const addProgressToHabit = addUnitsToHabit;
  const resetProgressForHabit = resetUnitsForHabit;

  const importBackup = async (file: File): Promise<boolean> => {
    setIsSyncing(true);
    logSyncEvent("Импорт бэкапа...", "pending");
    const success = await storage.importBackup(file);
    if (success) {
      const savedData = storage.getData();
      isRemoteUpdateRef.current = true;
      try {
        setCoins(savedData.coins || 0);
        setHabits((savedData.habits || []).map(migrateHabit));
        setBlocks(savedData.blocks || []);
        setHabitFolders(savedData.habitFolders || []);
        setGoals(savedData.goals || []);
        setGoalFolders(savedData.goalFolders || []);
        setShopItems(savedData.shopItems || []);
        setShopFolders(savedData.shopFolders || []);
        setCharacterState(savedData.characterState || {});
        setTasks(savedData.tasks || []);
        setCustomColors(savedData.customColors || []);
        
        const finalData: StorageData = {
          ...savedData,
          lastUpdated: new Date().toISOString(),
          clientId: clientIdRef.current
        };
        storage.saveData(finalData);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncSave(session.user.id, finalData);
          logSyncEvent("Бэкап успешно применен", "success");
          toast.success("Бэкап импортирован и сохранен в облаке!");
        } else {
          logSyncEvent("Бэкап применен локально", "success");
          toast.success("Бэкап импортирован локально");
        }
      } catch (err: any) {
        logSyncEvent("Ошибка импорта: " + err.message, "error");
        toast.error("Ошибка при импорте: " + err.message);
      } finally {
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 500);
      }
    } else {
      logSyncEvent("Ошибка чтения файла", "error");
      toast.error("Не удалось прочитать файл бэкапа");
    }
    setIsSyncing(false);
    return success;
  };

  const isTaskCompletedToday = (task: Task): boolean => {
    const today = getTodayDateString();
    return !!(task.completedDates && task.completedDates[today]);
  };

  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const newTasks = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter((t) => t.id !== id);
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
  };

  const completeTask = (id: string, dateStr?: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const targetDate = dateStr || getTodayDateString();
    const isCompleted = !!(task.completedDates && task.completedDates[targetDate]);

    if (!isCompleted && task.isOneTime) {
      if (task.coins && task.coins > 0) {
        addCoins(task.coins);
      }
      deleteTask(id);
      return;
    }

    const newCompletedDates = { ...task.completedDates };
    let coinsChange = 0;
    if (isCompleted) {
      delete newCompletedDates[targetDate];
      coinsChange = -(task.coins || 0);
    } else {
      newCompletedDates[targetDate] = true;
      coinsChange = task.coins || 0;
    }

    const newTasks = tasks.map((t) => (t.id === id ? { ...t, completedDates: newCompletedDates } : t));
    
    if (coinsChange !== 0) {
      const newCoins = Math.round((coins + coinsChange) * 100) / 100;
      setCoins(newCoins);
      setTasks(newTasks);
      saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
    } else {
      setTasks(newTasks);
      saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
    }
  };

  const moveTaskUp = (taskId: string) => {
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx > 0) {
      const newTasks = [...tasks];
      [newTasks[idx], newTasks[idx - 1]] = [newTasks[idx - 1], newTasks[idx]];
      setTasks(newTasks);
      saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
    }
  };

  const moveTaskDown = (taskId: string) => {
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx < tasks.length - 1) {
      const newTasks = [...tasks];
      [newTasks[idx], newTasks[idx + 1]] = [newTasks[idx + 1], newTasks[idx]];
      setTasks(newTasks);
      saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const newTasks = tasks.map((t) => {
      if (t.id === taskId && t.subtasks) {
        const newSubtasks = t.subtasks.map((st) => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: newSubtasks };
      }
      return t;
    });
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks, customColors);
  };

  const moveHabitUp = (habitId: string) => {
    const idx = habits.findIndex((h) => h.id === habitId);
    if (idx > 0) {
      const newHabits = [...habits];
      [newHabits[idx], newHabits[idx - 1]] = [newHabits[idx - 1], newHabits[idx]];
      setHabits(newHabits);
      saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveHabitDown = (habitId: string) => {
    const idx = habits.findIndex((h) => h.id === habitId);
    if (idx < habits.length - 1) {
      const newHabits = [...habits];
      [newHabits[idx], newHabits[idx + 1]] = [newHabits[idx + 1], newHabits[idx]];
      setHabits(newHabits);
      saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveHabitFolderUp = (folderId: string) => {
    const idx = habitFolders.findIndex((f) => f.id === folderId);
    if (idx > 0) {
      const newFolders = [...habitFolders];
      [newFolders[idx], newFolders[idx - 1]] = [newFolders[idx - 1], newFolders[idx]];
      setHabitFolders(newFolders);
      saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveHabitFolderDown = (folderId: string) => {
    const idx = habitFolders.findIndex((f) => f.id === folderId);
    if (idx < habitFolders.length - 1) {
      const newFolders = [...habitFolders];
      [newFolders[idx], newFolders[idx + 1]] = [newFolders[idx + 1], newFolders[idx]];
      setHabitFolders(newFolders);
      saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveGoalUp = (goalId: string) => {
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx > 0) {
      const newGoals = [...goals];
      [newGoals[idx], newGoals[idx - 1]] = [newGoals[idx - 1], newGoals[idx]];
      setGoals(newGoals);
      saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveGoalDown = (goalId: string) => {
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx < goals.length - 1) {
      const newGoals = [...goals];
      [newGoals[idx], newGoals[idx + 1]] = [newGoals[idx + 1], newGoals[idx]];
      setGoals(newGoals);
      saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveGoalFolderUp = (folderId: string) => {
    const idx = goalFolders.findIndex((f) => f.id === folderId);
    if (idx > 0) {
      const newFolders = [...goalFolders];
      [newFolders[idx], newFolders[idx - 1]] = [newFolders[idx - 1], newFolders[idx]];
      setGoalFolders(newFolders);
      saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveGoalFolderDown = (folderId: string) => {
    const idx = goalFolders.findIndex((f) => f.id === folderId);
    if (idx < goalFolders.length - 1) {
      const newFolders = [...goalFolders];
      [newFolders[idx], newFolders[idx + 1]] = [newFolders[idx + 1], newFolders[idx]];
      setGoalFolders(newFolders);
      saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveBlockUp = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx > 0) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
      setBlocks(newBlocks);
      saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const moveBlockDown = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
      setBlocks(newBlocks);
      saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors);
    }
  };

  const setWakeUpTime = (dateStr: string, timeStr: string) => {
    const newTimes = { ...wakeUpTimes, [dateStr]: timeStr };
    setWakeUpTimes(newTimes);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, newTimes);
  };

  const addSnapshotEntry = (dateStr: string, entry: SnapshotEntry) => {
    const dayEntries = daySnapshots[dateStr] || [];
    const newEntries = [...dayEntries, entry].sort((a, b) => a.startTime - b.startTime);
    const newSnapshots = { ...daySnapshots, [dateStr]: newEntries };
    setDaySnapshots(newSnapshots);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, wakeUpTimes, newSnapshots);
  };

  const updateSnapshotEntry = (dateStr: string, id: string, updates: Partial<SnapshotEntry>) => {
    const dayEntries = daySnapshots[dateStr] || [];
    const newEntries = dayEntries.map(e => e.id === id ? { ...e, ...updates } : e).sort((a, b) => a.startTime - b.startTime);
    const newSnapshots = { ...daySnapshots, [dateStr]: newEntries };
    setDaySnapshots(newSnapshots);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, wakeUpTimes, newSnapshots);
  };

  const deleteSnapshotEntry = (dateStr: string, id: string) => {
    const dayEntries = daySnapshots[dateStr] || [];
    const newEntries = dayEntries.filter(e => e.id !== id);
    const newSnapshots = { ...daySnapshots, [dateStr]: newEntries };
    setDaySnapshots(newSnapshots);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks, customColors, wakeUpTimes, newSnapshots);
  };

  return (
    <AppContext.Provider
      value={{
        coins,
        addCoins,
        spendCoins,
        habits,
        blocks,
        habitFolders,
        addHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        isHabitCompletedToday,
        moveHabit,
        addBlock,
        updateBlock,
        deleteBlock,
        toggleBlockCollapse,
        addHabitFolder,
        updateHabitFolder,
        deleteHabitFolder,
        toggleHabitFolderCollapse,
        goals,
        goalFolders,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalFolder,
        updateGoalFolder,
        deleteGoalFolder,
        toggleGoalFolderCollapse,
        shopItems,
        shopFolders,
        addShopItem,
        updateShopItem,
        deleteShopItem,
        purchaseItem,
        addShopFolder,
        deleteShopFolder,
        exportBackup,
        importBackup,
        addProgressToHabit,
        resetProgressForHabit,
        addUnitsToHabit,
        resetUnitsForHabit,
        characterState,
        equipItem,
        unequipItem,
        moveHabitUp,
        moveHabitDown,
        moveHabitFolderUp,
        moveHabitFolderDown,
        moveGoalUp,
        moveGoalDown,
        moveGoalFolderUp,
        moveGoalFolderDown,
        moveBlockUp,
        moveBlockDown,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        isTaskCompletedToday,
        moveTaskUp,
        moveTaskDown,
        toggleSubtask,
        isSyncing,
        syncWithCloud,
        forceSyncFromCloud,
        forcePushToCloud,
        isOnline,
        syncLogs,
        customColors,
        addCustomColor,
        removeCustomColor,
        wakeUpTimes,
        setWakeUpTime,
        daySnapshots,
        addSnapshotEntry,
        updateSnapshotEntry,
        deleteSnapshotEntry
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

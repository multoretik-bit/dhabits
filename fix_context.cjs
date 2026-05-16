const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/contexts/AppContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add updateStorage
if (!content.includes('const updateStorage =')) {
  const saveAllDataIndex = content.indexOf('  const saveAllData = (');
  const updateStorageCode = `  const updateStorage = (updates: Partial<StorageData>) => {
    const data = storage.getData();
    const newData = { ...data, ...updates, lastUpdated: new Date().toISOString(), clientId: clientIdRef.current };
    storage.saveData(newData);
  };

`;
  content = content.slice(0, saveAllDataIndex) + updateStorageCode + content.slice(saveAllDataIndex);
}

// 2. We don't necessarily need to replace ALL saveAllData, just the buggy ones.
// But wait, the prompt says "при удалении задач она не удаляется в supabase и возвращается назад".
// Why did the task return?
// If we look at deleteTask:
content = content.replace(
  /  const deleteTask = \(id: string\) => \{[\s\S]*?saveAllData\([\s\S]*?\);[\s\S]*?\};/m,
  `  const deleteTask = (id: string) => {
    const newTasks = tasks.filter((t) => t.id !== id);
    setTasks(newTasks);
    updateStorage({ tasks: newTasks });
  };`
);

// Fix addCoins
content = content.replace(
  /  const addCoins = \(amount: number\) => \{[\s\S]*?saveAllData\([\s\S]*?\);[\s\S]*?\};/m,
  `  const addCoins = (amount: number) => {
    const newCoins = Math.round((coins + amount) * 100) / 100;
    setCoins(newCoins);
    updateStorage({ coins: newCoins });
  };`
);

// Fix spendCoins
content = content.replace(
  /  const spendCoins = \(amount: number\): boolean => \{[\s\S]*?saveAllData\([\s\S]*?\);[\s\S]*?\};/m,
  `  const spendCoins = (amount: number): boolean => {
    if (coins < amount) return false;
    const newCoins = Math.round((coins - amount) * 100) / 100;
    setCoins(newCoins);
    updateStorage({ coins: newCoins });
    return true;
  };`
);

// Fix completeTask
content = content.replace(
  /      if \(task.coins && task.coins > 0\) \{\n        addCoins\(task.coins\);\n      \}\n      deleteTask\(id\);\n      return;/g,
  `      const newTasks = tasks.filter(t => t.id !== id);
      setTasks(newTasks);
      if (task.coins && task.coins > 0) {
        const newCoins = Math.round((coins + task.coins) * 100) / 100;
        setCoins(newCoins);
        updateStorage({ tasks: newTasks, coins: newCoins });
      } else {
        updateStorage({ tasks: newTasks });
      }
      return;`
);

fs.writeFileSync(file, content);
console.log('Fixed AppContext.tsx!');

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}

export default function EmojiPicker({ value, onChange, label }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const emojis = [
    "🎯", "🎪", "🎨", "🎭", "🎬", "🎤", "🎧", "🎮", "🎲", "🎳",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
    "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑",
    "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕",
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎳",
    "🏓", "🏸", "🥊", "🥋", "🚴", "🏃", "🤸", "🏋️", "🤾", "⛹️",
    "✈️", "🚀", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈",
    "💎", "💍", "👑", "🎁", "🎀", "🎈", "🎉", "🎊", "🎂", "🎓",
    "📚", "📖", "📝", "📄", "📃", "📑", "📊", "📈", "📉", "📋",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "⭐", "🌟",
    "✨", "⚡", "🔥", "💥", "🌈", "☀️", "🌙", "⭐", "🌠", "💫",
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
    "🫰", "🤟", "🤘", "🤙", "👍", "👎", "✊", "👊", "🤛", "🤜",
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
    "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
    "🥲", "😋", "😛", "😜", "🤪", "😌", "😔", "😑", "🤐", "🤨",
    "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂",
    "🍃", "🌺", "🌻", "🌹", "🌷", "🌼", "🌸", "💐", "🌞", "🌝",
  ];

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="🎯"
            maxLength={2}
            className="w-12 h-10 px-2 bg-secondary border border-border rounded text-center text-2xl focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded hover:bg-secondary/80 transition text-left text-foreground"
          >
            <ChevronDown className="w-4 h-4 inline" /> Select Emoji
          </button>
        </div>
        {showPicker && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg z-50 w-80 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-8 gap-2">
              {emojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    setShowPicker(false);
                  }}
                  className="w-8 h-8 text-xl hover:bg-secondary rounded transition hover:scale-110"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

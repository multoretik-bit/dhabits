import { formatCoins } from "@/lib/coins";

interface CoinDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function CoinDisplay({ amount, size = "md", showLabel = true }: CoinDisplayProps) {
  const sizeClasses = {
    sm: "text-sm gap-1",
    md: "text-base gap-2",
    lg: "text-lg gap-2",
  };
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  return (
    <div className={`coin-display flex items-center ${sizeClasses[size]} font-semibold`}>
      <img src="/illustrations/reward-coin-v3.svg" alt="Монета" className={`${iconSizes[size]} object-contain`} />
      {showLabel && <span className="coin-value">{formatCoins(amount)}</span>}
    </div>
  );
}

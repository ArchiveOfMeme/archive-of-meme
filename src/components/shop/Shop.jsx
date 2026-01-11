'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useMiningData } from '@/hooks/useMining';

export default function Shop() {
  const { address, isConnected } = useAccount();
  const { user: miningUser } = useMiningData();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [userPoints, setUserPoints] = useState({ available: 0, lifetime: 0, spent: 0 });
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Mystery Box state
  const [mysteryBoxOpening, setMysteryBoxOpening] = useState(false);
  const [mysteryBoxResult, setMysteryBoxResult] = useState(null);

  // Cosmetics state
  const [ownedCosmetics, setOwnedCosmetics] = useState([]);
  const [equippedCosmetics, setEquippedCosmetics] = useState({});

  // User level from React Query cache
  const userLevel = miningUser?.level?.name || 'Bronze';

  const fetchShop = useCallback(async () => {
    try {
      const url = address
        ? `/api/shop?wallet=${address}`
        : '/api/shop';
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setItems(data.items || []);
      setActiveBoosts(data.activeBoosts || []);
      setUserPoints(data.userPoints || { available: 0, lifetime: 0, spent: 0 });

      // Fetch cosmetics (user data comes from React Query)
      if (address) {
        const cosmeticsRes = await fetch(`/api/shop/cosmetics?wallet=${address}`);
        const cosmeticsData = await cosmeticsRes.json();
        setOwnedCosmetics(cosmeticsData.owned || []);
        setEquippedCosmetics(cosmeticsData.equipped || {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // Mystery Box handler
  const handleOpenMysteryBox = async () => {
    if (!address || mysteryBoxOpening) return;

    setError(null);
    setSuccessMessage(null);
    setMysteryBoxOpening(true);
    setMysteryBoxResult(null);

    try {
      const res = await fetch('/api/shop/mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_POINTS') {
          throw new Error(`Not enough points! Need 500, have ${data.available}`);
        } else if (data.error === 'LEVEL_REQUIRED') {
          throw new Error(`Requires ${data.required} level (you are ${data.current})`);
        }
        throw new Error(data.message || data.error);
      }

      // Show result after brief animation delay
      setTimeout(() => {
        setMysteryBoxResult(data.result);
        setUserPoints(prev => ({ ...prev, available: data.newBalance }));
      }, 1500);

      // Refresh shop data
      setTimeout(() => fetchShop(), 2000);

    } catch (err) {
      setError(err.message);
      setMysteryBoxOpening(false);
    }
  };

  const closeMysteryBoxResult = () => {
    setMysteryBoxResult(null);
    setMysteryBoxOpening(false);
  };

  // Cosmetics handlers
  const handleBuyCosmetic = async (item) => {
    if (!address || purchasing) return;

    setError(null);
    setSuccessMessage(null);
    setPurchasing(item.id);

    try {
      const res = await fetch('/api/shop/cosmetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, itemId: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'ALREADY_OWNED') {
          throw new Error('You already own this cosmetic');
        } else if (data.error === 'INSUFFICIENT_POINTS') {
          throw new Error(`Not enough points! Need ${data.required}, have ${data.available}`);
        } else if (data.error === 'LEVEL_REQUIRED') {
          throw new Error(`Requires ${data.required} level (you are ${data.current})`);
        }
        throw new Error(data.message || data.error);
      }

      setSuccessMessage(`Purchased ${data.purchase.itemName}!`);
      await fetchShop();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquipCosmetic = async (item, action) => {
    if (!address) return;

    setError(null);

    try {
      const res = await fetch('/api/shop/cosmetics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, itemId: item.id, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error);
      }

      setSuccessMessage(action === 'equip' ? `Equipped ${item.name}!` : `Unequipped ${item.name}`);
      await fetchShop();
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePurchase = async (item) => {
    if (!address || purchasing) return;

    setError(null);
    setSuccessMessage(null);
    setPurchasing(item.id);

    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, itemId: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_POINTS') {
          throw new Error(`Not enough points! Need ${data.required}, have ${data.available}`);
        } else if (data.error === 'LEVEL_REQUIRED') {
          throw new Error(`Requires ${data.required} level (you are ${data.current})`);
        } else if (data.error === 'BOOST_ACTIVE') {
          const expires = new Date(data.expiresAt).toLocaleString();
          throw new Error(`You already have an active boost until ${expires}`);
        }
        throw new Error(data.message || data.error);
      }

      setSuccessMessage(`Purchased ${data.purchase.itemName}!`);
      await fetchShop(); // Refresh data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  };

  if (!isConnected) {
    return <NotConnectedState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  // Group items by category
  const boosts = items.filter(i => i.category === 'boost');
  const utilities = items.filter(i => i.category === 'utility');
  const cosmetics = items.filter(i => i.category === 'cosmetic');

  // Group cosmetics by type
  const badges = cosmetics.filter(i => i.effectType === 'badge');
  const frames = cosmetics.filter(i => i.effectType === 'frame');
  const nameColors = cosmetics.filter(i => i.effectType === 'name_color');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header>
        <h1 className="text-white text-2xl font-bold mb-1">Shop</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Spend your points on boosts and power-ups
        </p>
      </header>

      {/* Points Balance */}
      <PointsBalance points={userPoints} />

      {/* Active Boosts */}
      {activeBoosts.length > 0 && (
        <ActiveBoostsSection boosts={activeBoosts} />
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <p className="text-green-400 font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Boosts Section */}
      {boosts.length > 0 && (
        <section>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            Mining Boosts
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Multiply your mining points for 24 hours
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {boosts.map((item) => (
              <ShopItem
                key={item.id}
                item={item}
                userPoints={userPoints.available}
                onPurchase={() => handlePurchase(item)}
                purchasing={purchasing === item.id}
                hasActiveBoost={activeBoosts.some(b => b.effectType === 'mining_multiplier')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Utilities Section */}
      {utilities.length > 0 && (
        <section>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            Utilities
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            One-time use power-ups
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {utilities.map((item) => (
              <ShopItem
                key={item.id}
                item={item}
                userPoints={userPoints.available}
                onPurchase={() => handlePurchase(item)}
                purchasing={purchasing === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cosmetics Section */}
      {cosmetics.length > 0 && (
        <CosmeticsSection
          badges={badges}
          frames={frames}
          nameColors={nameColors}
          ownedCosmetics={ownedCosmetics}
          equippedCosmetics={equippedCosmetics}
          userPoints={userPoints.available}
          userLevel={userLevel}
          purchasing={purchasing}
          onBuy={handleBuyCosmetic}
          onEquip={handleEquipCosmetic}
        />
      )}

      {/* Mystery Box Section */}
      <MysteryBoxSection
        userPoints={userPoints.available}
        userLevel={userLevel}
        opening={mysteryBoxOpening}
        onOpen={handleOpenMysteryBox}
      />

      {/* Mystery Box Result Modal */}
      {mysteryBoxResult && (
        <MysteryBoxResultModal
          result={mysteryBoxResult}
          onClose={closeMysteryBoxResult}
        />
      )}

      {/* Back to Mining Link */}
      <div className="pt-4">
        <Link
          href="/mine"
          className="text-[var(--accent-green)] hover:underline flex items-center gap-2"
        >
          <span>←</span>
          Back to Mining
        </Link>
      </div>
    </div>
  );
}

// =============================================
// POINTS BALANCE
// =============================================

function PointsBalance({ points }) {
  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--text-muted)] text-sm mb-1">Available Points</p>
          <p className="text-white text-3xl font-bold">
            {points.available.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[var(--text-muted)] text-xs">
            Lifetime: {points.lifetime.toLocaleString()}
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            Spent: {points.spent.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// ACTIVE BOOSTS SECTION
// =============================================

function ActiveBoostsSection({ boosts }) {
  return (
    <section>
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-lg">✨</span>
        Active Boosts
      </h2>
      <div className="space-y-2">
        {boosts.map((boost) => (
          <ActiveBoostCard key={boost.id} boost={boost} />
        ))}
      </div>
    </section>
  );
}

function ActiveBoostCard({ boost }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!boost.expiresAt) {
      setTimeLeft('One-time use');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const expires = new Date(boost.expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [boost.expiresAt]);

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{boost.icon || '⚡'}</span>
        <div>
          <p className="text-white font-medium">{boost.name}</p>
          <p className="text-green-400 text-sm">
            {boost.effectType === 'mining_multiplier'
              ? `${boost.effectValue}x mining points`
              : boost.effectType}
          </p>
        </div>
      </div>
      <p className="text-[var(--text-muted)] text-sm">{timeLeft}</p>
    </div>
  );
}

// =============================================
// SHOP ITEM CARD
// =============================================

function ShopItem({ item, userPoints, onPurchase, purchasing, hasActiveBoost }) {
  const canAfford = userPoints >= item.cost;
  const isBoostBlocked = item.effectType === 'mining_multiplier' && hasActiveBoost;
  const disabled = !canAfford || purchasing || isBoostBlocked;

  return (
    <div className={`
      bg-[var(--bg-card)] rounded-xl p-4 border transition-all
      ${disabled
        ? 'border-[var(--border-dim)] opacity-60'
        : 'border-[var(--border-dim)] hover:border-[var(--accent-green)]/50'}
    `}>
      {/* Icon and Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{item.icon}</span>
          <div>
            <h3 className="text-white font-semibold">{item.name}</h3>
            {item.durationHours && (
              <span className="text-[var(--text-muted)] text-xs">
                {item.durationHours}h duration
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[var(--text-muted)] text-sm mb-4">
        {item.description}
      </p>

      {/* Effect Badge */}
      <div className="mb-4">
        {item.effectType === 'mining_multiplier' && (
          <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
            <span>⚡</span>
            {item.effectValue}x Points
          </span>
        )}
        {item.effectType === 'skip_cooldown' && (
          <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
            <span>⏭️</span>
            Skip Wait
          </span>
        )}
        {item.effectType === 'streak_shield' && (
          <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
            <span>🛡️</span>
            Protect Streak
          </span>
        )}
      </div>

      {/* Level Requirement */}
      {item.minLevel && (
        <p className="text-[var(--text-muted)] text-xs mb-3">
          Requires: {item.minLevel} level
        </p>
      )}

      {/* Purchase Button */}
      <button
        onClick={onPurchase}
        disabled={disabled}
        className={`
          w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
          ${disabled
            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
            : 'bg-[var(--accent-green)] text-black hover:brightness-110 active:scale-[0.98]'}
        `}
      >
        {purchasing ? (
          <>
            <span className="animate-spin">⏳</span>
            Purchasing...
          </>
        ) : isBoostBlocked ? (
          'Boost Active'
        ) : (
          <>
            <span>💎</span>
            {item.cost.toLocaleString()} pts
          </>
        )}
      </button>

      {/* Affordability indicator */}
      {!canAfford && !isBoostBlocked && (
        <p className="text-red-400/80 text-xs text-center mt-2">
          Need {(item.cost - userPoints).toLocaleString()} more points
        </p>
      )}
    </div>
  );
}

// =============================================
// STATES
// =============================================

function NotConnectedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-white text-xl font-bold mb-2">Connect Your Wallet</h2>
      <p className="text-[var(--text-muted)] mb-6">
        Connect your wallet to access the shop
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-[var(--bg-card)] rounded animate-pulse" />
      <div className="h-24 bg-[var(--bg-card)] rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// =============================================
// MYSTERY BOX SECTION
// =============================================

function MysteryBoxSection({ userPoints, userLevel, opening, onOpen }) {
  const COST = 500;
  const MIN_LEVEL = 'Gold';
  const levelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
  const userLevelIndex = levelOrder.indexOf(userLevel);
  const requiredLevelIndex = levelOrder.indexOf(MIN_LEVEL);

  const canAfford = userPoints >= COST;
  const hasRequiredLevel = userLevelIndex >= requiredLevelIndex;
  const canOpen = canAfford && hasRequiredLevel && !opening;

  return (
    <section>
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-lg">🎁</span>
        Mystery Box
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Test your luck! Win points, boosts, or rare badges
      </p>

      <div className={`
        bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border
        ${canOpen ? 'border-purple-500/50' : 'border-[var(--border-dim)]'}
        text-center
      `}>
        {/* Box Icon */}
        <div className={`text-7xl mb-4 ${opening ? 'animate-bounce' : ''}`}>
          {opening ? '✨' : '🎁'}
        </div>

        {/* Prize Info */}
        <div className="mb-4 text-sm text-[var(--text-muted)]">
          <p className="mb-2">Possible prizes:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="bg-white/5 rounded px-2 py-1">100-300 pts (40%)</span>
            <span className="bg-white/5 rounded px-2 py-1">Boost x1.5 (25%)</span>
            <span className="bg-white/5 rounded px-2 py-1">500-800 pts (15%)</span>
            <span className="bg-white/5 rounded px-2 py-1">Lucky Badge (10%)</span>
            <span className="bg-yellow-500/20 text-yellow-400 rounded px-2 py-1 col-span-2">
              Jackpot 1K-5K pts (10%)
            </span>
          </div>
        </div>

        {/* Level Requirement */}
        {!hasRequiredLevel && (
          <p className="text-amber-400 text-sm mb-4">
            Requires {MIN_LEVEL} level (you are {userLevel})
          </p>
        )}

        {/* Open Button */}
        <button
          onClick={onOpen}
          disabled={!canOpen}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg transition-all
            ${canOpen
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 active:scale-[0.98]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'}
          `}
        >
          {opening ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🎰</span>
              Opening...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🎁</span>
              Open for 500 pts
            </span>
          )}
        </button>

        {/* Affordability */}
        {!canAfford && hasRequiredLevel && (
          <p className="text-red-400/80 text-xs mt-2">
            Need {(COST - userPoints).toLocaleString()} more points
          </p>
        )}
      </div>
    </section>
  );
}

// =============================================
// MYSTERY BOX RESULT MODAL
// =============================================

function MysteryBoxResultModal({ result, onClose }) {
  const isJackpot = result.prizeType === 'jackpot';
  const isWin = result.netChange > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`
        bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full text-center border-2
        ${isJackpot ? 'border-yellow-500 animate-pulse' : isWin ? 'border-green-500' : 'border-[var(--border-dim)]'}
      `}>
        {/* Result Icon */}
        <div className={`text-7xl mb-4 ${isJackpot ? 'animate-bounce' : ''}`}>
          {isJackpot ? '🎉' : result.prizeType === 'boost' ? '⚡' : result.prizeType === 'badge' ? '🍀' : '🎁'}
        </div>

        {/* Title */}
        <h3 className={`text-2xl font-bold mb-2 ${isJackpot ? 'text-yellow-400' : 'text-white'}`}>
          {isJackpot ? 'JACKPOT!' : result.prizeType === 'badge' ? 'Lucky!' : isWin ? 'You Won!' : 'Prize!'}
        </h3>

        {/* Prize Description */}
        <p className="text-[var(--text-muted)] mb-4">
          {result.description}
        </p>

        {/* Prize Details */}
        <div className="space-y-2 mb-6">
          {result.pointsWon > 0 && (
            <div className={`text-3xl font-bold ${isJackpot ? 'text-yellow-400' : 'text-green-400'}`}>
              +{result.pointsWon.toLocaleString()} pts
            </div>
          )}

          {result.boostAwarded && (
            <div className="bg-yellow-500/20 text-yellow-400 rounded-lg p-3">
              <p className="font-semibold">Boost x{result.boostAwarded.multiplier} Activated!</p>
              <p className="text-xs">24 hours duration</p>
            </div>
          )}

          {result.badgeAwarded && (
            <div className="bg-green-500/20 text-green-400 rounded-lg p-3">
              <p className="text-2xl">{result.badgeAwarded.icon}</p>
              <p className="font-semibold">{result.badgeAwarded.name} Badge Earned!</p>
            </div>
          )}

          {/* Net Change */}
          <p className={`text-sm ${result.netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Net: {result.netChange >= 0 ? '+' : ''}{result.netChange.toLocaleString()} pts
          </p>
        </div>

        {/* Roll Number (transparency) */}
        <p className="text-[var(--text-muted)] text-xs mb-4">
          Roll: {result.roll}/100
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-[var(--accent-green)] text-black rounded-xl font-semibold hover:brightness-110 transition-all"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

// =============================================
// COSMETICS SECTION
// =============================================

function CosmeticsSection({ badges, frames, nameColors, ownedCosmetics, equippedCosmetics, userPoints, userLevel, purchasing, onBuy, onEquip }) {
  const ownedIds = new Set(ownedCosmetics.map(c => c.item_id));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <span className="text-lg">🎨</span>
          Cosmetics
        </h2>
        <p className="text-[var(--text-muted)] text-sm">
          Customize your profile with badges, frames, and name colors
        </p>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
            <span>🏅</span> Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((item) => (
              <CosmeticItem
                key={item.id}
                item={item}
                owned={ownedIds.has(item.id)}
                equipped={equippedCosmetics.badge === item.id}
                userPoints={userPoints}
                userLevel={userLevel}
                purchasing={purchasing === item.id}
                onBuy={() => onBuy(item)}
                onEquip={(action) => onEquip(item, action)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Frames */}
      {frames.length > 0 && (
        <div>
          <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
            <span>🖼️</span> Profile Frames
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {frames.map((item) => (
              <CosmeticItem
                key={item.id}
                item={item}
                owned={ownedIds.has(item.id)}
                equipped={equippedCosmetics.frame === item.id}
                userPoints={userPoints}
                userLevel={userLevel}
                purchasing={purchasing === item.id}
                onBuy={() => onBuy(item)}
                onEquip={(action) => onEquip(item, action)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Name Colors */}
      {nameColors.length > 0 && (
        <div>
          <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
            <span>✨</span> Name Colors
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {nameColors.map((item) => (
              <CosmeticItem
                key={item.id}
                item={item}
                owned={ownedIds.has(item.id)}
                equipped={equippedCosmetics.nameColor === item.id}
                userPoints={userPoints}
                userLevel={userLevel}
                purchasing={purchasing === item.id}
                onBuy={() => onBuy(item)}
                onEquip={(action) => onEquip(item, action)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CosmeticItem({ item, owned, equipped, userPoints, userLevel, purchasing, onBuy, onEquip }) {
  const levelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];
  const userLevelIndex = levelOrder.indexOf(userLevel);
  const requiredLevelIndex = item.minLevel ? levelOrder.indexOf(item.minLevel) : -1;
  const hasRequiredLevel = requiredLevelIndex < 0 || userLevelIndex >= requiredLevelIndex;
  const canAfford = userPoints >= item.cost;

  return (
    <div className={`
      bg-[var(--bg-card)] rounded-xl p-3 border transition-all text-center
      ${equipped ? 'border-[var(--accent-green)] ring-1 ring-[var(--accent-green)]/30' : 'border-[var(--border-dim)]'}
      ${owned ? 'opacity-100' : canAfford && hasRequiredLevel ? 'opacity-100 hover:border-purple-500/50' : 'opacity-50'}
    `}>
      {/* Icon */}
      <div className="text-4xl mb-2">{item.icon}</div>

      {/* Name */}
      <h4 className="text-white text-sm font-medium mb-1 truncate">{item.name}</h4>

      {/* Level Requirement */}
      {item.minLevel && !owned && (
        <p className={`text-xs mb-2 ${hasRequiredLevel ? 'text-[var(--text-muted)]' : 'text-amber-400'}`}>
          {item.minLevel}+
        </p>
      )}

      {/* Action Button */}
      {owned ? (
        <button
          onClick={() => onEquip(equipped ? 'unequip' : 'equip')}
          className={`
            w-full py-2 px-3 rounded-lg text-xs font-medium transition-all
            ${equipped
              ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)] border border-[var(--accent-green)]/30'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/80'}
          `}
        >
          {equipped ? '✓ Equipped' : 'Equip'}
        </button>
      ) : (
        <button
          onClick={onBuy}
          disabled={!canAfford || !hasRequiredLevel || purchasing}
          className={`
            w-full py-2 px-3 rounded-lg text-xs font-medium transition-all
            ${canAfford && hasRequiredLevel && !purchasing
              ? 'bg-purple-500 text-white hover:brightness-110'
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'}
          `}
        >
          {purchasing ? '...' : `${item.cost} pts`}
        </button>
      )}
    </div>
  );
}

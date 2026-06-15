import { useState } from 'react';
import { AuctionBuyer, CandyType } from '@/types';
import { CANDY_CONFIG, STATIONS } from '@/data/config';
import { getSaleImpactOnOrder, calculateScarcity } from '@/engine/auctionSystem';
import { getCandyLoad } from '@/engine/loadingSystem';
import useGameStore from '@/store/useGameStore';
import {
  Gavel, Clock, Flame, MapPin, AlertTriangle, CheckCircle,
  Coins, TrendingUp, TrendingDown, Package, User, X
} from 'lucide-react';

interface BuyerCardProps {
  buyer: AuctionBuyer;
  onSell: (buyerId: string, quantity: number, pricePerUnit: number) => boolean;
}

function BuyerCard({ buyer, onSell }: BuyerCardProps) {
  const { train, currentOrder } = useGameStore();
  const [quantity, setQuantity] = useState(Math.min(buyer.maxQuantity, 3));
  const [price, setPrice] = useState(buyer.currentBid);
  const [message, setMessage] = useState<string | null>(null);

  const candyConfig = CANDY_CONFIG[buyer.candyType];
  const currentLoad = getCandyLoad(train, buyer.candyType);
  const maxSellable = Math.min(currentLoad, buyer.maxQuantity);

  const impact = getSaleImpactOnOrder(currentOrder, buyer.candyType, quantity);

  const scarcityInfo = calculateScarcity(train, currentOrder);
  const scarcity = scarcityInfo.find(s => s.candyType === buyer.candyType)?.scarcity || 0.5;

  const patiencePercent = (buyer.patience / buyer.maxPatience) * 100;
  const patienceColor = patiencePercent > 60 ? '#6BCB77' : patiencePercent > 30 ? '#FFD93D' : '#FF4757';

  const handleSell = () => {
    const effectiveQty = Math.min(quantity, maxSellable);
    if (effectiveQty <= 0) {
      setMessage('没有足够的糖果可卖出');
      return;
    }
    const success = onSell(buyer.id, effectiveQty, price);
    if (success) {
      setMessage('✅ 交易成功！');
      setTimeout(() => setMessage(null), 1500);
    } else {
      setMessage('❌ 交易失败，请检查条件');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden hover:shadow-xl transition-shadow">
      <div
        className="p-4 flex items-center gap-3"
        style={{
          background: `linear-gradient(135deg, ${candyConfig.color}20, ${candyConfig.color}05)`,
        }}
      >
        <div className="text-4xl">{buyer.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-gray-800">{buyer.name}</h4>
            {buyer.isUrgent && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                <Flame className="w-3 h-3" />
                急收
              </span>
            )}
            {buyer.preferenceType === 'origin' && buyer.originStationName && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                <MapPin className="w-3 h-3" />
                {buyer.originStationName}
              </span>
            )}
            {buyer.preferenceType === 'surplus' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <Package className="w-3 h-3" />
                收富余
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{buyer.description}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="text-3xl">{candyConfig.emoji}</div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{candyConfig.name}</span>
              <span className="text-xs text-gray-500">
                车厢库存: <b className="text-gray-700">{currentLoad}</b>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">稀缺度:</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-24">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${scarcity * 100}%`,
                    backgroundColor: scarcity > 0.7 ? '#FF4757' : scarcity > 0.4 ? '#FFD93D' : '#6BCB77',
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 w-10 text-right">{Math.round(scarcity * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              耐心值
            </span>
            <span className="text-xs font-medium" style={{ color: patienceColor }}>
              {buyer.patience}/{buyer.maxPatience}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${patiencePercent}%`, backgroundColor: patienceColor }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">底价</div>
            <div className="font-bold text-green-600">{buyer.minPricePerUnit}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">建议价</div>
            <div className="font-bold text-yellow-600">{buyer.currentBid}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">最高</div>
            <div className="font-bold text-red-600">{buyer.maxPricePerUnit}</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Package className="w-4 h-4" />
              卖出数量
            </label>
            <span className="text-xs text-gray-400">最多 {maxSellable} 个</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={Math.max(1, maxSellable)}
              value={Math.min(quantity, Math.max(1, maxSellable))}
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value), maxSellable))}
              disabled={maxSellable <= 0}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <input
              type="number"
              min={1}
              max={maxSellable}
              value={Math.min(quantity, Math.max(1, maxSellable))}
              onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxSellable))}
              disabled={maxSellable <= 0}
              className="w-16 px-2 py-1.5 text-center border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Coins className="w-4 h-4" />
              单价 (金币/个)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={buyer.minPricePerUnit}
              max={buyer.maxPricePerUnit}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <input
              type="number"
              min={buyer.minPricePerUnit}
              max={buyer.maxPricePerUnit}
              value={price}
              onChange={(e) => setPrice(Math.min(Math.max(buyer.minPricePerUnit, parseInt(e.target.value) || buyer.minPricePerUnit), buyer.maxPricePerUnit))}
              className="w-16 px-2 py-1.5 text-center border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-gray-500">
              总价: <b className="text-yellow-600 text-base">{quantity * price}</b> 金币
            </span>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
            impact.impactType === 'relieve_mismatch'
              ? 'bg-green-50 text-green-700'
              : impact.impactType === 'cause_shortage'
              ? 'bg-orange-50 text-orange-700'
              : 'bg-gray-50 text-gray-600'
          }`}
        >
          {impact.impactType === 'relieve_mismatch' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : impact.impactType === 'cause_shortage' ? (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : null}
          <span>{impact.description}</span>
        </div>

        {message && (
          <div className={`p-2 rounded-lg text-sm text-center ${
            message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSell}
          disabled={maxSellable <= 0 || price < buyer.minPricePerUnit}
          className={`w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2
            transition-all duration-200 transform
            ${maxSellable <= 0 || price < buyer.minPricePerUnit
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg'
            }`}
        >
          <Gavel className="w-5 h-5" />
          成交！卖出 {Math.min(quantity, maxSellable)} 个
        </button>
      </div>
    </div>
  );
}

export default function AuctionPlatform() {
  const {
    gamePhase,
    auction,
    train,
    currentOrder,
    sellCandyToBuyer,
    skipAuction,
    confirmDispatch,
    cancelAuction,
  } = useGameStore();

  if (gamePhase !== 'auction' || !auction) return null;

  const { buyers, completedSales, totalAuctionCoins, auctionRound } = auction;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden my-auto">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-5xl">🎪</div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Gavel className="w-6 h-6" />
                  糖果拍卖月台
                </h2>
                <p className="text-white/80 text-sm">发车前的最后机会！卖出富余糖果赚取金币</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{auctionRound}</div>
                <div className="text-xs text-white/70">轮次</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Coins className="w-5 h-5 text-yellow-300" />
                  {totalAuctionCoins}
                </div>
                <div className="text-xs text-white/70">拍卖收益</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{buyers.length}</div>
                <div className="text-xs text-white/70">买家在场</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {completedSales.length > 0 && (
            <div className="mb-6 bg-white rounded-2xl p-4 shadow-lg">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                已完成交易
              </h3>
              <div className="flex flex-wrap gap-2">
                {completedSales.map((sale, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl text-sm border border-green-200"
                  >
                    <span>{CANDY_CONFIG[sale.candyType as CandyType].emoji}</span>
                    <span className="font-medium text-gray-700">×{sale.quantity}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-bold text-yellow-600">+{sale.totalPrice}</span>
                    <span className="text-xs text-gray-400">({sale.buyerName})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {buyers.length > 0 ? (
            <div>
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                现场买家
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {buyers.map((buyer) => (
                  <BuyerCard
                    key={buyer.id}
                    buyer={buyer}
                    onSell={sellCandyToBuyer}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">买家们都走了...</h3>
              <p className="text-gray-500">没有人出价了，可以确认发车了</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={cancelAuction}
              className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              返回继续装填
            </button>
            <button
              onClick={skipAuction}
              disabled={buyers.length === 0}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${buyers.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
            >
              <Clock className="w-5 h-5" />
              跳过本轮 (降价等待)
            </button>
            <button
              onClick={confirmDispatch}
              className="flex-1 sm:flex-2 py-3 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2
                bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              🚂 确认发车！
            </button>
          </div>

          {currentOrder && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                发车提醒
              </div>
              <div className="text-gray-600 text-xs">
                当前订单来自 <b>{currentOrder.stationName}</b>，
                共 {currentOrder.items.length} 项需求。
                {currentOrder.isUrgent && (
                  <span className="text-red-600 font-medium ml-1">⚠ 这是急单！</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

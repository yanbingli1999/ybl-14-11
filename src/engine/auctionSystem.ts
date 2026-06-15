import { Train, StationOrder, AuctionBuyer, AuctionState, AuctionSale, CandyType, BASIC_CANDY_TYPES, BuyerPreferenceType } from '@/types';
import { GAME_CONFIG, STATIONS, CANDY_CONFIG } from '@/data/config';
import { getCandyLoad, getTotalCapacity, getTotalLoad } from './loadingSystem';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export interface ScarcityInfo {
  candyType: CandyType;
  scarcity: number;
  isSurplus: boolean;
  surplusAmount: number;
  deficitAmount: number;
}

export function calculateScarcity(train: Train, order: StationOrder | null): ScarcityInfo[] {
  const result: ScarcityInfo[] = [];

  for (const candyType of BASIC_CANDY_TYPES) {
    const loaded = getCandyLoad(train, candyType);
    const orderItem = order?.items.find(i => i.candyType === candyType);
    const required = orderItem?.quantity || 0;

    const carriage = train.carriages.find(c => c.candyType === candyType);
    const capacity = carriage?.capacity || 0;

    const diff = loaded - required;
    const isSurplus = diff > 0;
    const surplusAmount = Math.max(0, diff);
    const deficitAmount = Math.max(0, required - loaded);

    let scarcity = 0.5;
    if (capacity > 0) {
      if (required > 0) {
        scarcity = Math.min(1, required / capacity);
      } else {
        scarcity = 0.2;
      }
    }

    if (loaded === 0 && required > 0) {
      scarcity = 1;
    } else if (surplusAmount > capacity * 0.3) {
      scarcity = 0.1;
    }

    result.push({
      candyType,
      scarcity,
      isSurplus,
      surplusAmount,
      deficitAmount,
    });
  }

  return result;
}

export function calculateAuctionPrice(
  candyType: CandyType,
  scarcity: number,
  reputation: number,
  isSealed: boolean,
  isUrgent: boolean,
  patience: number,
  maxPatience: number
): { minPrice: number; maxPrice: number; suggestedBid: number } {
  const config = GAME_CONFIG;

  const baseMin = config.AUCTION_BASE_PRICE_MIN;
  const baseMax = config.AUCTION_BASE_PRICE_MAX;

  const scarcityMultiplier = 1 + (scarcity * (config.AUCTION_SCARCITY_MULTIPLIER - 1));

  const reputationBonus = 1 + (reputation * config.AUCTION_REPUTATION_BONUS);

  let multiplier = scarcityMultiplier * reputationBonus;

  if (isSealed) {
    multiplier *= config.AUCTION_SEALED_BONUS;
  }

  if (isUrgent) {
    multiplier *= config.AUCTION_URGENT_MULTIPLIER;
  }

  const patienceRatio = patience / maxPatience;
  multiplier *= (0.6 + 0.4 * patienceRatio);

  let minPrice = Math.ceil(baseMin * multiplier);
  let maxPrice = Math.ceil(baseMax * multiplier);

  const candyPoints = CANDY_CONFIG[candyType].points;
  minPrice = Math.ceil(minPrice * (candyPoints / 10));
  maxPrice = Math.ceil(maxPrice * (candyPoints / 10));

  if (minPrice >= maxPrice) {
    maxPrice = minPrice + 2;
  }

  const suggestedBid = Math.ceil((minPrice + maxPrice) / 2);

  return { minPrice, maxPrice, suggestedBid };
}

export function generateBuyers(
  train: Train,
  order: StationOrder | null,
  reputation: number,
  currentStationId: string
): AuctionBuyer[] {
  const scarcityInfo = calculateScarcity(train, order);
  const buyers: AuctionBuyer[] = [];

  const buyerCount = GAME_CONFIG.AUCTION_MIN_BUYERS +
    Math.floor(Math.random() * (GAME_CONFIG.AUCTION_MAX_BUYERS - GAME_CONFIG.AUCTION_MIN_BUYERS + 1));

  const availableNames = shuffle([...GAME_CONFIG.AUCTION_BUYER_NAMES]);
  const availableAvatars = shuffle([...GAME_CONFIG.AUCTION_BUYER_AVATARS]);

  const surplusTypes = scarcityInfo.filter(s => s.isSurplus && s.surplusAmount >= 2);
  const deficitTypes = scarcityInfo.filter(s => s.deficitAmount > 0);
  const allTypes = shuffle([...BASIC_CANDY_TYPES]);

  const selectedCandyTypes: CandyType[] = [];
  let pool = surplusTypes.length > 0 ? surplusTypes.map(s => s.candyType) : allTypes;

  for (let i = 0; i < buyerCount; i++) {
    let candyType: CandyType;
    if (pool.length > 0) {
      candyType = pool[i % pool.length];
    } else {
      candyType = allTypes[i % allTypes.length];
    }
    if (!selectedCandyTypes.includes(candyType) || i >= BASIC_CANDY_TYPES.length) {
      selectedCandyTypes.push(candyType);
    } else {
      const remaining = allTypes.filter(t => !selectedCandyTypes.includes(t));
      if (remaining.length > 0) {
        candyType = remaining[0];
      }
      selectedCandyTypes.push(candyType);
    }

    const info = scarcityInfo.find(s => s.candyType === candyType)!;
    const isUrgentBuyer = Math.random() < 0.3;
    const preferenceRoll = Math.random();
    let preferenceType: BuyerPreferenceType;
    let originStationId: string | undefined;
    let originStationName: string | undefined;
    let description: string;

    if (preferenceRoll < 0.4 && info.isSurplus) {
      preferenceType = 'surplus';
      description = `急需处理富余${CANDY_CONFIG[candyType].name}`;
    } else if (preferenceRoll < 0.7) {
      preferenceType = 'origin';
      const otherStations = STATIONS.filter(s => s.id !== currentStationId);
      if (otherStations.length > 0) {
        const originStation = getRandomItem(otherStations);
        originStationId = originStation.id;
        originStationName = originStation.name;
        description = `来自${originStationName}的采购商，指定收购`;
      } else {
        preferenceType = 'any';
        description = `专业糖果收购商`;
      }
    } else {
      preferenceType = 'any';
      description = `专业糖果收购商`;
    }

    const carriage = train.carriages.find(c => c.candyType === candyType);
    const loaded = carriage?.currentLoad || 0;

    if (loaded <= 0) {
      continue;
    }

    const maxBuyable = Math.min(
      loaded,
      preferenceType === 'surplus'
        ? Math.max(1, info.surplusAmount)
        : Math.max(1, Math.floor(loaded * 0.7) + 1)
    );

    if (maxBuyable <= 0) {
      continue;
    }

    const desiredQty = 2 + Math.floor(Math.random() * 8);
    const maxQuantity = Math.max(1, Math.min(maxBuyable, desiredQty));

    if (maxQuantity < 1) {
      continue;
    }

    const isSealed = preferenceType === 'origin';
    const maxPatience = GAME_CONFIG.AUCTION_MAX_PATIENCE;
    const initialPatience = isUrgentBuyer
      ? Math.floor(maxPatience * (0.4 + Math.random() * 0.3))
      : Math.floor(maxPatience * (0.7 + Math.random() * 0.3));

    const { minPrice, maxPrice, suggestedBid } = calculateAuctionPrice(
      candyType,
      info.scarcity,
      reputation,
      isSealed,
      isUrgentBuyer,
      initialPatience,
      maxPatience
    );

    buyers.push({
      id: generateId(),
      name: availableNames[i % availableNames.length],
      avatar: availableAvatars[i % availableAvatars.length],
      candyType,
      originStationId,
      originStationName,
      preferenceType,
      maxQuantity,
      currentBid: suggestedBid,
      minPricePerUnit: minPrice,
      maxPricePerUnit: maxPrice,
      patience: initialPatience,
      maxPatience,
      isUrgent: isUrgentBuyer,
      description,
    });
  }

  return buyers.sort((a, b) => b.currentBid - a.currentBid);
}

export function initAuctionState(
  train: Train,
  order: StationOrder | null,
  reputation: number,
  currentStationId: string
): AuctionState {
  return {
    buyers: generateBuyers(train, order, reputation, currentStationId),
    completedSales: [],
    totalAuctionCoins: 0,
    auctionRound: 1,
  };
}

export function executeSale(
  state: AuctionState,
  buyerId: string,
  quantity: number,
  pricePerUnit: number
): { success: boolean; sale: AuctionSale | null; updatedState: AuctionState; message: string } {
  const buyer = state.buyers.find(b => b.id === buyerId);

  if (!buyer) {
    return { success: false, sale: null, updatedState: state, message: '买家不存在' };
  }

  if (quantity <= 0 || quantity > buyer.maxQuantity) {
    return { success: false, sale: null, updatedState: state, message: `数量必须在1-${buyer.maxQuantity}之间` };
  }

  if (pricePerUnit < buyer.minPricePerUnit) {
    return { success: false, sale: null, updatedState: state, message: `出价不能低于 ${buyer.minPricePerUnit} 金币/个` };
  }

  if (buyer.patience <= 0) {
    return { success: false, sale: null, updatedState: state, message: '买家已失去耐心离开' };
  }

  const actualPrice = Math.min(pricePerUnit, buyer.maxPricePerUnit);
  const totalPrice = actualPrice * quantity;

  const sale: AuctionSale = {
    buyerId: buyer.id,
    buyerName: buyer.name,
    candyType: buyer.candyType,
    quantity,
    pricePerUnit: actualPrice,
    totalPrice,
    timestamp: Date.now(),
  };

  const remainingBuyers = state.buyers
    .filter(b => b.id !== buyerId)
    .map(b => {
      const decayAmount = Math.ceil(b.maxPatience * GAME_CONFIG.AUCTION_PATIENCE_DECAY);
      const newPatience = Math.max(0, b.patience - decayAmount);
      return { ...b, patience: newPatience };
    })
    .filter(b => b.patience > 0);

  const updatedState: AuctionState = {
    ...state,
    buyers: remainingBuyers,
    completedSales: [...state.completedSales, sale],
    totalAuctionCoins: state.totalAuctionCoins + totalPrice,
    auctionRound: state.auctionRound + 1,
  };

  return {
    success: true,
    sale,
    updatedState,
    message: `成功卖出 ${quantity} 个 ${CANDY_CONFIG[buyer.candyType].name}，获得 ${totalPrice} 金币！`,
  };
}

export function skipAuctionRound(state: AuctionState): AuctionState {
  const updatedBuyers = state.buyers
    .map(b => {
      const decayAmount = Math.ceil(b.maxPatience * GAME_CONFIG.AUCTION_PATIENCE_DECAY * 2);
      const newPatience = Math.max(0, b.patience - decayAmount);
      let newBid = b.currentBid;
      if (newPatience < b.maxPatience * 0.5 && Math.random() < 0.4) {
        newBid = Math.min(b.maxPricePerUnit, b.currentBid + 1);
      }
      return { ...b, patience: newPatience, currentBid: newBid };
    })
    .filter(b => b.patience > 0);

  return {
    ...state,
    buyers: updatedBuyers,
    auctionRound: state.auctionRound + 1,
  };
}

export function getSaleImpactOnOrder(
  order: StationOrder | null,
  train: Train,
  candyType: CandyType,
  quantity: number
): { impactType: 'relieve_mismatch' | 'cause_shortage' | 'neutral' | 'mixed'; description: string } {
  if (!order) {
    return { impactType: 'neutral', description: '不影响主订单' };
  }

  const orderItem = order.items.find(i => i.candyType === candyType);
  const carriage = train.carriages.find(c => c.candyType === candyType);
  const currentLoad = carriage?.currentLoad || 0;
  const afterLoad = Math.max(0, currentLoad - quantity);

  if (!orderItem) {
    return {
      impactType: 'relieve_mismatch',
      description: `✓ 主订单不需要 ${CANDY_CONFIG[candyType].name}，卖出 ${quantity} 个可减少错装`,
    };
  }

  const required = orderItem.quantity;

  if (currentLoad <= required) {
    return {
      impactType: 'cause_shortage',
      description: `⚠ 当前库存 ${currentLoad} ≤ 订单需求 ${required}，卖出 ${quantity} 个后剩 ${afterLoad} 个，将造成缺货！`,
    };
  }

  const surplus = currentLoad - required;
  const deficitSale = Math.max(0, quantity - surplus);
  const surplusSale = Math.min(quantity, surplus);

  if (afterLoad >= required) {
    return {
      impactType: 'relieve_mismatch',
      description: `✓ 当前富余 ${surplus} 个，卖出 ${quantity} 个后仍剩 ${afterLoad} 个（≥${required}），完全不影响主订单`,
    };
  }

  return {
    impactType: 'mixed',
    description: `⚖ 富余 ${surplus} 个，卖出 ${quantity} 个将消耗全部富余+${deficitSale}个库存，剩 ${afterLoad}/${required}（差 ${required - afterLoad} 个）`,
  };
}

export function applySaleToTrain(train: Train, sale: AuctionSale): Train {
  const newCarriages = train.carriages.map(c => {
    if (c.candyType === sale.candyType) {
      const newLoad = Math.max(0, c.currentLoad - sale.quantity);
      return { ...c, currentLoad: newLoad };
    }
    return { ...c };
  });

  return { ...train, carriages: newCarriages };
}

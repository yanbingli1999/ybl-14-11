export type CandyType =
  | 'strawberry'
  | 'lemon'
  | 'mint'
  | 'blueberry'
  | 'grape'
  | 'rainbow'
  | 'bomb';

export type SpecialCandyType = 'rainbow' | 'bomb' | null;

export interface Candy {
  id: string;
  type: CandyType;
  row: number;
  col: number;
  isSpecial: boolean;
  specialType: SpecialCandyType;
  isMatched: boolean;
  isFalling: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface MatchResult {
  candies: Candy[];
  positions: Position[];
  matchType: 'horizontal' | 'vertical' | 'both' | 'special';
  specialGenerated: SpecialCandyType;
  specialPosition: Position | null;
}

export interface Carriage {
  id: string;
  candyType: CandyType;
  capacity: number;
  currentLoad: number;
}

export interface Train {
  id: string;
  name: string;
  carriages: Carriage[];
}

export interface OrderItem {
  candyType: CandyType;
  quantity: number;
}

export interface StationOrder {
  id: string;
  stationId: string;
  stationName: string;
  items: OrderItem[];
  reward: number;
  penalty: number;
  isUrgent: boolean;
  urgentBonus: number;
}

export interface Station {
  id: string;
  name: string;
  reputationRequired: number;
  themeColor: string;
  description: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  coins: number;
  reputation: number;
  level: number;
  unlockedStations: string[];
}

export type GamePhase = 'playing' | 'auction' | 'dispatching' | 'result' | 'gameover';

export type BuyerPreferenceType = 'surplus' | 'origin' | 'any';

export interface AuctionBuyer {
  id: string;
  name: string;
  avatar: string;
  candyType: CandyType;
  originStationId?: string;
  originStationName?: string;
  preferenceType: BuyerPreferenceType;
  maxQuantity: number;
  currentBid: number;
  minPricePerUnit: number;
  maxPricePerUnit: number;
  patience: number;
  maxPatience: number;
  isUrgent: boolean;
  description: string;
}

export interface AuctionState {
  buyers: AuctionBuyer[];
  completedSales: AuctionSale[];
  totalAuctionCoins: number;
  auctionRound: number;
}

export interface AuctionSale {
  buyerId: string;
  buyerName: string;
  candyType: CandyType;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  timestamp: number;
}

export interface GameState {
  board: (Candy | null)[][];
  selectedCandy: Position | null;
  score: number;
  moves: number;
  combo: number;
  maxCombo: number;
  train: Train;
  currentOrder: StationOrder | null;
  currentStationId: string;
  isAnimating: boolean;
  gamePhase: GamePhase;
  dispatchResult: DispatchResult | null;
  auction: AuctionState | null;
}

export interface DispatchResult {
  success: boolean;
  matchRate: number;
  reward: number;
  penalty: number;
  mismatches: OrderItem[];
  correctItems: OrderItem[];
  reputationChange: number;
}

export interface StatsStep {
  id: string;
  date: string;
  totalMoves: number;
  bestMoves: number;
  gamesPlayed: number;
}

export interface StatsCombo {
  id: string;
  date: string;
  totalCombos: number;
  maxCombo: number;
  avgCombo: number;
}

export interface StatsMismatch {
  id: string;
  date: string;
  mismatchCount: number;
  totalPenalty: number;
  dispatches: number;
}

export interface StatsUrgent {
  id: string;
  date: string;
  urgentCount: number;
  successCount: number;
  successRate: number;
}

export interface StatsReputation {
  id: string;
  date: string;
  reputation: number;
  changeAmount: number;
}

export interface AllStats {
  steps: StatsStep[];
  combos: StatsCombo[];
  mismatches: StatsMismatch[];
  urgents: StatsUrgent[];
  reputations: StatsReputation[];
}

export const BOARD_SIZE = 8;
export const BASIC_CANDY_TYPES: CandyType[] = ['strawberry', 'lemon', 'mint', 'blueberry', 'grape'];

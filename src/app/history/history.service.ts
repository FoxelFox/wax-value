import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {WaxService} from "../wax.service";
import {lastValueFrom} from "rxjs";
import {CSVRecord, Transaction} from "../interfaces";
import {AlcorService} from "../alcor-trades.service";
import {HexService} from "../hex.service";
import * as localforage from "localforage";

@Injectable()
export class HistoryService {

	actions: Transaction[] = [];
	NFTSaleMap: { [key: number]: string[] } = {}
	lastNFTSaleTX: Transaction;

	trades: CSVRecord[];
	lastSwapSendTX: Transaction;
	lastAtomicMarketTX: {
		id: string
		deposit: number
		nfts: string[]
	}
	lastSwapPoolTX: {
		id: string
		depositA: {
			token: string
			amount: string
		}
		depositB: {
			token: string
			amount: string
		},
		pool: {
			token: string
			amount: string
		}
	};
	history: CSVRecord[] = [];
	transactions: Transaction[] = [];
	done = undefined;

	constructor(
		private http: HttpClient,
		public wax: WaxService,
		public alcor: AlcorService,
		public hex: HexService
	) {

	}

	async* fetchHistory(): AsyncGenerator<CSVRecord[]> {
		if (this.done === undefined) {
			this.done = false
		} else {
			return
		}
		this.trades = await this.alcor.getTrades();
		const iterator = this.getTransactions();
		let transactions: Transaction[];


		let sum = 0;
		const txMap = {}
		let duplicates = 0
		let start, end = 0;
		let date
		while (transactions = (await iterator.next()).value) {
			let block: CSVRecord[] = [];
			for (const t of transactions) {
				// if (txMap[t.action_trace.trx_id]) {
				// 	duplicates++;
				// 	continue; // duplicate tx
				// }

				if (!t.action_trace.act.data) {
					// some act providing data only in hex_data that have to be decoded
					await this.hex.decode(t.action_trace.act);
				}
				this.transactions.push(t);

				const results = await this.getTransactionResult(t);

				if (results) {
					for (const result of results) {
						let change = 0;
						if (result.buy_amount) {
							change += result.buy_amount
						} else if (result.sell_amount) {
							change -= result.sell_amount
						} else {
							console.log(`No Result with no change at ${t.account_action_seq}`)
						}
						txMap[t.action_trace.trx_id] = true;
						sum += change;

						// Duplicate check
						if (JSON.stringify(block[block.length - 1] || this.history[this.history.length - 1]) !== JSON.stringify(result)) {
							block.push(result);
						}
					}
				}
			}

			if (block.length) {
				const end = block[block.length - 1].date.getTime();

				let tradesInBlock = this.trades.filter(t => t.date.getTime() >= start && t.date.getTime() <= end && !this.history.find(x => x.date.getTime() === t.date.getTime()));
				block.push(...tradesInBlock)
				block.sort((a, b) => a.date.getTime() - b.date.getTime());
				this.history.push(...block);

				start = end;
				yield block;
			}
		}

		let lastTrades = this.trades.filter(t => t.date.getTime() >= start && !this.history.find(x => x.date.getTime() === t.date.getTime()));
		lastTrades.sort((a, b) => a.date.getTime() - b.date.getTime());
		if (lastTrades.length) {
			this.history.push(...lastTrades);

			yield lastTrades;
		}

		this.done = true;
	}

	async getTransactionResult(transaction: Transaction): Promise<CSVRecord[]> {
		const act = transaction.action_trace.act;
		let ret: CSVRecord = {
			date: new Date(transaction.block_time),
			exchange: "WAX Transaction"
		} as CSVRecord

		// Claim Stake Reward (going directly to cpu and net)
		if (act.name === "delegatebw" && act.data.from === "eosio.voters") {
			ret.type = "Zinsen";
			let result = 0;
			result += parseFloat(act.data.stake_cpu_quantity.split(" ")[0])
			result += parseFloat(act.data.stake_net_quantity.split(" ")[0])
			ret.buy_amount = result;
			ret.buy_currency = "WAX";
			return [ret];
		}

		// Just Staking
		if (act.name === "delegatebw" && act.data.from === this.wax.account.account_name) {
			return undefined
		}

		// Transfer
		if (
			act.name === "transfer" && act.data.quantity
			&& act.data.to !== "eosio.stake" // just staking
			&& act.data.to !== "alcordexmain" // ignore order movements because they handled by AlcorExchange class
			&& act.data.from !== "alcordexmain" // ignore order movements  because they handled by AlcorExchange class
			&& act.data.to !== "atomicmarket" // handled by NFT
			&& act.data.from !== "atomicmarket" // handled by NFT
		) {
			const quantity = act.data.quantity.split(" ");
			// if (quantity[1] === "WAX") {
			if (act.data.to === this.wax.account.account_name) {
				//ret.type = "Einnahme"
				ret.type = "Einzahlung"
				ret.buy_amount = parseFloat(quantity[0]);
				ret.buy_currency = quantity[1] + "@" + act.account
			} else {
				//ret.type = "Ausgabe"
				ret.type = "Auszahlung"
				ret.sell_amount = parseFloat(quantity[0]);
				ret.sell_currency = quantity[1] + "@" + act.account
			}
			return [ret];
			// }
		}

		// Alcor Swap
		if (act.name === "transfer" && act.data.to === "alcorammswap") {
			this.lastSwapSendTX = transaction;
		}
		if (act.name === "transfer" && act.data.from === "alcorammswap") {

			const buy = act.data.quantity.split(" ");
			const sell = this.lastSwapSendTX.action_trace.act.data.quantity.split(" ");
			ret.type = "Trade";
			ret.buy_amount = parseFloat(buy[0]);
			ret.buy_currency = buy[1] + "@" + act.account;
			ret.sell_currency = sell[1] + "@" + this.lastSwapSendTX.action_trace.act.account;
			ret.sell_amount = parseFloat(sell[0]);

			return [ret];
		}

		//TODO Alcor Swap Pool
		// deposit wax
		// deoisit tlm
		// to_buy taxtlm
		// refund liquidity slippage wax
		// refund liquidity slippage tlm


		// Mint NFT
		if (act.name === "logmint") {
			ret.type = "Minting"
			ret.buy_amount = 1
			ret.buy_currency = `NFT@${act.data.collection_name}@${act.data.schema_name}@${act.data.template_id}`
			return [ret];
		}

		// NFT Atomic Market BUY
		if (act.data.to === "atomicmarket" && act.data.memo === "deposit") {
			this.lastAtomicMarketTX = {
				deposit: parseFloat(act.data.quantity.split(" ")),
				id: transaction.action_trace.trx_id,
				nfts: []
			}
		}
		if (act.data.from === "atomicmarket" && act.data.asset_ids) {
			this.lastAtomicMarketTX.nfts = act.data.asset_ids

			const rets: CSVRecord[] = []
			for (const nft of this.lastAtomicMarketTX.nfts) {
				const info = await this.wax.getNFTInfo(nft);

				rets.push({
					date: new Date(transaction.block_time),
					exchange: "WAX Transaction",
					type: "Trade",
					buy_currency: `NFT@${info.collection}@${info.schema}@${info.template}`,
					buy_amount: 1,
					sell_currency: "WAX@eosio.token",
					sell_amount: this.lastAtomicMarketTX.deposit / this.lastAtomicMarketTX.nfts.length
				})
			}

			return rets;
		}

		// NFT was put on sale
		if (act.account === "atomicassets" && act.data.memo === "sale" && act.data.offer_id) {
			const nfts = [];
			for (const nft of act.data.sender_asset_ids) {
				const info = await this.wax.getNFTInfo(nft);
				nfts.push(`NFT@${info.collection}@${info.schema}@${info.template}`);
			}
			this.NFTSaleMap[act.data.offer_id] = nfts;
		}

		// NFT sale offer was accepted
		if (act.data.from === "atomicmarket" && act.data.memo.indexOf("AtomicMarket Sale Payout") !== -1) {
			this.lastNFTSaleTX = transaction
		}
		if (act.account === "atomicassets" && act.name === "acceptoffer") {
			const nfts = this.NFTSaleMap[act.data.offer_id];
			const price = parseFloat(this.lastNFTSaleTX.action_trace.act.data.quantity.split(" "));
			const rets: CSVRecord[] = []
			for (const nft of nfts) {
				rets.push({
					date: new Date(transaction.block_time),
					exchange: "WAX Transaction",
					type: "Trade",
					buy_currency: "WAX@eosio.token",
					buy_amount: price / nfts.length,
					sell_currency: nft,
					sell_amount: 1
				})
			}
			return rets;
		}

		return undefined
	}

	async* getTransactions(): AsyncGenerator<Transaction[]> {

		let cache = await localforage.getItem(this.wax.account.account_name + '-actions');
		if (!cache) {
			cache = {};
		}

		let i = 0;
		while (true
			) {
			try {
				if (cache[i * 100]) {
					this.actions = this.actions.concat(cache[i * 100]);
					yield cache[i * 100];
				} else {
					const res = await lastValueFrom(this.http.post<{ actions: Transaction[] }>(`api/history/get_actions`, {
						account_name: this.wax.account.account_name,
						offset: 100,
						pos: i * 100
					}));
					this.actions = this.actions.concat(res.actions);
					if (res.actions.length === 100) {
						// only store full pages
						cache[i * 100] = res.actions;
						await localforage.setItem(this.wax.account.account_name + '-actions', cache);
					}

					yield res.actions;
				}
				i++
			} catch (e) {
				break;
			}
		}
	}
}

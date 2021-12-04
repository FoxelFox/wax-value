import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {WaxService} from "../wax.service";
import {lastValueFrom} from "rxjs";
import {CSVRecord, Transaction} from "../interfaces";
import {AlcorService} from "../alcor-trades.service";

@Injectable()
export class HistoryService {

	actions: Transaction[] = [];

	trades: CSVRecord[];
	history: CSVRecord[] = [];
	done = undefined;

	constructor(
		private http: HttpClient,
		public wax: WaxService,
		public alcor: AlcorService
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
				if (txMap[t.action_trace.trx_id]) {
					duplicates++;
					continue; // duplicate tx
				}


				const result = this.getTransactionResult(t);

				if (result) {
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

					// if (change > 20 || change < -20) {
					// 	result['debug'] = t.account_action_seq
					block.push(result);
					//}
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


			//this.history = this.history.sort((a, b) => a.date.localeCompare(b.date))
		}
		this.done = true;
	}

	getTransactionResult(transaction: Transaction): CSVRecord {
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
			return ret;
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
			return ret;
			// }
		}
		return undefined
	}

	async* getTransactions(): AsyncGenerator<Transaction[]> {
		let i = 0;
		while (true) {
			try {
				const res = await lastValueFrom(this.http.post<{ actions: Transaction[] }>(`api/history/get_actions`, {
					account_name: this.wax.account.account_name,
					offset: 100,
					pos: i * 100
				}));
				this.actions = this.actions.concat(res.actions);
				yield res.actions;
				i++
			} catch (e) {
				break;
			}
		}
	}
}

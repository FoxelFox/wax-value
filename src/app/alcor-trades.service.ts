import {AlcorTrade, CSVRecord, Market, Token} from "./interfaces";
import {Injectable} from "@angular/core";
import {WaxService} from "./wax.service";
import {HttpClient} from "@angular/common/http";
import {lastValueFrom} from "rxjs";

@Injectable()
export class AlcorService {

	markets: { [id: number]: Market } = {};
	trades: AlcorTrade[];

	constructor(
		private wax: WaxService,
		private http: HttpClient
	) {

	}

	async getTrades(): Promise<CSVRecord[]> {
		const csv: CSVRecord[] = [];

		await this.loadMarkets();
		await this.loadTrades();


		for (const trade of this.trades) {
			const line: CSVRecord = {
				type: "Trade",
				date: new Date(trade.time),
				exchange: "WAX Transaction"
			}
			// buy match = bid (in/buy, base) ask (out/sell, quote)
			// sell match = bid (in/buy, quote) ask (out/sell, base)

			const base = this.getTokenIdentifier(this.markets[trade.market].base_token);
			const quote = this.getTokenIdentifier(this.markets[trade.market].quote_token);
			const bid = trade.bid;
			const ask = trade.ask;

			if (trade.type === "buymatch") {
				line.buy_currency = base;
				line.buy_amount = bid;
				line.sell_currency = quote;
				line.sell_amount = ask;
			} else {
				line.buy_currency = quote;
				line.buy_amount = bid;
				line.sell_currency = base;
				line.sell_amount = ask;
			}

			csv.push(line);
		}

		return csv;
	}

	async loadTrades() {

		// TODO this request is limited to 100000 trades
		this.trades = await lastValueFrom(this.http.get<AlcorTrade[]>(`alcor/account/${this.wax.account.account_name}/deals?limit=100000&skip=0`))
	}

	async loadMarkets() {
		console.log("Fetching Alcor Markets")
		const markets = await lastValueFrom(this.http.get<Market[]>(`alcor/markets`));

		for (const m of markets) {
			this.markets[m.id] = m;
		}

		// extend de listed markets

		// PORN
		this.markets[77] = {
			base_token: {
				"contract": "eosio.token",
				"symbol": {
					"name": "WAX",
					"precision": 8
				},
				"str": "WAX@eosio.token"
			},
			quote_token: {
				"contract": "pornhubgames",
				"symbol": {
					"name": "PORN",
					"precision": 8
				},
				"str": "PORN@pornhubgames"
			}
		} as Market

		// WEED
		this.markets[51] = {
			base_token: {
				"contract": "eosio.token",
				"symbol": {
					"name": "WAX",
					"precision": 8
				},
				"str": "WAX@eosio.token"
			},
			quote_token: {
				"contract": "createtokens",
				"symbol": {
					"name": "WEED",
					"precision": 8
				},
				"str": "WEED@createtokens"
			}
		} as Market
	}

	getTokenIdentifier(token: Token) {
		/*
		if (token.str === "WAX@eosio.token") {
			// well known and listed Token WAX (WAXP)
			return "WAX";
		} else if (token.str === "TLM@alien.worlds") {
			// well known and listed Token TLM from Alien Worlds
			return "TLM"
		} else {
			// in public its a unknown token and only available in the WAX Universe
			return token.str;
		}
		 */
		return token.str;
	}
}

import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {lastValueFrom} from "rxjs";
import {Account, LightAccount, LightBalances, Market, Order} from "./wax.interfaces";

@Injectable()
export class WaxService {

	account: Account
	markets: Market[];
	marketsByQuoteNameContract: {[key: string]: Market} = {}; // TOKEN@Contract


	constructor(private http: HttpClient) {

	}

	async changeAccount(account: string) {

		const acc = await lastValueFrom(this.http.post<Account>(`api/chain/get_account`, {
			account_name: account
		}));

		acc.calculated = {
			balances: []
		}

		this.account = acc;

		const lightInfo: LightAccount = await lastValueFrom(this.http.get<LightAccount>(`light/accinfo/wax/${account}`));


		let wax =
			parseFloat(this.account.core_liquid_balance.split(' ')[0]) +
			parseFloat(this.account.total_resources.cpu_weight.split(' ')[0]) +
			parseFloat(this.account.total_resources.net_weight.split(' ')[0]);

		for (const staked of lightInfo.delegated_to) {
			if (staked.account_name !== account) {
				wax += staked.net_weight / Math.pow(10, 8)
				wax += staked.cpu_weight / Math.pow(10, 8)
			}
		}

		this.account.calculated.balances.push({
			amount: wax,
			wax: wax,
			name: "WAX"
		});

		const data = await lastValueFrom(this.http.get<{balances: LightBalances[]}>(`light/balances/wax/${account}`));
		const balances = data.balances.filter(b =>
			parseFloat(b.amount) > 0 && b.currency !== "WAX"
		);

		this.getMarkets().then(async markets => {
			this.markets = markets
			this.markets = this.markets.filter(m => m.base_token.symbol.name === 'WAX')

			for (const market of this.markets) {
				this.marketsByQuoteNameContract[market.quote_token.str] = market;
			}

			for (const balance of balances) {
				const market = this.marketsByQuoteNameContract[balance.currency + '@' + balance.contract];
				const amount = parseFloat(balance.amount);
				if (market) {
					const bid = await this.getBestBID(market);

					this.account.calculated.balances.push({
						amount: amount,
						name: balance.currency,
						wax:  amount * bid
					})
				} else {
					this.account.calculated.balances.push({
						amount: amount,
						name: balance.currency,
						wax:  0
					})
				}
			}
		});

	}

	async getMarkets() {
		return await lastValueFrom(this.http.get<Market[]>(`https://wax.alcor.exchange/api/markets`));
	}

	async getBestBID(market: Market) {
		const payload = {
			code: "alcordexmain",
			index_position: 2,
			json: true,
			key_type: "i128",
			limit: 1000,
			lower_bound: "",
			reverse: false,
			scope: market.id,
			show_payer: false,
			table: "buyorder",
			table_key: "",
			upper_bound: "",
		};

		const url = `api/chain/get_table_rows`;
		const resBuy = await lastValueFrom(this.http.post<{rows: Order[]}>(url, payload));
		return resBuy.rows[0] ? parseInt(resBuy.rows[0].unit_price) / Math.pow(10, market.base_token.symbol.precision) : 0;
	}
}

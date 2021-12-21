import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {lastValueFrom} from "rxjs";
import {Account, LightAccount, LightBalances, Market, NFT, NFTSale, Order} from "./interfaces";

export interface PricePoint {
	time: Date
	price: number
}

export interface NFTInfo {
	id: string
	collection: string
	schema: string
	template: string
}

@Injectable()
export class WaxService {

	tokenPricesCache: { [key: string]: PricePoint[] } = {};
	nftPricesCache: { [key: string]: PricePoint[] } = {};

	account?: Account
	markets?: Market[];
	balances?: LightBalances[]
	nfts?: NFT[];
	marketsByQuoteNameContract: { [key: string]: Market } = {}; // TOKEN@Contract
	progress?: number
	progressIndex = 0

	constructor(private http: HttpClient) {

	}

	async changeAccount(account: string) {

		this.progress = undefined;
		this.progressIndex = 0;
		this.markets = undefined;
		this.nfts = undefined;

		const acc = await lastValueFrom(this.http.post<Account>(`api/chain/get_account`, {
			account_name: account
		}));

		acc.calculated = {
			balances: [],
			nfts: []
		}

		if (this.account) {
			// workaround to cancel all requests
			location.pathname = '/' + account;
		} else {
			this.account = acc;
		}


		const lightInfo: LightAccount = await lastValueFrom(this.http.get<LightAccount>(`light/accinfo/wax/${account}`));


		let wax = parseFloat(this.account.core_liquid_balance.split(' ')[0]);

		for (const staked of lightInfo.delegated_to) {
			wax += staked.net_weight / Math.pow(10, 8)
			wax += staked.cpu_weight / Math.pow(10, 8)
		}

		this.account.calculated.balances.push({
			amount: wax,
			wax: wax,
			name: "WAX"
		});

		const data = await lastValueFrom(this.http.get<{ balances: LightBalances[] }>(`light/balances/wax/${account}`));
		this.balances = data.balances.filter(b =>
			parseFloat(b.amount) > 0 && b.currency !== "WAX"
		);

		this.getMarkets().then(async markets => {

			// Tokens
			this.markets = markets
			this.markets = this.markets.filter(m => m.base_token.symbol.name === 'WAX')

			for (const market of this.markets) {
				this.marketsByQuoteNameContract[market.quote_token.str] = market;
			}

			for (const balance of this.balances) {
				const market = this.marketsByQuoteNameContract[balance.currency + '@' + balance.contract];
				const amount = parseFloat(balance.amount);
				if (market) {
					const bid = await this.getBestBID(market);

					this.account.calculated.balances.push({
						amount: amount,
						name: balance.currency,
						wax: amount * bid
					})
				} else {
					this.account.calculated.balances.push({
						amount: amount,
						name: balance.currency,
						wax: 0
					})
				}
				this.updateProgress();
			}

		});

		// NFTs
		//this.loadNFTs().then();

	}

	async loadNFTs() {
		const res = await lastValueFrom(this.http.get<{ data: NFT[] }>(`atomicassets/assets?owner=${this.account.account_name}`));

		this.nfts = res.data
		for (const nft of this.nfts) {

			await new Promise(resolve => setTimeout(resolve, 1000));

			const sales = await lastValueFrom(this.http.get<{ data: NFTSale[] }>(
				`atomicassets/prices/sales/days?collection_name=${nft.collection.collection_name}&schema_name=${nft.schema.schema_name}&symbol=WAX&template_id=${nft.template.template_id}`
			));

			this.account.calculated.nfts.push({
				name: nft.name,
				wax: sales.data[0] ? parseInt(sales.data[0].median) / Math.pow(10, 8) : 0,
				amount: 1,
				sales: sales.data
			})
			this.updateProgress();
		}
	}

	updateProgress() {
		this.progressIndex++;
		if (this.nfts && this.balances) {
			this.progress = this.progressIndex / (this.balances.length + this.nfts.length) * 100
		}
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
		const resBuy = await lastValueFrom(this.http.post<{ rows: Order[] }>(url, payload));
		return resBuy.rows[0] ? parseInt(resBuy.rows[0].unit_price) / Math.pow(10, market.base_token.symbol.precision) : 0;
	}

	async getTokenPriceHistory(token: string): Promise<PricePoint[]> {
		if (this.tokenPricesCache[token]) {
			return this.tokenPricesCache[token];
		}

		const market = this.marketsByQuoteNameContract[token];
		const prices = [];
		if (market) {
			const res = await lastValueFrom(this.http.get<{
				time: string
				open: number
				close: number
				low: number
			}[]>(`https://wax.alcor.exchange/api/markets/${market.id}/charts?resolution=1D`));
			for (const point of res) {
				prices.push({
					time: new Date(point.time),
					price: (point.open + point.close) / 2
				})
			}
		}

		this.tokenPricesCache[token] = prices;

		return prices;
	}

	async getNFTPriceHistory(nft: string): Promise<PricePoint[]> {
		if (this.nftPricesCache[nft]) {
			return this.nftPricesCache[nft];
		}

		// rate limit
		await new Promise(resolve => setTimeout(resolve, 1500));

		const path = nft.split("@");
		const sales = await lastValueFrom(this.http.get<{ data: NFTSale[] }>(
			`atomicassets/prices/sales/days?collection_name=${path[1]}&schema_name=${path[2]}&symbol=WAX&template_id=${path[3]}`
		));

		const prices = [];
		for (const sale of sales.data) {
			prices.push({
				time: new Date(sale.time),
				price: parseInt(sale.median) / Math.pow(10, 8)
			})
		}
		this.nftPricesCache[nft] = prices;
		return prices;
	}

	async getNFTInfo(id: string): Promise<NFTInfo> {
		const res = await lastValueFrom(this.http.get<any>(`atomicassets/assets/${id}`))

		return {
			id,
			collection: res.data.collection.collection_name,
			schema: res.data.schema.schema_name,
			template: res.data.template.template_id
		}
	}
}

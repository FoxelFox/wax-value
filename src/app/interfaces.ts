export interface Account {
	account_name: string
	head_block_num: number
	head_block_time: string
	privileged: boolean
	last_code_update: string
	created: string
	core_liquid_balance: string // "3353.36033605 WAX"
	ram_quota: number
	net_weight: number
	cpu_weight: string
	net_limit: AccountLimit
	cpu_limit: AccountLimit
	ram_usage: number,
	permissions: [{ "perm_name": "active", "parent": "owner", "required_auth": { "threshold": 2, "keys": [{ "key": "EOS8MBSjMt6szU4JzVcbBpDKkhhsiPr1MPd3BTyKupozGdvCnYMBM", "weight": 1 }], "accounts": [{ "permission": { "actor": "managed.wax", "permission": "cosign" }, "weight": 1 }], "waits": [] } }, { "perm_name": "owner", "parent": "", "required_auth": { "threshold": 1, "keys": [], "accounts": [{ "permission": { "actor": "managed.wax", "permission": "active" }, "weight": 1 }], "waits": [] } }],
	"total_resources": { "owner": "dknra.wam", "net_weight": "21.15746980 WAX", "cpu_weight": "5755.10800674 WAX", "ram_bytes": 324219 },
	"self_delegated_bandwidth": { "from": "dknra.wam", "to": "dknra.wam", "net_weight": "21.15746980 WAX", "cpu_weight": "5755.10800674 WAX" },
	"refund_request": null,
	"voter_info": { "owner": "dknra.wam", "proxy": "bloksioproxy", "producers": [], "staked": "647626547654", "unpaid_voteshare": "67412323176531656107049475268759611171143680.00000000000000000", "unpaid_voteshare_last_updated": "2021-11-26T21:52:56.000", "unpaid_voteshare_change_rate": "180157337358676443578814433061790285824.00000000000000000", "last_claim_time": "2021-11-22T12:18:33.000", "last_vote_weight": "180157337358676443578814433061790285824.00000000000000000", "proxied_vote_weight": "0.00000000000000000", "is_proxy": 0, "flags1": 0, "reserved2": 0, "reserved3": "0 " },
	rex_info: null
	subjective_cpu_bill_limit: AccountLimit
	calculated: {
		balances: {
			name: string
			amount: number
			wax: number
		}[]
		nfts: {
			name: string
			amount: number
			wax: number
			sales: NFTSale[]
		}[]
	}
}

export interface AccountLimit {
	used: number
	available: number
	max: number
}

export interface LightAccount {
	delegated_to: {
		account_name: string
		cpu_weight: number
		net_weight: number
	}[]
}

export interface LightBalances {
	amount: string
	contract: string
	currency: string
	decimals: string
}

export interface Symbol {
	name: string
	precision: number
}

export interface Token {
	contract: string
	symbol: Symbol
	str: string
}

export interface Market {
	id: number
	base_token: Token
	quote_token: Token
	min_buy: string // like '0.0001 AETHER'
	min_sell: string // like '0.0001 DUST'
	frozen: number
	fee: number
	last_price: number
	volume24: number
	volumeWeek: number
	volumeMonth: number
	change24: number // %
	changeWeek: number // %
}

export interface Order {
	account: string
	ask: string
	bid: string
	id: number
	timestamp: number
	unit_price: string // this is a Integer String
}

export interface NFT {
	asset_id: "1099584685824"
	auctions: []
	backed_tokens: []
	burned_at_block: null
	burned_at_time: null
	burned_by_account: null
	collection: {
		allow_notify: true
		author: "fd3u.wam"
		authorized_accounts: string[]
		collection_name: "zombiecoinzz"
		created_at_block: "119211485"
		created_at_time: "1621047160000"
		img: "QmNtdQfuwRGKnnD2bmn5GxQ3AkTrjpVmzLYuoJzjFfdAAA"
		market_fee: 0.05
		name: "Zombiecoin"
		notify_accounts: []
	}
	contract: "atomicassets"
	data: {
		img: "QmcK43DuXvCwHQi9R1hi3maRdAjyzCpYWYkwthbjRAxPrm"
		"link to exchange": "https://www.zombiecoin.io/exchangeshop"
		name: "Wood (8)"
		quantity: "8"
	}
	immutable_data: {}
	is_burnable: true
	is_transferable: true
	minted_at_block: "153139310"
	minted_at_time: "1638023851500"
	mutable_data: {}
	name: "Wood (8)"
	owner: "dknra.wam"
	prices: {
		average: "228052464"
		market_contract: "atomicmarket"
		max: "2000000000"
		median: "180000000"
		min: "8000000"
		sales: "1201"
		suggested_average: "60720000"
		suggested_median: "59400000"
		token: {
			token_contract: "eosio.token"
			token_precision: 8
			token_symbol: "WAX"
		}
	}[]
	sales: []
	schema: { schema_name: string }
	template: {
		template_id: "243527",
		max_supply: "0",
		is_transferable: true,
		is_burnable: true
		// and more ...
	}
	template_mint: "19308"
	transferred_at_block: "153139310"
	transferred_at_time: "1638023851500"
	updated_at_block: "153139310"
	updated_at_time: "1638023851500"
}

export interface NFTSale {
	average: "2336134"
	median: "1230000"
	sales: "438"
	time: 1638014400000
	token_contract: "eosio.token"
	token_precision: 8
	token_symbol: "WAX"
}

export interface Transaction {
	account_action_seq: number
	action_trace: {
		account_ram_deltas: RamDelta[]
		act: Act
		action_ordinal: number
		block_num: number
		block_time: string
		closest_unnotified_ancestor_action_ordinal: number
		context_free: boolean
		creator_action_ordinal: number
		elapsed: number
		producer_block_id: string
		receipt: Receipt
		receiver: string
		trx_id: string
	},
	block_num: number
	block_time: string
	global_action_seq: number
	irreversible: boolean
}

export interface Receipt {
	abi_sequence: number
	act_digest: string
	auth_sequence: [string, number][]
	code_sequence: number
	global_sequence: number
	receiver: string
	recv_sequence: number
}

export interface RamDelta {
	account: string
	delta: number
}

export interface Act {
	account: string
	authorization: {
		actor: string,
		permission: "active" | "xfer"
	}[],
	data: any
	hex_data: string
	name: string
}

export interface AlcorTrade {
	_id: string
	market: number
	type: "buymatch" | "sellmatch"
	trx_id: string // WAX trx_id
	unit_price: number
	ask: number
	bid: number
	bidder: string // WAX account
	time: string // ISO Date String
}

export interface CSVRecord {
	type: "Einnahme" | "Ausgabe" | "Einzahlung" | "Auszahlung" | "Zinsen" | "Trade" | "Minting"
	buy_amount?: number
	buy_currency?: string
	sell_amount?: number
	sell_currency?: string
	fee?: string
	fee_currency?: string
	exchange?: string
	trade_group?: string
	comment?: string
	date: Date
}


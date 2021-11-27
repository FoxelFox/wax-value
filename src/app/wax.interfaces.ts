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
	permissions:[{"perm_name":"active","parent":"owner","required_auth":{"threshold":2,"keys":[{"key":"EOS8MBSjMt6szU4JzVcbBpDKkhhsiPr1MPd3BTyKupozGdvCnYMBM","weight":1}],"accounts":[{"permission":{"actor":"managed.wax","permission":"cosign"},"weight":1}],"waits":[]}},{"perm_name":"owner","parent":"","required_auth":{"threshold":1,"keys":[],"accounts":[{"permission":{"actor":"managed.wax","permission":"active"},"weight":1}],"waits":[]}}],"total_resources":{"owner":"dknra.wam","net_weight":"21.15746980 WAX","cpu_weight":"5755.10800674 WAX","ram_bytes":324219},"self_delegated_bandwidth":{"from":"dknra.wam","to":"dknra.wam","net_weight":"21.15746980 WAX","cpu_weight":"5755.10800674 WAX"},"refund_request":null,"voter_info":{"owner":"dknra.wam","proxy":"bloksioproxy","producers":[],"staked":"647626547654","unpaid_voteshare":"67412323176531656107049475268759611171143680.00000000000000000","unpaid_voteshare_last_updated":"2021-11-26T21:52:56.000","unpaid_voteshare_change_rate":"180157337358676443578814433061790285824.00000000000000000","last_claim_time":"2021-11-22T12:18:33.000","last_vote_weight":"180157337358676443578814433061790285824.00000000000000000","proxied_vote_weight":"0.00000000000000000","is_proxy":0,"flags1":0,"reserved2":0,"reserved3":"0 "},
	rex_info: null
	subjective_cpu_bill_limit: AccountLimit
	calculated: {
		balances: {
			name: string
			amount: number
			wax: number
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


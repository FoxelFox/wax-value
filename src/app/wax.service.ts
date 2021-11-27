import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {lastValueFrom} from "rxjs";
import {Account, AccountLight} from "./wax.interfaces";

@Injectable()
export class WaxService {

	account: Account

	constructor(private http: HttpClient) {

	}

	async changeAccount(account: string) {
		this.account = await lastValueFrom(this.http.post<Account>(`api/chain/get_account`, {
			account_name: account
		}));

		const lightInfo: AccountLight = await lastValueFrom(this.http.get<AccountLight>(`light/accinfo/wax/${account}`));



		this.account.calculated = {
			combinedBaseBalance:
				parseFloat(this.account.core_liquid_balance.split(' ')[0]) +
				parseFloat(this.account.total_resources.cpu_weight.split(' ')[0]) +
				parseFloat(this.account.total_resources.net_weight.split(' ')[0])
		}

		for (const staked of lightInfo.delegated_to) {
			if (staked.account_name !== account) {
				this.account.calculated.combinedBaseBalance += staked.net_weight / Math.pow(10, 8)
				this.account.calculated.combinedBaseBalance += staked.cpu_weight / Math.pow(10, 8)
			}
		}
	}
}

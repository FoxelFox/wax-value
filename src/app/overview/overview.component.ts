import {Component} from "@angular/core";
import {WaxService} from "../wax.service";

@Component({
	selector: 'overview',
	templateUrl: 'overview.component.html',
	styleUrls: ['overview.component.scss']
})
export class OverviewComponent {

	tokens: {name: string, value: number}[] = [];

	constructor(
		public wax: WaxService
	) {
		console.log(this.wax.account.calculated.balances)

	}

	load() {

	}

	get total() {
		let total = 0;
		for(const token of this.wax.account.calculated.balances) {
			total += token.wax;
		}

		for(const nft of this.wax.account.calculated.nfts) {
			total += nft.wax;
		}
		return total.toFixed(2) + ' WAX'
	}
}

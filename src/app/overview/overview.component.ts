import {Component} from "@angular/core";
import {WaxService} from "../wax.service";

@Component({
	selector: 'overview',
	templateUrl: 'overview.component.html'
})
export class OverviewComponent {

	constructor(
		public wax: WaxService
	) {
	}
}

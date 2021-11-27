import {Component, OnInit} from '@angular/core';
import { Router} from "@angular/router";
import {WaxService} from "./wax.service";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	account: string

	constructor(
		public router: Router,
		public wax: WaxService
	) {

	}

	async ngOnInit() {
		this.account = location.pathname.slice(1);
		await this.search();
		this.account = location.pathname.slice(1);
	}

	async search() {
		try {
			await this.wax.changeAccount(this.account)
			await this.router.navigate([this.account]);
		} catch (e) {
			// account not found
			await this.router.navigate([""]);
		}
	}
}

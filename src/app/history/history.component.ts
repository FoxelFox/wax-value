import {Component, OnInit} from "@angular/core";
import {HistoryService} from "./history.service";
import {CsvStringifierFactory, ObjectCsvStringifierParams} from "../../../lib/csv-stringifier-factory";

const csvStringifierFactory = new CsvStringifierFactory();
const createObjectCsvStringifier = (params: ObjectCsvStringifierParams) =>
	csvStringifierFactory.createObjectCsvStringifier(params);

@Component({
	selector: 'history',
	templateUrl: 'history.component.html',
	styleUrls: ['history.component.scss']
})
export class HistoryComponent implements OnInit {

	constructor(
		public history: HistoryService
	) {

	}

	async ngOnInit() {
		await this.history.fetchHistory()
	}

	download() {
		// map WAX to WAXP
		const copy = JSON.parse(JSON.stringify(this.history.fullHistory));
		for (const line of copy) {
			line.buy_currency = line.buy_currency === "WAX" ? "WAXP" : line.buy_currency;
			line.sell_currency = line.sell_currency === "WAX" ? "WAXP" : line.sell_currency;
		}

		const csvStringifier  = createObjectCsvStringifier({
			header: [
				{id: 'type', title: 'Type'},
				{id: 'buy_amount', title: 'Buy Amount'},
				{id: 'buy_currency', title: 'Buy Currency'},
				{id: 'sell_amount', title: 'Sell Amount'},
				{id: 'sell_currency', title: 'Sell Currency'},
				{id: 'fee', title: 'Fee'},
				{id: 'fee_currency', title: 'Fee Currency'},
				{id: 'exchange', title: 'Exchange'},
				{id: 'trade_group', title: 'Trade-Group'},
				{id: 'comment', title: 'Comment'},
				{id: 'date', title: 'Date'},
				//{id: 'debug', title: 'Debug'},
			]
		});

		const csvString = csvStringifier.stringifyRecords(copy);

		let element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvString));
		element.setAttribute('download', "output.csv");

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}

}

import {Component, OnInit} from "@angular/core";
import {HistoryService} from "./history.service";
import {CsvStringifierFactory, ObjectCsvStringifierParams} from "../../../lib/csv-stringifier-factory";
import {Chart, ChartConfiguration, ChartData, ChartItem, registerables} from "chart.js";
import 'chartjs-adapter-moment';
import {CSVRecord} from "../interfaces";
import {WaxService} from "../wax.service";

Chart.register(...registerables);
const csvStringifierFactory = new CsvStringifierFactory();
const createObjectCsvStringifier = (params: ObjectCsvStringifierParams) =>
	csvStringifierFactory.createObjectCsvStringifier(params);

interface Value {
	tokens: { [key: string]: number }
	date: Date
	worth: {
		wax: number
		usd: number
	}
}

interface ValuePerDay {
	[key: string]: Value
}

const STEP = 1000 * 60 * 60 * 12;

@Component({
	selector: 'history',
	templateUrl: 'history.component.html',
	styleUrls: ['history.component.scss']
})
export class HistoryComponent implements OnInit {
	chart: Chart
	data: ChartData = {
		datasets: [{
			label: 'Total Value in WAX',
			backgroundColor: 'rgba(40, 40, 40)',
			borderColor: 'rgba(160, 255, 40)',
			data: [],
		}]
	}

	config: ChartConfiguration = {
		type: 'line',
		data: this.data,
		options: {
			animation: {
				duration: 0
			},
			elements: {
				line: {
					borderWidth: 2.0
				},
				point: {
					radius: 0
				}
			},
			scales: {
				x: {
					ticks: {
						autoSkipPadding: 50,
						maxRotation: 0
					},
					type: 'time'
				}
			}
		}
	};

	valuePerDay: ValuePerDay = {};
	lastTokenValues: {
		name: string
		value: number
		amount: number
	}[] = [];

	constructor(
		public history: HistoryService,
		public wax: WaxService
	) {

	}

	async ngOnInit() {
		this.chart = new Chart(
			document.getElementById('performance') as ChartItem,
			this.config
		);
		let iterator = this.history.fetchHistory();
		let results: CSVRecord[]
		let day: number = 0;
		let bucket: Value

		while (results = (await iterator.next()).value) {
			for (const result of results) {

				const date = new Date(result.date.getTime())
				date.setMinutes(0, 0, 0);
				let newDay = date.getTime();

				if (day !== newDay) {
					// copy value from last day
					if (day) {
						await this.calculateWorth(bucket);

						// calculate worth between days with no transactions
						let i = 0;
						for (let d = day + STEP; d < newDay - STEP; d += STEP) {
							this.valuePerDay[d] = JSON.parse(JSON.stringify(this.valuePerDay[day]));
							this.valuePerDay[d].date = new Date(bucket.date.getTime() + (++i) * STEP);
							await this.calculateWorth(this.valuePerDay[d]);
						}

						this.valuePerDay[newDay] = JSON.parse(JSON.stringify(this.valuePerDay[day]));
					} else {
						this.valuePerDay[newDay] = {
							tokens: {},
							date: undefined,
							worth: {
								wax: 0,
								usd: 0
							}
						}
					}
					bucket = this.valuePerDay[newDay]
					bucket.date = result.date
					bucket.date.setMinutes(0, 0, 0);
					day = newDay;
				}

				switch (result.type) {
					case "Einnahme":
					case "Einzahlung":
						this.in(bucket, result);
						break;
					case "Ausgabe":
					case "Auszahlung":
						this.out(bucket, result);
						break;
					case "Trade":
						this.in(bucket, result);
						this.out(bucket, result);
						break;
				}
			}
		}
		await this.calculateWorth(bucket);
	}

	in(bucket: Value, result: CSVRecord) {
		bucket.tokens[result.buy_currency] = bucket.tokens[result.buy_currency] ? bucket.tokens[result.buy_currency] + result.buy_amount : result.buy_amount;
	}

	out(bucket: Value, result: CSVRecord) {
		bucket.tokens[result.sell_currency] = bucket.tokens[result.sell_currency] ? bucket.tokens[result.sell_currency] - result.sell_amount : result.sell_amount;
		if (bucket.tokens[result.sell_currency] < 0) {
			console.log(bucket)
			console.log(this.valuePerDay)
			console.log(this.history.history)
			debugger;
		}
	}

	/**
	 * Converts known tokens to there commonly used designation.
	 * This is required for CoinTracking
	 * @param token
	 */
	convertCurrency(token: string) {
		switch (token) {
			case "WAX@eosio.token":
				return "WAXP";
			case "TLM@alien.worlds":
				return "TLM";
			default:
				return token
		}
	}

	download() {
		// map WAX to WAXP
		const full = this.history.history.concat(this.history.trades);
		full.sort((a, b) => a.date.getTime() - b.date.getTime())
		const copy = [];
		for (const line of full) {
			copy.push({
				type: line.type,
				buy_amount: line.buy_amount,
				buy_currency: this.convertCurrency(line.buy_currency),
				sell_amount: line.sell_amount,
				sell_currency: this.convertCurrency(line.sell_currency),
				fee: line.fee,
				fee_currency: line.fee_currency,
				exchange: line.exchange,
				trade_group: line.trade_group,
				comment: line.comment,
				date: line.date.toISOString()
			});
		}

		const csvStringifier = createObjectCsvStringifier({
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

	formatDate(date: Date) {
		return date.toLocaleDateString();
	}

	async calculateWorth(bucket: Value) {
		if (!bucket) {
			return
		}

		let worth = 0;
		for (const token in bucket.tokens) {
			if (token === "WAX@eosio.token") {
				worth += bucket.tokens[token]
				this.updateLastTokenValue(token, bucket.tokens[token], bucket.tokens[token]);
			} else if (token === "WEED@createtokens") {
				// ignore
			} else {
				const history = await this.wax.getTokenPriceHistory(token);
				const tokenPriceOnDay = history.find(h => h.time.getTime() >= (bucket.date.getTime() - STEP * 2))
				if (tokenPriceOnDay) {
					const tokenWorth = tokenPriceOnDay.price * bucket.tokens[token];
					worth += tokenWorth;
					this.updateLastTokenValue(token, tokenWorth, bucket.tokens[token]);
				} else {
					console.log("No price found for token ", token)
					console.log(bucket.date);
					console.log(history);
				}
			}


		}
		bucket.worth.wax = worth
		// TODO USD Price

		this.lastTokenValues.sort((a, b) => b.value - a.value);

		this.chart.data.datasets[0].data.push({
			x: bucket.date.getTime(),
			y: bucket.worth.wax
		});
		this.chart.update();
	}

	updateLastTokenValue(token: string, value: number, amount: number) {
		let entry = this.lastTokenValues.find(t => t.name == token);
		if (!entry) {
			entry = {name: token, value, amount}
			this.lastTokenValues.push(entry);
		} else {
			entry.amount = amount;
			entry.value = value;
		}
	}
}

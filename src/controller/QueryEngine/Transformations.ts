import Decimal from "decimal.js";
import {InsightResult} from "../IInsightFacade";

export default class Transformations {
	private res: InsightResult[];
	private group: string[];
	private apply: any;
	private groups: any;
	private columnHeaders: string[];

	constructor(res: InsightResult[], group: string[], apply: any) {
		this.res 		   = res;
		this.group  	   = group;
		this.apply  	   = apply;
		this.groups 	   = {};
		this.columnHeaders = group;
	}

	public getNewResults(): InsightResult[] {
		this.groupRows();
		let ret = this.applyRules();
		return this.applyRules();
	}

	private groupRows() {
		for (const x in this.res) {
			// apply to all terms in groups, not just one
			let groupKey: any = [];
			for (const i of this.group) {
				groupKey.push(this.res[x][i]);
			}

			// fixes 'cannot push on undefined' error
			if (!this.groups[JSON.stringify(groupKey)]) {
				this.groups[JSON.stringify(groupKey)] = [];
			}

			this.groups[JSON.stringify(groupKey)].push(this.res[x]);
		}
	}

	private applyRules(): InsightResult[] {
		let ret: InsightResult[] = [];
		for (const groupKey in this.groups) {
			let add: InsightResult = {};
			let groupCols: any[] = JSON.parse(groupKey);
			for (const index in groupCols) {
				add[this.columnHeaders[index]] = groupCols[index];
			}
			for (const applyRule in this.apply) {
				for (const applyKey in this.apply[applyRule]) {
					if (this.columnHeaders.indexOf(applyKey) === -1) {
						this.columnHeaders.push(applyKey);
					}
					for (const applyToken in this.apply[applyRule][applyKey]) {
						let key: string = this.apply[applyRule][applyKey][applyToken];
						switch (applyToken) {
							case "MAX":
								add[applyKey] = this.getMax(this.groups[groupKey], key);
								break;
							case "MIN":
								add[applyKey] = this.getMin(this.groups[groupKey], key);
								break;
							case "AVG":
								add[applyKey] = this.getAvg(this.groups[groupKey], key);
								break;
							case "COUNT":
								add[applyKey] = this.getCount(this.groups[groupKey], key);
								break;
							case "SUM":
								add[applyKey] = this.getSum(this.groups[groupKey], key);
								break;
						}
					}
				}
			}
			ret.push(add);
		}
		return ret;
	}

	private getMax(groupResults: InsightResult[], applyKey: any): number {
		let max: number = -Infinity;
		for (const row of groupResults) {
			if ((row[applyKey] as number) > max) {
				max = (row[applyKey] as number);
			}
		}
		return max;
	}

	private getMin(groupResults: InsightResult[], applyKey: any): number {
		let min: number = Infinity;
		for (const row of groupResults) {
			if ((row[applyKey] as number) < min) {
				min = (row[applyKey] as number);
			}
		}
		return min;
	}

	private getAvg(groupResults: InsightResult[], applyKey: any): number {
		let sum: Decimal = new Decimal(0);
		for (const row of groupResults) {
			sum = sum.add(new Decimal(row[applyKey]));
		}
		let average: number = Number(Number(sum.toNumber() / groupResults.length).toFixed(2));
		return average;
	}

	private getCount(groupResults: InsightResult[], applyKey: any): number {
		let countSet = new Set();
		for (const row of groupResults) {
			countSet.add(row[applyKey]);
		}
		return countSet.size;
	}

	private getSum(groupResults: InsightResult[], applyKey: any): number {
		let sum: Decimal = new Decimal(0);
		for (const row of groupResults) {
			sum = sum.add(new Decimal(row[applyKey]));
		}
		return Number(sum.toFixed(2));
	}
}

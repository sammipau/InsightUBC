import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";
import QueryBaseResults from "./BaseResults";
import QueryParser from "./Parser";
import Transformations from "./Transformations";

export default class Query {
	private parser: QueryParser;
	private res: InsightResult[];
	private baseResults: QueryBaseResults;

	constructor(parse: QueryParser, data: Map<string, any[]>) {
		this.parser 	 = parse;
		this.baseResults = new QueryBaseResults(parse, data);
		this.res 		 = [];
	}

	public results(): InsightResult[] {
		this.res = this.getWhereResults(this.parser.where, null);

		if (this.parser.hasTransformations()) {
			this.res = this.applyTransformations();
		}

		if (this.res.length >= 5000) {
			throw new ResultTooLargeError("Too many results.");
		}

		if (this.parser.order !== "") {
			this.singleOrder();
		}
		if (this.parser.dir === "UP") {
			this.sortAsc();
		}
		if (this.parser.dir === "DOWN") {
			this.sortDesc();
		}

		this.res = this.getFinalResults();

		return this.res;
	}

	private getFinalResults(): InsightResult[] {
		let ret: InsightResult[] = [];
		for (const row of this.res) {
			let add: InsightResult = {};
			for (const key in row) {
				if (this.parser.endCols.indexOf(key) !== -1) {
					add[key] = row[key];
				}
			}
			ret.push(add);
		}
		return ret;
	}

	private singleOrder() {
		this.res.sort((a, b) => {
			if (a[this.parser.order] < b[this.parser.order]) {
				return -1;
			} else if (a[this.parser.order] > b[this.parser.order]) {
				return 1;
			}
			return 0;
		});
	}

	private sortDesc() {
		this.res.sort((a, b) => {
			if (a[this.parser.keys[0]] > b[this.parser.keys[0]]) {
				return -1;
			} else if (a[this.parser.keys[0]] < b[this.parser.keys[0]]) {
				return 1;
			} else {
				if (this.parser.keys.length > 1) {
					return this.solveTieDesc(a, b, this.parser.keys[1], 1);
				}
				return 0;
			}
		});
	}

	private solveTieDesc(a: any, b: any, key: string, index: number): number {
		if (a[key] > b[key]) {
			return -1;
		} else if (a[key] < b[key]) {
			return 1;
		} else {
			if (index < this.parser.keys.length) {
				index++;
				return this.solveTieAsc(a, b, this.parser.keys[1], index);
			}
			return 0;
		}
	}

	private sortAsc() {
		this.res.sort((a, b) => {
			if (a[this.parser.keys[0]] < b[this.parser.keys[0]]) {
				return -1;
			} else if (a[this.parser.keys[0]] > b[this.parser.keys[0]]) {
				return 1;
			} else {
				if (this.parser.keys.length > 1) {
					return this.solveTieAsc(a, b, this.parser.keys[1], 1);
				}
				return 0;
			}
		});
	}

	private solveTieAsc(a: any, b: any, key: string, index: number): number {
		if (a[key] < b[key]) {
			return -1;
		} else if (a[key] > b[key]) {
			return 1;
		} else {
			if (index < this.parser.keys.length) {
				index++;
				return this.solveTieAsc(a, b, this.parser.keys[1], index);
			}
			return 0;
		}
	}

	private applyTransformations(): InsightResult[] {
		let trans: Transformations = new Transformations(this.res, this.parser.group, this.parser.apply);
		return trans.getNewResults();
	}

	private getWhereResults(where: Map<string, any>, filterData: any): InsightResult[] {
		let values: InsightResult[] = [];
		where.forEach((wVal: any, wKey: string) => {
			switch(wKey) {
				case "GT": {
					values = this.baseResults.getGT(wVal, filterData);
					break;
				}
				case "LT": {
					values =  this.baseResults.getLT(wVal, filterData);
					break;
				}
				case "EQ": {
					values =  this.baseResults.getEQ(wVal, filterData);
					break;
				}
				case "IS": {
					values =  this.baseResults.getIS(wVal, filterData);
					break;
				}
				case "AND": {
					values =  this.getAND(wVal, filterData);
					break;
				}
				case "OR": {
					values =  this.getOR(wVal, filterData);
					break;
				}
				case "NOT": {
					values =  this.getNOT(wVal, filterData);
					break;
				}
				default: {
					values = this.baseResults.getAll(this.parser.validator.dataSetKey);
				}
			}
		});
		return values;
	}

	private getAND(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		let filter: Map<string, any[]> = new Map<string, any>();

		// Get results from first filter
		filter.set(wVal[0][0], wVal[0][1]);
		let first: InsightResult[] = this.getWhereResults(filter, filterData);
		filter.delete(wVal[0][0]);

		if (wVal[1] !== undefined) {
			// Get results from second filter
			filter.set(wVal[1][0], wVal[1][1]);
			ret = this.getWhereResults(filter, first);
		} else {
			ret = first;
		}

		return ret;
	}

	private getOR(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		let filter: Map<string, any[]> = new Map<string, any>();

		// Get results from first filter and set to ret
		filter.set(wVal[0][0], wVal[0][1]);
		let first: InsightResult[] = this.getWhereResults(filter, filterData);
		filter.delete(wVal[0][0]);

		let second: InsightResult[] = [];
		// Get results from second filter
		if (wVal[1] !== undefined) {
			// Get results from second filter
			filter.set(wVal[1][0], wVal[1][1]);
			second = this.getWhereResults(filter, filterData);
		} else {
			ret = first;
			return ret;
		}

		// ret = first but has to allocate its own memory
		for (const fRow in first) {
			ret.push(first[fRow]);
		}

		for (const sRow in second) {
			let isIn: boolean = false;
			for (const fRow in first) {
				if (first[fRow] !== undefined) {
					// If the row is in, have to delete so it deals with having duplicate rows
					if(this.areEqual(first[fRow], second[sRow])) {
						isIn = true;
						delete first[fRow];
						break;
					}
				}
			}
			if (!isIn) {
				ret.push(second[sRow]);
			}
		}

		return ret;
	}

	private getNOT(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		switch(wVal[0]) {
			case "GT": {
				let LT = [["LT",[wVal[1][0], wVal[1][1], wVal[1][2]]], ["EQ", [wVal[1][0], wVal[1][1], wVal[1][2]]]];
				ret = this.getOR(LT, filterData);
				break;
			} case "LT": {
				let GT = [["GT", [wVal[1][0], wVal[1][1], wVal[1][2]]], ["EQ", [wVal[1][0], wVal[1][1], wVal[1][2]]]];
				ret =  this.getOR(GT, filterData);
				break;
			} case "EQ": {
				ret = this.baseResults.getNotEQ(wVal[1],filterData);
				break;
			} case "AND": {
				let OR = [["NOT",wVal[1][0]], ["NOT",wVal[1][1]]];
				ret =  this.getOR(OR, filterData);
				break;
			} case "OR": {
				let AND = [["NOT",wVal[1][0]], ["NOT",wVal[1][1]]];
				ret =  this.getAND(AND, filterData);
				break;
			} case "IS": {
				ret =  this.baseResults.getNotIS(wVal[1], filterData);
				break;
			} case "NOT": {
				let filter: Map<string, any[]> = new Map<string, any>();
				filter.set(wVal[1][0], wVal[1][1]);
				ret = this.getWhereResults(filter, filterData);
				break;
			}
		}
		return ret;
	}

	// Use ChatGPT to generate this function
	private areEqual(result1: InsightResult, result2: InsightResult): boolean {
		const keys1 = Object.keys(result1);
		const keys2 = Object.keys(result2);

		// Check if the objects have the same set of keys
		if (keys1.length !== keys2.length || !keys1.every((key) => keys2.includes(key))) {
			return false;
		}

		// Check if all key-value pairs are identical
		return keys1.every((key) => result1[key] === result2[key]);
	}
}

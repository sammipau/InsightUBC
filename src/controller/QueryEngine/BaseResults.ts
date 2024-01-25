import {InsightError, InsightResult} from "../IInsightFacade";
import QueryParser from "./Parser";

export default class QueryBaseResults {
	private parser: QueryParser;
	private data: Map<string, any[]>;

	constructor(parse: QueryParser, data: Map<string, any[]>) {
		this.parser = parse;
		this.data 	= data;
	}

	public getAll(id: string): InsightResult[] {
		let ret: InsightResult[] = [];
		this.data.forEach((dataVal: any[], dataID: string) => {
			if (dataID === id) {
				for (const section in dataVal) {
					ret.push(this.getRow(dataVal, section));
				}
			}
		});
		return ret;
	}


	public getGT(whereFilter: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		if (filterData === null) {
			this.data.forEach((dataVal: any[], dataID: string) => {
				if (dataID === whereFilter[0]) {
					for (const section in dataVal) {
						if ((dataVal[section][whereFilter[1]] as number) > (whereFilter[2] as number)) {
							ret.push(this.getRow(dataVal, section));
						}
					}
				}
			});
		} else {
			for (const row in filterData) {
				for (const col in filterData[row]) {
					// console.log(filterData[row]);
					if ((whereFilter[0] + "_" + whereFilter[1]) === col) {
						if ((filterData[row][col] as number) > (whereFilter[2] as number)) {
							ret.push(filterData[row]);
						}
					}
				}
			}
		}
		return ret;
	}

	public getLT(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		if (filterData === null) {
			this.data.forEach((dataVal: any[], dataKey: string) => {
				if (dataKey === wVal[0]) {
					for (const section in dataVal) {
						if ((dataVal[section][wVal[1]] as number) < (wVal[2] as number)) {
							ret.push(this.getRow(dataVal, section));
						}
					}
				}
			});
		} else {
			for (const row in filterData) {
				for (const col in filterData[row]) {
					if ((wVal[0] + "_" + wVal[1]) === col) {
						if ((filterData[row][col] as number) < (wVal[2] as number)) {
							ret.push(filterData[row]);
						}
					}
				}
			}
		}
		return ret;
	}

	public getEQ(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		if (filterData === null) {
			this.data.forEach((dataVal: any[], dataKey: string) => {
				if (dataKey === wVal[0]) {
					for (const section in dataVal) {
						if ((dataVal[section][wVal[1]] as number) === (wVal[2] as number)) {
							ret.push(this.getRow(dataVal, section));
						}
					}
				}
			});
		} else {
			for (const row in filterData) {
				for (const col in filterData[row]) {
					if ((wVal[0] + "_" + wVal[1]) === col) {
						if ((wVal[2] as number) === (filterData[row][col] as number)) {
							ret.push(filterData[row]);
						}
					}
				}
			}
		}
		return ret;
	}

	public getNotEQ(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		if (filterData === null) {
			this.data.forEach((dataVal: any[], dataKey: string) => {
				if (dataKey === wVal[0]) {
					for (const section in dataVal) {
						if ((dataVal[section][wVal[1]] as number) !== (wVal[2] as number)) {
							ret.push(this.getRow(dataVal, section));
						}
					}
				}
			});
		} else {
			for (const row in filterData) {
				for (const col in filterData[row]) {
					if ((wVal[0] + "_" + wVal[1]) === col) {
						if ((wVal[2] as number) !== (filterData[row][col] as number)) {
							ret.push(filterData[row]);
						}
					}
				}
			}
		}
		return ret;
	}

	public getIS(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		if (filterData === null) {
			this.data.forEach((dataVal: any[], dataKey: string) => {
				if (dataKey === wVal[0]) {
					for (const section in dataVal) {
						if (this.isAddRow(dataVal[section][wVal[1]] as string, wVal[2] as string) ) {
							ret.push(this.getRow(dataVal, section));
						}
					}
				}
			});
		} else {
			for (const row in filterData) {
				for (const col in filterData[row]) {
					if ((wVal[0] + "_" + wVal[1]) === col) {
						if (this.isAddRow(filterData[row][col] as string, wVal[2] as string)) {
							ret.push(filterData[row]);
						}
					}
				}
			}
		}
		return ret;
	}

	public getNotIS(wVal: any[], filterData: any): InsightResult[] {
		let ret: InsightResult[] = [];
		if (filterData === null) {
			this.data.forEach((dataVal: any[], dataKey: string) => {
				if (dataKey === wVal[0]) {
					for (const section in dataVal) {
						if (this.notIsAddRow(dataVal[section][wVal[1]] as string, wVal[2] as string)) {
							ret.push(this.getRow(dataVal, section));
						}
					}
				}
			});
		} else {
			for (const row in filterData) {
				for (const col in filterData[row]) {
					if ((wVal[0] + "_" + wVal[1]) === col) {
						if (this.notIsAddRow(filterData[row][col] as string, wVal[2] as string)) {
							ret.push(filterData[row]);
						}
					}
				}
			}
		}
		return ret;
	}

	private getRow(dataVal: any, section: any): InsightResult {
		// if (this.trans) {
		let add: InsightResult = {};
		for (const col in this.parser.columns) {
			if (this.parser.columns[col].indexOf("_") !== -1) {
				let field = this.parser.columns[col].split("_");
				add[this.parser.columns[col]] = dataVal[section][field[1]];
			}
		}
		return add;
		// } else {
		// 	let add: InsightResult = {};
		// 	for (const col in this.parser.endCols) {
		// 		if (this.parser.endCols[col].indexOf("_") !== -1) {
		// 			let field = this.parser.endCols[col].split("_");
		// 			add[this.parser.endCols[col]] = dataVal[section][field[1]];
		// 		}
		// 	}
		// 	return add;
		// }
	}

	private checkAsterisk(s: string): number {
		if (s.indexOf("*") === -1) {
			return 0;
		} else if (s[0] === "*" && s[s.length - 1] === "*" && s.length !== 1) {
			return 1;
		} else if (s[0] === "*") {
			if (s.length === 1 ) {
				return 4;
			} else if (s.length === 2 && s[1] === "*") {
				return 4;
			}
			return 2;
		} else if (s[s.length - 1] === "*") {
			return 3;
		}
		throw new InsightError("Invalid wildcard.");
	}

	private isAddRow(datasetValue: string, whereValue: string): boolean {
		let num = this.checkAsterisk(whereValue);
		let wValString: string = whereValue as string;
		let wValLen: number = wValString.length - 1;
		if (num === 1) {
			if (datasetValue.includes(wValString.substring(1, wValLen))) {
				return true;
			}
		} else if (num === 2) {
			if (datasetValue.endsWith(wValString.substring(1))) {
				return true;
			}
		} else if (num === 3) {
			if (datasetValue.startsWith(wValString.substring(0, wValLen))) {
				return true;
			}
		} else if (num === 0) {
			if (datasetValue === wValString) {
				return true;
			}
		} else if (num === 4) {
			return true;
		}
		return false;
	}

	private notIsAddRow(datasetValue: string, whereValue: string): boolean {
		let num = this.checkAsterisk(whereValue);
		let wValString: string = whereValue as string;
		let wValLen: number = wValString.length - 1;
		if (num === 1) {
			if (!datasetValue.includes(wValString.substring(1, wValLen))) {
				return true;
			}
		} else if (num === 2) {
			if (!datasetValue.endsWith(wValString.substring(1))) {
				return true;
			}
		} else if (num === 3) {
			if (!datasetValue.startsWith(wValString.substring(0, wValLen))) {
				return true;
			}
		} else if (num === 0) {
			if (datasetValue !== wValString) {
				return true;
			}
		} else if (num === 4) {
			return false;
		}
		return false;
	}
}

import {InsightError} from "../IInsightFacade";

export default class QueryValidator {
	private datasetIDs: string[];
	public dataSetKey: string;
	private applyKeys: string[];
	private columns: string[];
	private transCols: string[];
	private applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
	private mkeyFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	private skeyFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
		"address", "type", "furniture", "href"];

	constructor(ids: string[]) {
		this.datasetIDs = ids;
		this.dataSetKey = "";
		this.applyKeys  = [];
		this.columns 	= [];
		this.transCols  = [];
	}

	public validateWhereKey(key: string, field: any, value: any): boolean {
		switch(key) {
			case "GT":
			case "LT":
			case "EQ": {
				if (this.skeyFields.indexOf(field) !== -1) {
					throw new Error("Wrong field type.");
				}
				return ((typeof value) === "number");
			}
			case "IS": {
				if (this.mkeyFields.indexOf(field) !== -1) {
					throw new Error("Wrong field type.");
				}
				return ((typeof value) === "string");
			}
		}
		return false;
	}

	public validateNotKey(filterList: string[]) {
		let count: number = 0;
		for (const row in filterList) {
			count++;
		}
		if (count !== 1) {
			throw new Error("Too many keys in NOT.");
		}
	}

	public validateGroup(group: any[]) {
		for (const item in group) {
			this.validateKey(group[item]);
			if (this.transCols.indexOf(group[item]) === -1) {
				this.transCols.push(group[item]);
			}
		}
	}

	public validateApply(apply: string[][]) {
		for (const index in apply) {
			this.validateApplyRule(apply[index]);
		}
	}

	public validateColumn(columns: string[], columnData: string[]) {
		this.validateAnyKeyList(columns);
		this.columns = columnData;
	}

	public validateAllColumnsPresent() {
		for (const col in this.columns) {
			if (this.transCols.indexOf(this.columns[col]) === -1) {
				throw new Error("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
			}
		}
	}

	public validateOrder(order: string) {
		if (typeof order !== "string") {
			throw new Error("Too many order columns.");
		}

		if (order.indexOf("_") !== -1) {
			let field = order.split("_");
			const id: string = field[0];
			const key: string = field[1];

			if ((typeof field[0]) !== "string" || (typeof field[1]) !== "string") {
				throw new Error("Invalid order type.");
			}

			this.inDatasetList(id);
			this.checkDifferentID(id);

			if (!this.inKeyList(key)) {
				throw new Error("Invalid order key.");
			}
		} else {
			this.validateApplyKey(order);
		}
	}

	public validateSortDir(dir: string): boolean {
		if (typeof dir !== "string") {
			throw new Error("Incorrect dir type in Sort.");
		}
		if (dir === "DOWN" || dir === "UP") {
			return true;
		}
		return false;
	}

	public validateSortKeys(sortKeys: string[]) {
		this.validateAnyKeyList(sortKeys);
	}

	private validateApplyRule(applyRule: any[]) {
		let applyKey: string = "";
		let applyValue: string[] = [];
		for (const item in applyRule) {
			applyKey = item;
			applyValue = applyRule[item];
		}
		if (applyKey.indexOf("_") !== -1) {
			throw new Error("Invalid character in key.");
		}
		if (applyKey.length < 1) {
			throw new Error("Invalid key length");
		}
		if (this.applyKeys.indexOf(applyKey) !== -1) {
			throw new Error("No duplicate apply keys allowed.");
		} else {
			this.applyKeys.push(applyKey);
			if (this.transCols.indexOf(applyKey) === -1) {
				this.transCols.push(applyKey);
			}
		}
		for (const item in applyValue) {
			this.validateApplyToken(item);
			this.validateApplyRuleKey(item, applyValue[item]);

		}
	}

	private validateApplyToken(token: string) {
		if (this.applyTokens.indexOf(token) === -1) {
			throw new Error("Apply token invalid.");
		}
	}

	private validateApplyRuleKey(token: string, key: any) {
		let field = key.split("_");
		const fieldKey: string = field[1];
		switch (token) {
			case "MAX":
			case "MIN":
			case "AVG":
			case "SUM":
				if (this.mkeyFields.indexOf(fieldKey) === -1) {
					throw new Error("Wrong Apply Key Type.");
				}
				break;
			case "COUNT":
				break;
			default:
				throw new Error("Invalid Apply Rule Token.");
		}
		this.validateKey(key);
	}

	private validateAnyKeyList(keys: string[]){
		for (const index in keys) {
			if (keys[index].indexOf("_") !== -1) {
				this.validateKey(keys[index]);
			} else {
				this.validateApplyKey(keys[index]);
			}
		}
	}

	private validateApplyKey(applyKey: string) {
		if (typeof applyKey !== "string") {
			throw new Error("Invalid key type");
		}
		if (applyKey.indexOf("_") !== -1) {
			throw new Error("Invalid character in key.");
		}
		if (applyKey.length < 1) {
			throw new Error("Invalid key length");
		}
		if (this.applyKeys.indexOf(applyKey) === -1) {
			throw new Error("Apply key is not given in the apply list.");
		}
	}

	private validateKey(givenKey: string) {
		let field = givenKey.split("_");
		const id: string = field[0];
		const key: string = field[1];

		if ((typeof id) !== "string" || (typeof key) !== "string") {
			throw new Error("Invalid key type.");
		}

		this.inDatasetList(id);
		this.checkDifferentID(id);

		if (key.indexOf("_") !== -1) {
			throw new Error("Invalid character in key.");
		}
		if (key.length < 1) {
			throw new Error("Invalid key length");
		}

		if (!this.inKeyList(key)) {
			throw new Error("Invalid key.");
		}

	}

	public inKeyList(queryKey: string): boolean {
		if (((this.mkeyFields.indexOf(queryKey) !== -1 && this.skeyFields.indexOf(queryKey) === -1)
				|| (this.mkeyFields.indexOf(queryKey) === -1 && this.skeyFields.indexOf(queryKey) !== -1))) {
			return true;
		}
		return false;
	}

	public inDatasetList(id: string) {
		if (this.datasetIDs.indexOf(id) === -1) {
			throw new Error("ID is not added.");
		}
	}

	public checkDifferentID(id: string) {
		if (this.dataSetKey !== "") {
			if (this.dataSetKey !== id) {
				throw new InsightError("ID is different than previous");
			}
		} else {
			this.dataSetKey = id;
		}
	}

	// Used ChatGPT to generate this function
	public containsKey(obj: object, key: string): boolean {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
}

import {InsightError} from "../IInsightFacade";
import QueryValidator from "./Validator";

export default class QueryParser {
	public where: Map<string, any[]>;
	public columns: string[];
	public order: string;
	public dir: string;
	public keys: string[];
	public group: string[];
	public apply: any;
	public endCols: string[];
	public validator: QueryValidator;

	private parsed: any;
	private whereFields = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];
	private trans: boolean;

	constructor(query: any, ids: string[]) {
		this.where 	   = new Map<string, any>();
		this.columns   = [];
		this.endCols   = [];
		this.order	   = "";
		this.dir	   = "";
		this.keys 	   = [];
		this.group	   = [];
		this.apply 	   = [];
		this.validator = new QueryValidator(ids);
		this.trans 	   = false;

		this.parsed = JSON.parse(JSON.stringify(query));
		if (!this.parsed.WHERE || !this.parsed.OPTIONS) {
			throw new InsightError("Missing WHERE or OPTIONS");
		}
		if (this.parsed.TRANSFORMATIONS) {
			this.getTrans(this.parsed.TRANSFORMATIONS);
		}

		let whereParts = this.getWhere(this.parsed.WHERE);
		this.where.set(whereParts[0], whereParts[1]);

		this.getOptions();

		if (this.parsed.TRANSFORMATIONS) {
			this.validator.validateAllColumnsPresent();
		}
	}

	public hasTransformations() {
		return this.trans;
	}

	private getTrans(transData: any) {
		try {
			let hasGroup: boolean = false;
			let hasApply: boolean = false;
			if (this.containsKey(transData, "GROUP")) {
				this.group = transData["GROUP"].toString().split(",");
				this.validator.validateGroup(this.group);
				hasGroup = true;
			}
			if (this.containsKey(transData, "APPLY")) {
				this.apply = JSON.parse(JSON.stringify(transData["APPLY"]));
				this.validator.validateApply(this.apply);
				for (const applyRule in this.apply) {
					for (const applyKey in this.apply[applyRule]) {
						for (const applyToken in this.apply[applyRule][applyKey]) {
							let key: string = this.apply[applyRule][applyKey][applyToken];
							if (this.columns.indexOf(key) === -1) {
								this.columns.push(key);
							}
						}
					}
				}
				hasApply = true;
			}

			if((hasGroup && !hasApply) || (!hasGroup && hasApply)) {
				throw new Error("Missing attribute in transformation.");
			} else if (hasGroup && hasApply) {
				this.trans = true;
			}

		} catch (err: any) {
			throw new InsightError(err);
		}
	}

	private getWhere(whereData: any): any[] {
		try {
			let ret: any[] = [];
			this.whereFields.forEach((filter) => {
				if (this.containsKey(whereData, filter)) {
					switch(filter) {
						case "GT": case "LT": case "IS": case "EQ": {
							// Split the "sections_avg" into ["sections", "avg"]
							let valString: string[] = [];
							for (const part in whereData[filter]) {
								valString = part.split("_");
								valString.push(whereData[filter][part]);
								if (this.columns.indexOf(part) === -1) {
									this.columns.push(part);
								}
							}
							if(!this.validator.validateWhereKey(filter, valString[1], valString[2])) {
								throw new Error("Invalid key.");
							}

							this.validator.checkDifferentID(valString[0]);
							ret[0] = filter;
							ret[1] = valString;
							break;

						}
						case "AND": case "OR": {
							let filterList: any[] = [];
							filterList[0] = this.getWhere(JSON.parse(JSON.stringify(whereData[filter][0])));
							if (whereData[filter][1] !== undefined) {
								filterList[1] = this.getWhere(JSON.parse(JSON.stringify(whereData[filter][1])));
							}
							ret[0] = filter;
							ret[1] = filterList;
							break;
						}
						case "NOT": {
							ret[0] = filter;
							ret[1] = this.getWhere(JSON.parse(JSON.stringify(whereData[filter])));
							this.validator.validateNotKey(whereData[filter]);
							break;
						}
					}
				}
			});
			return ret;
		} catch (err: any) {
			throw new InsightError(err);
		}
	}

	private getOptions() {
		try {
			const optionsData = this.parsed.OPTIONS;
			if (this.containsKey(optionsData, "COLUMNS")) {
				this.endCols = optionsData["COLUMNS"].toString().split(",");
				for (const x in this.endCols) {
					this.columns.push(this.endCols[x]);
				}
				this.validator.validateColumn(this.columns, this.endCols);
			} else {
				throw new Error("Options does not have columns.");
			}
			if (this.containsKey(optionsData, "ORDER")) {
				let sort = optionsData["ORDER"];
				let hasDir: boolean = false;
				let hasKeys: boolean = false;

				if (this.containsKey(sort, "dir")) {
					this.dir = sort["dir"];
					if (!this.validator.validateSortDir(this.dir)) {
						throw new Error("Invalid dir in Sort.");
					}
					hasDir = true;
				}
				if (this.containsKey(sort, "keys")) {
					this.keys = sort["keys"];
					this.validator.validateSortKeys(this.keys);
					for (const col in this.keys) {
						if (this.endCols.indexOf(this.keys[col]) === -1) {
							throw new Error("Keys in ORDER must be in COLUMN.");
						}
					}
					hasKeys = true;
				}

				if (!hasDir && !hasKeys) {
					if (sort === null) {
						throw new Error("Empty Sort.");
					} else {
						this.order = sort;
						this.validator.validateOrder(this.order);
					}
				} else if ((hasDir && !hasKeys) || (!hasDir && hasKeys)) {
					throw new Error("Missing attribute in sort.");
				}
			}
		} catch (err: any) {
			throw new InsightError(err);
		}
	}

	// Used ChatGPT to generate this function
	public containsKey(obj: object, key: string): boolean {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
}

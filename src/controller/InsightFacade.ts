import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import * as fs from "fs-extra";
import JSZip from "jszip";
import QueryParser from "./QueryEngine/Parser";
import Query from "./QueryEngine/Query";
import * as parse5 from "parse5";
import {findTableAndProcess} from "./DatasetProcessor/AddBuilding";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
interface Sect {
	avg: number;
	pass: number;
	fail: number;
	audit: number;
	year: number;
	dept: string;
	id: string;
	instructor: string;
	title: string;
	uuid: string;
}
export default class InsightFacade implements IInsightFacade {

	private datasets: Map<string, InsightDataset>;
	private data: Map<string,any[]>;

	constructor() {
		this.datasets = new Map<string, InsightDataset>();
		this.data = new Map<string,any[]>();
		let folderPath = "./data";
		if (fs.pathExistsSync("./data")) {
			fs.readdirSync(folderPath).forEach((id) => {
				let arr: any[] = [];
				if (fs.pathExistsSync(folderPath + "/" + id + "/rooms")) {
					fs.readdirSync(folderPath + "/" + id + "/rooms").forEach((file) => {
						arr.push(fs.readJSONSync(folderPath + "/" + id + "/rooms/" + file));
					});
					this.datasets.set(id, {id: id, kind: InsightDatasetKind.Rooms, numRows: arr.length});
				} else {
					let count = 0;
					fs.readdirSync(folderPath + "/" + id).forEach((file) => {
						const sections = fs.readJSONSync(folderPath + "/" + id + "/" + file);
						count += this.isValidCourse(sections, id, id, arr, 1);
					});
					this.datasets.set(id, {id: id, kind: InsightDatasetKind.Sections, numRows: count});
				}
				this.data.set(id, arr);
			});
		}
	}

	private validateID(id: string): boolean {
		if (id.includes("_")) {
			return true;
		}
		return id.trim() === "";
	}

	// Used ChatGPT to generate this function
	public containsKey(obj: object, key: string): boolean {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}

	public isValidCourse(course: any, id: string, relativePath: string, arr: any[] | null, ver: number): number {
		let count = 0;
		for (const section of course) {
			if (section["Section"] === "overall") {
				section["Year"] = 1900;
			}
			if (
				this.containsKey(section, "Avg") &&
				this.containsKey(section, "Pass") &&
				this.containsKey(section, "Fail") &&
				this.containsKey(section, "Audit") &&
				this.containsKey(section, "Year") &&
				this.containsKey(section, "Subject") &&
				this.containsKey(section, "Course") &&
				this.containsKey(section, "Professor") &&
				this.containsKey(section, "Title") &&
				this.containsKey(section, "id")
			) {
				const jsonObject: Sect = {
					avg: section["Avg"],
					pass: section["Pass"],
					fail: section["Fail"],
					audit: section["Audit"],
					year: parseInt(section["Year"],10),
					dept: section["Subject"],
					id: section["Course"],
					instructor: section["Professor"],
					title: section["Title"],
					uuid: section["id"],
				};
				if (arr) {
					arr.push(jsonObject);
				}
				count++;
			}
		}
		if (count && !ver) {
			fs.outputJSONSync("./data/" + id + "/" + relativePath + ".json", course);
		}
		return count;
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			if (kind === InsightDatasetKind.Sections) {
				return this.addSectionsDataset(id, content);
			} else if (kind === InsightDatasetKind.Rooms) {
				return this.addRoomsDataset(id, content);
			} else {
				return Promise.reject(new InsightError("Invalid kind."));
			}
		} catch (err: any) {
			// console.log(err);
			return Promise.reject(new InsightError());
		}
	}

	public async addRoomsDataset(id: string, content: string): Promise<string[]> {
		try {
			if (this.validateID(id) || this.data.has(id)) {
				return Promise.reject(new InsightError());
			}
			let zip = new JSZip();
			await zip.loadAsync(content, {base64: true, createFolders: true});
			const index = zip.file("index.htm");
			let promises: Array<Promise<any>> = [];
			let arr: any[] = [];
			if (index) {
				const indexContent = await index.async("text");
				let document = parse5.parse(indexContent);
				findTableAndProcess(document, arr, zip, id, promises);
				await Promise.allSettled(promises);
				if (fs.readdirSync("./data/" + id + "/rooms").length === 0) {
					return Promise.reject(new InsightError("No Valid Rooms"));
				}
				this.data.set(id, arr);
				this.datasets.set(id, {id: id, kind: InsightDatasetKind.Rooms, numRows:
						(fs.readdirSync("./data/" + id + "/rooms").length)});
			} else {
				return Promise.reject(new InsightError("Non index folder"));
			}
			return Promise.resolve(fs.readdirSync("./data"));
		} catch (error: any) {
			// console.log(error);
			return Promise.reject(new InsightError());
		}
	}

	public async addSectionsDataset(id: string, content: string): Promise<string[]> {
		try {
			if (this.validateID(id) || this.data.has(id)) {
				return Promise.reject(new InsightError());
			}
			let zip = new JSZip();
			await zip.loadAsync(content, {base64: true, createFolders: true});
			const coursesFolder = zip.folder("courses");
			let promises: Array<Promise<any>> = [];
			let arr: any[] = [];
			if (coursesFolder) {
				let totalCount = 0;
				coursesFolder.forEach(async (relativePath, file) => {
					promises.push(
						file.async("string").then(async (data) => {
							let json = JSON.parse(data);
							const sections = json.result;
							totalCount += this.isValidCourse(sections, id, relativePath, arr, 0);
						})
					);
				});
				await Promise.all(promises);
				if (totalCount === 0) {
					return Promise.reject(new InsightError("No data."));
				}
				this.data.set(id, arr);
				this.datasets.set(id, {id: id, kind: InsightDatasetKind.Sections, numRows: totalCount});
			} else {
				return Promise.reject(new InsightError("Non Existent Courses folder"));
			}

			return Promise.resolve(fs.readdirSync("./data"));
		} catch (error: any) {
			// console.log(error);
			return Promise.reject(new InsightError());
		}
	}

	public async removeDataset(id: string): Promise<string> {
		try {
			if (this.validateID(id)) {
				return Promise.reject(new InsightError("Invalid ID"));
			}
			if (!this.data.delete(id)) {
				return Promise.reject(new NotFoundError("Not found error"));
			}
			this.datasets.delete(id);
			fs.removeSync("./data/" + id);
			return Promise.resolve(id);
		} catch (err: any) {
			// console.log(err);
			return Promise.reject(new InsightError());
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			let parse = new QueryParser(query, fs.readdirSync("./data"));
			let queryEngine = new Query(parse, this.data);

			let queryResults: InsightResult[] = queryEngine.results();

			return Promise.resolve(queryResults);
		} catch (err: any) {
			// console.log(err);
			if (err instanceof InsightError || err instanceof ResultTooLargeError) {
				return Promise.reject(err);
			} else {
				return Promise.reject(new InsightError(err));
			}
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		try {
			return Promise.resolve(Array.from(this.datasets.values()));
		} catch (err: any) {
			return Promise.reject(new InsightError());
		}
	}
}

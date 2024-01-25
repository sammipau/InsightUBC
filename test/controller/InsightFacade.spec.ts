import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
	NotFoundError,
	InsightDataset
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: InsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let datasets: {[id: string]: string} = {};
	let insightFacade: InsightFacade;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");
		datasets["pair"]	  = getContentFromArchives("pair.zip");
		datasets["smallData"] = getContentFromArchives("smallData.zip");
		datasets["room"]	  = getContentFromArchives("campus.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});

	// beforeEach(function() {
	// 	clearDisk();

	// 	insightFacade = new InsightFacade();
	// });

	// it ("should successfully recover", async function() {
	// 	await insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections);
	// 	let Facade = new InsightFacade();
	// 	let result = Facade.addDataset("sections", sections, InsightDatasetKind.Sections);
	// 	return expect(result).to.eventually.be.rejectedWith(InsightError);
	// });

	// describe("Add/Remove/List Dataset", function () {
	// 	before(function () {
	// 		// console.info(`Before: ${this.test?.parent?.title}`);
	// 	});

	// 	beforeEach(function () {
	// 		// This section resets the insightFacade instance
	// 		// This runs before each test
	// 		// console.info(`BeforeTest: ${this.currentTest?.title}`);
	// 		insightFacade = new InsightFacade();
	// 	});

	// 	after(function () {
	// 		// console.info(`After: ${this.test?.parent?.title}`);
	// 	});

	// 	afterEach(function () {
	// 		// This section resets the data directory (removing any cached data)
	// 		// This runs after each test, which should make each test independent of the previous one
	// 		// console.info(`AfterTest: ${this.currentTest?.title}`);
	// 		clearDisk();
	// 	});

	// 	// This is a unit test. You should create more like this!
	// 	it ("should successfully add a dataset", function() {
	// 		const result = insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections);
	// 		return expect(result).to.eventually.have.members(["sections"]);
	// 	});
	// 	it ("should reject with  an empty dataset id", function() {
	// 		const result = insightFacade.addDataset("", sections, InsightDatasetKind.Sections);
	// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
	// 	});
	// 	it ("id contains only whitespaces", function() {
	// 		const result = insightFacade.addDataset(" ", sections, InsightDatasetKind.Sections);
	// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
	// 	});
	// 	it ("id contains only underscore", function() {
	// 		const result = insightFacade.addDataset("___", sections, InsightDatasetKind.Sections);
	// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
	// 	});
	// 	it ("Dataset already exists", async function () {
	// 		await insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections);
	// 		const result = insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections);
	// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
	// 	});
	// 	it ("removing non existent id", function() {
	// 		const result = insightFacade.removeDataset("sections");
	// 		return expect(result).to.eventually.be.rejectedWith(NotFoundError);
	// 	});
	// 	it ("should successfully remove a dataset", function() {
	// 		return insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections)
	// 			.then (()=> {
	// 				const result = insightFacade.removeDataset("sections");
	// 				return expect(result).to.eventually.deep.equal("sections");
	// 			});
	// 	});
	// 	it ("removed id contains only whitespaces", function() {
	// 		const result = insightFacade.removeDataset("     ");
	// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
	// 	});
	// 	it ("removed id contains only underscore", function() {
	// 		const result = insightFacade.removeDataset("___");
	// 		return expect(result).to.eventually.be.rejectedWith(InsightError);
	// 	});
	// 	it ("Data successfully wiped", function() {
	// 		return insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections)
	// 			.then (() => {
	// 				return insightFacade.removeDataset("sections")
	// 					.then (() => {
	// 						const result = insightFacade.removeDataset("sections");
	// 						return expect(result).to.eventually.be.rejectedWith(NotFoundError);
	// 					});
	// 			});
	// 	});
	// 	// it ("List Single", async function() {
	// 	// 	await insightFacade.addDataset("sections",sections, InsightDatasetKind.Sections);
	// 	// 	// Execution
	// 	// 	const dataset = await insightFacade.listDatasets();

	// 	// 	// Validation
	// 	// 	expect(dataset).to.deep.equal([{
	// 	// 		id: "sections",
	// 	// 		kind: InsightDatasetKind.Sections,
	// 	// 		numRows: 2
	// 	// 	}]);
	// 	// });
	// 	// it ("List Two", async function() {
	// 	// 	await insightFacade.addDataset("sections",sections, InsightDatasetKind.Sections);
	// 	// 	await insightFacade.addDataset("ubc",sections, InsightDatasetKind.Sections);
	// 	// 	// Execution
	// 	// 	const dataset = await insightFacade.listDatasets();

	// 	// 	// Validation
	// 	// 	expect(dataset).to.deep.equal([{
	// 	// 		id: "sections",
	// 	// 		kind: InsightDatasetKind.Sections,
	// 	// 		numRows: 2
	// 	// 	},
	// 	// 	{
	// 	// 		id: "ubc",
	// 	// 		kind: InsightDatasetKind.Sections,
	// 	// 		numRows: 2
	// 	// 	}]);

	// 	// });
	// 	it("List Nothing (Empty Array)", function() {
	// 		const expectedEmptyArray: InsightDataset[] = [];
	// 		const result = insightFacade.listDatasets();
	// 		return expect(result).to.eventually.have.deep.members(expectedEmptyArray);
	// 	});
	// });

	/*
	 * Test adding a dataset
	 */
	// describe("addDataset", async function() {

	// 	// Reject
	// 	it("should reject underscore IDs begining", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset("_ubc123", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject underscore IDs middle", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc_123", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject underscore IDs end", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc123_", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject solo underscore ID", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset("_", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject empty IDs", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset("", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject blank space IDs", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset(" ", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject duplicate IDs", async function() {
	// 		try {
	// 			const first: Promise<string[]> = insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(first).to.eventually.have.members(["ubc"]);
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject content with course that is not JSON", async function() {
	// 		try {
	// 			datasets["nonJSON"] = getContentFromArchives("nonJSON.zip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["nonJSON"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject content that is not a zip", async function() {
	// 		try {
	// 			datasets["notAZip"] = getContentFromArchives("notAZip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["notZip"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject a zip that has no Courses folder", async function() {
	// 		try {
	// 			datasets["noFolder"] = getContentFromArchives("noFolder.zip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["noFolder"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject a zip that has an empty Courses folder", async function() {
	// 		try {
	// 			datasets["emptyCourses"] = getContentFromArchives("emptyCourses.zip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["emptyCourse"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject content with Room instead of Section", async function() {
	// 		try {
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Rooms);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject content with no valid course", async function() {
	// 		try {
	// 			datasets["fakeCourse"] = getContentFromArchives("fakeCourse.zip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["fakeCourse"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject content that is JSON but empty", async function() {
	// 		try {
	// 			datasets["emptyJSON"] = getContentFromArchives("emptyJSON.zip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["emptyJSON"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject no sections", async function() {
	// 		try {
	// 			datasets["noSections"] = getContentFromArchives("noSections.zip");
	// 			const result: Promise<string[]> = insightFacade.addDataset("ubc", datasets["noSections"],
	// 				InsightDatasetKind.Sections);
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	// Accept
	// 	it("should add valid dataset", async function() {
	// 		try {
	// 			const result = insightFacade.addDataset("ubc", datasets["smallData"],InsightDatasetKind.Sections);
	// 			expect(result).to.eventually.have.deep.members(["ubc"]);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});
	// });

	/*
	 * Test removing a dataset
	 */
	// describe("removeDataset", async function() {
	// 	// Reject
	// 	it("should reject underscore IDs begining", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset("_ubc123");
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject underscore IDs middle", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset("ubc_123");
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject underscore IDs end", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset("ubc123_");
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject solo underscore ID", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset("_");
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject empty IDs", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset("");
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should reject blank space IDs", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset(" ");
	// 			await expect(result).to.eventually.be.rejectedWith(InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should return NotFound if the ID is valid but not found", async function() {
	// 		try {
	// 			const result: Promise<string> = insightFacade.removeDataset("ubcInNotHere");
	// 			await expect(result).to.eventually.be.rejectedWith(NotFoundError || InsightError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should not remove the same set twice", async function() {
	// 		try {
	// 			await insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await insightFacade.removeDataset("ubc");
	// 			const result = insightFacade.removeDataset("ubc");
	// 			expect(result).to.eventually.be.rejectedWith(NotFoundError);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	// Accept
	// 	it("should return the ID if successful", async function() {
	// 		try {
	// 			await insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			const result: Promise<string> = insightFacade.removeDataset("ubc");
	// 			expect(result).to.eventually.deep.equal("ubc");
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	// it("should return the second ID if removing two", async function() {
	// 	// 	try {
	// 	// 		await insightFacade.addDataset("ubc", datasets["smallData"],
	// 	// 			InsightDatasetKind.Sections);
	// 	// 		await insightFacade.addDataset("second", datasets["smallData"],
	// 	// 			InsightDatasetKind.Sections);
	// 	// 		await insightFacade.removeDataset("second");
	// 	// 		const result: Promise<string> = insightFacade.removeDataset("ubc");
	// 	// 		await expect(result).to.eventually.deep.equal("ubc");
	// 	// 	} catch(err: any) {
	// 	// 		expect.fail("Error: " + err);
	// 	// 	}
	// 	// });
	// });

	/*
	 * Test list all dataset
	 */
	// describe("listDatasets", async function() {
	// 	// Accept
	// 	it("should be an empty list if the set has been removed", async function() {
	// 		try {
	// 			await insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await insightFacade.removeDataset("ubc");
	// 			const result: Promise<InsightDataset[]> = insightFacade.listDatasets();
	// 			const expectedEmptyArray: InsightDataset[] = [];
	// 			return expect(result).to.eventually.have.deep.members(expectedEmptyArray);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should return one dataset", async function() {
	// 		try {
	// 			await insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			const result: Promise<InsightDataset[]> = insightFacade.listDatasets();
	// 			await expect(result).to.eventually.become([{id: "ubc", kind: InsightDatasetKind.Sections,
	// 				numRows: 2}]);
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	// it("should return two datasets", async function() {
	// 	// 	try {
	// 	// 		await insightFacade.addDataset("ubc", datasets["smallData"],
	// 	// 			InsightDatasetKind.Sections);
	// 	// 		await insightFacade.addDataset("second", datasets["smallData"],
	// 	// 			InsightDatasetKind.Sections);
	// 	// 		const result: Promise<InsightDataset[]> = insightFacade.listDatasets();
	// 	// 		await expect(result).to.eventually.become([{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 2},
	// 	// 			{id: "second", kind: InsightDatasetKind.Sections, numRows: 2}]);
	// 	// 	} catch (err: any) {
	// 	// 		expect.fail("Error: " + err);
	// 	// 	}

	// 	// });

	// 	it("should return list remaining datasets after removal", async function() {
	// 		try {
	// 			await insightFacade.addDataset("ubc", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await insightFacade.addDataset("second", datasets["smallData"],
	// 				InsightDatasetKind.Sections);
	// 			await insightFacade.removeDataset("ubc");
	// 			const result: Promise<InsightDataset[]> = insightFacade.listDatasets();
	// 			await expect(result).to.eventually.become([{id: "second", kind: InsightDatasetKind.Sections,
	// 				numRows: 2}]);
	// 		} catch (err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});

	// 	it("should list an empty dataset", async function() {
	// 		try {
	// 			const newfacade = new InsightFacade();
	// 			const result: Promise<InsightDataset[]> = newfacade.listDatasets();
	// 			await expect(result).to.eventually.be.an("array").that.is.empty;
	// 		} catch(err: any) {
	// 			expect.fail("Error: " + err);
	// 		}
	// 	});
	// });

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			// console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("sections", datasets["pair"], InsightDatasetKind.Sections),
				facade.addDataset("rooms", datasets["room"], InsightDatasetKind.Rooms)
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			// console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";
		folderTest<unknown, InsightResult[], PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					expect(actual).to.have.deep.members(expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.an.instanceOf(ResultTooLargeError);
					} else {
						expect(actual).to.be.an.instanceOf(InsightError);
					}
				},
			}
		);
	});
});

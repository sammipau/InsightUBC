import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import * as fs from "fs-extra";

import {expect} from "chai";
import request, {Response} from "supertest";
import {clearDisk, getContentFromArchives} from "../TestUtil";

describe("REST tests", function () {
	let facade: InsightFacade;
	let server: Server;
	const serverUrl: string = "http://localhost:4321";
	let datasets: {[id: string]: string} = {};

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);

		datasets["pair"] 	= getContentFromArchives("pair.zip");
		datasets["room"] 	= getContentFromArchives("campus.zip");
		datasets["invalid"] = getContentFromArchives("nonJSON.zip");

		server.start();
	});

	after(function () {
		server.stop();
		clearDisk();
	});

	/*
	describe("PUT tests", function () {

		it("add valid sections dataset", function () {
			try {
				return request(serverUrl)
					.put("/dataset/sections/Sections")
					.send(fs.readFileSync("./test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(200);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("add valid rooms dataset", function () {
			try {
				return request(serverUrl)
					.put("/dataset/rooms/Rooms")
					.send(fs.readFileSync("./test/resources/archives/campus.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(200);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("add rooms with wrong kind", function () {
			try {
				return request(serverUrl)
					.put("/dataset/rooms/Sections")
					.send(fs.readFileSync("./test/resources/archives/campus.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(400);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("add sections with wrond kind", function () {
			try {
				return request(serverUrl)
					.put("/dataset/sections/ROoms")
					.send(fs.readFileSync("./test/resources/archives/pair.zip"))
					.set("Content-Type", "application/x-zip-compressed")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(400);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("add an invalid dataset", function () {
			try {
				return request(serverUrl)
					.put("/dataset/sections/Sections")
					.send(datasets["invalid"])
					.set("Content-Type", "application/x-zip-compressed")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(400);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		// it("missing kind in the request", function () {
		// 	try {
		// 		return request(serverUrl)
		// 			.put("/dataset/sections")
		// 			.send(fs.readFileSync("./test/resources/archives/pair.zip"))
		// 			.set("Content-Type", "application/x-zip-compressed")
		// 			.then(function (res: Response) {
		// 				console.log(res.status);
		// 				expect(res.status).to.be.equal(400);
		// 			})
		// 			.catch(function (err) {
		// 				expect.fail();
		// 			});
		// 	} catch (err) {
		// 		// and some more logging here!
		// 	}
		// });

		// it("missing params in the request", function () {
		// 	try {
		// 		return request(serverUrl)
		// 			.put("/dataset")
		// 			.send(fs.readFileSync("./test/resources/archives/pair.zip"))
		// 			.set("Content-Type", "application/x-zip-compressed")
		// 			.then(function (res: Response) {
		// 				expect(res.status).to.be.equal(404);
		// 			})
		// 			.catch(function (err) {
		// 				expect.fail();
		// 			});
		// 	} catch (err) {
		// 		// and some more logging here!
		// 	}
		// });

	});
	*/


	describe("DELETE tests", function () {
		it("remove sections dataset", function () {
			try {
				return request(serverUrl)
					.delete("/dataset/sections")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(200);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("remove rooms dataset", function () {
			try {
				return request(serverUrl)
					.delete("/dataset/rooms")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(200);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("remove already removed sections dataset", function () {
			try {
				return request(serverUrl)
					.delete("/dataset/sections")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(404);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("remove already removed rooms dataset", function () {
			try {
				return request(serverUrl)
					.delete("/dataset/rooms")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(404);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});
	});


	/*
	describe("GET tests", function () {
		it("list all datasets", function () {
			try {
				return request(serverUrl)
					.get("/datasets")
					.then(function (res: Response) {
						expect(res.status).to.be.equal(200);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});
	});
	*/

	describe("POST tests", function () {
		before(function () {
			// add rooms and sections -- this doesn't work here, needs to await or smth
			request(serverUrl)
				.put("/dataset/sections/Sections")
				.send(fs.readFileSync("./test/resources/archives/pair.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// console.log("add sections");
					// console.log(res.status);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail();
				});

			request(serverUrl)
				.put("/dataset/rooms/Rooms")
				.send(fs.readFileSync("./test/resources/archives/campus.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail();
				});

			console.log("before query");
		});

		it("invalid query", function () {
			let query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: [
						"sections_year",
						"overallMin"
					]
				},
				TRANSFORMATIONS: {
					APPLY: [
						{
							overallMin: {
								MAX: "sections_avg"
							}
						}
					]
				}
			};
			try {
				return request(serverUrl)
					.post("/query")
					.send(query)
					.set("Content-Type", "application/json")
					.then(function (res2: Response) {
						expect(res2.status).to.be.equal(400);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});

		it("run a valid query", function () {
			let simpleMax = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: [
						"sections_year",
						"overallMin"
					]
				},
				TRANSFORMATIONS: {
					GROUP: [
						"sections_year"
					],
					APPLY: [
						{
							overallMin: {
								MAX: "sections_avg"
							}
						}
					]
				}
			};
			try {
				return request(serverUrl)
					.post("/query")
					.send(simpleMax)
					.set("Content-Type", "application/json")
					.then(function (res2: Response) {
						expect(res2.status).to.be.equal(200);
					})
					.catch(function (err) {
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
			}
		});
	});
});

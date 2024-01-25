import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";
import * as fs from "fs-extra";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static facade: InsightFacade = new InsightFacade();

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port 	 = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		Server.facade.addDataset("sections",
			fs.readFileSync("test/resources/archives/pair.zip").toString("base64"), InsightDatasetKind.Sections);
		Server.facade.addDataset("rooms",
			fs.readFileSync("test/resources/archives/campus.zip").toString("base64"), InsightDatasetKind.Rooms);

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			// console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		// console.info("Server::stop()");
		// clearDisk();
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		this.express.put("/dataset/:id/:kind", this.addDataset);
		this.express.delete("/dataset/:id", this.removeDataset);
		this.express.post("/query", this.query);
		this.express.get("/datasets", this.listDatasets);
	}

	private async addDataset(req: Request, res: Response) {
		try {
			let kind: InsightDatasetKind;
			if (req.params.kind === "Rooms" || req.params.kind === "rooms") {
				kind = InsightDatasetKind.Rooms;
			} else if (req.params.kind === "Sections" || req.params.kind === "sections") {
				kind = InsightDatasetKind.Sections;
			} else {
				throw new Error("Invalid Kind.");
			}

			let data: string = "";
			if (req.body !== undefined) {
				data = (req.body).toString("base64");
			} else {
				throw new Error("Invalid data");
			}

			const response = await Server.facade.addDataset(req.params.id, data, kind);

			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: (err as Error).message});
		}
	}

	private async removeDataset(req: Request, res: Response) {
		try {
			const response = await Server.facade.removeDataset(req.params.id);

			res.status(200).json({result: response});
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({error: (err as Error).message});
			}
			res.status(400).json({error: (err as Error).message});
		}
	}

	private async query(req: Request, res: Response) {
		try {
			const response = await Server.facade.performQuery(req.body);

			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: (err as Error).message});
		}
	}

	private async listDatasets(req: Request, res: Response) {
		try {
			const response = await Server.facade.listDatasets();

			res.status(200).json({result: response});
		} catch (err) {
			// should never go here hypothetically
			res.status(400).json({error: (err as Error).message});
		}
	}
}

import JSZip from "jszip";
import * as parse5 from "parse5";
import http from "http";
import * as fs from "fs-extra";

interface Room {
    fullname: string;
    shortname: string;
    number: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furniture: string;
    href: string;
}
function findTableAndProcess(node: any, arr: Room[], zip: JSZip, id: string, promises: Array<Promise<any>>) {
	if (node.nodeName === "tr") {
		let room: Room = {
			fullname: "-1",
			shortname: "-1",
			number: "-1",
			name: "-1",
			address: "-1",
			lat: -1,
			lon: -1,
			seats: -1,
			type: "-1",
			furniture: "-1",
			href: "-1",
		};
		node.childNodes.forEach((node3: any) => {
			if (node3.nodeName === "td") {
				node3.attrs.forEach((attr: any) => {
					if (attr.value === "views-field views-field-field-building-code") {
						getText(node3, room, attr.value);
					} else if (attr.value === "views-field views-field-title") {
						getText(node3, room, attr.value);
					} else if (attr.value === "views-field views-field-field-building-address") {
						getText(node3, room, attr.value);
					}
				});
			}
		});
		if (room.shortname !== "-1" && room.fullname !== "-1" && room.address !== "-1") {
			let rm = zip.file("campus/discover/buildings-and-classrooms/" + room.shortname + ".htm");
			if (rm) {
				promises.push(rm.async("string").then((data) => {
					let document = parse5.parse(data);
					return makeGetRequest(room, document, arr, id);
				}));
			}
		}
	} else if (node.childNodes) {
		// Check if node has child nodes
		if (Array.isArray(node.childNodes)) {
			node.childNodes.forEach((childNode: any) => {
				findTableAndProcess(childNode, arr, zip, id, promises);
			});
		}
	}
}

function makeGetRequest(room: Room, document: any, arr: Room[], id: string): Promise<number> {
	return new Promise((resolve, reject) => {
		http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team188/" +
            encodeURIComponent(room.address), (res) => {
			let data = "";
			res.on("data", (d) => {
				data += d;
			});
			res.on("end", () => {
				let count = 0;
				const jsonData: any = JSON.parse(data);
				if (!(Object.prototype.hasOwnProperty.call(jsonData, "error"))){
					room.lat = jsonData.lat;
					room.lon = jsonData.lon;
					count += makeGetRequestHelper(room, document, arr, id);
				}
				resolve(count);
			});
		});
	});
}
function makeGetRequestHelper(room: Room, document: any, arr: Room[], id: string): number{
	let count = 0;
	document.childNodes.forEach((node4: any ) => {
		if (node4.nodeName === "html") {
			findTableAndProcess2(node4, room, arr, id);
		}
	});
	return count;
}
function findTableAndProcess2(node: any, room: Room, arr: Room[], id: string) {
	if (node.nodeName === "tr") {
		node.childNodes.forEach((node3: any) => {
			if (node3.nodeName === "td"){
				roomHelper(node3, room);
			}
		});
		if (room.number !== "-1" && room.seats !== -1 && room.furniture !== "-1" &&
			room.type !== "-1" && room.href !== "-1"){
			room.name = room.shortname + "_" + room.number;
			fs.outputJSONSync("./data/" + id + "/rooms/" + room.name + ".json", room);
			let rm = {
				fullname: room.fullname,
				shortname: room.shortname,
				number: room.number,
				name: room.name,
				address: room.address,
				lat: room.lat,
				lon: room.lon,
				seats: room.seats,
				type: room.type,
				furniture: room.furniture,
				href: room.href,
			};
			arr.push(rm);
		}
	} else if (node.childNodes) {
		// Check if node has child nodes
		if (Array.isArray(node.childNodes)) {
			node.childNodes.forEach((childNode: any) => {
				findTableAndProcess2(childNode, room, arr, id);
			});
		}
	}
}
function roomHelper(node: any, room: Room) {
	node.attrs.forEach((attr: any) => {
		if (attr.value === "views-field views-field-field-room-number"){
			node.childNodes.forEach((node2: any) => {
				if(node2.nodeName === "a"){
					getText(node2, room, attr.value);
				}
			});
		} else if (attr.value === "views-field views-field-field-room-capacity"){
			getText(node, room, attr.value);
		} else if (attr.value === "views-field views-field-field-room-furniture") {
			getText(node, room, attr.value);
		} else if (attr.value === "views-field views-field-field-room-type") {
			getText(node, room, attr.value);
		} else if (attr.value === "views-field views-field-nothing"){
			node.childNodes.forEach((node2: any) => {
				if(node2.nodeName === "a"){
					room.href = node2.attrs[0].value.trim();
				}
			});
		}
	});
}
function getText(node: any, room: Room, attr: string) {
	node.childNodes.forEach((node2: any) => {
		if(node2.nodeName === "#text"){
			if (attr === "views-field views-field-field-room-number"){
				room.number = node2.value.trim();
			} else if (attr === "views-field views-field-field-room-capacity"){
				room.seats = Number(node2.value.trim());
			} else if (attr === "views-field views-field-field-room-furniture") {
				room.furniture = node2.value.trim();
			} else if (attr === "views-field views-field-field-room-type") {
				room.type = node2.value.trim();
			}  else if (attr === "views-field views-field-field-building-address"){
				room.address = node2.value.trim();
			} else if(attr === "views-field views-field-field-building-code"){
				room.shortname = node2.value.trim();
			}
		} else if (node2.nodeName === "a"){
			node2.childNodes.forEach((node4: any) => {
				if(node4.nodeName === "#text"){
					room.fullname = node4.value.trim();
				}
			});
		}
	});
}
export {
	findTableAndProcess,
};

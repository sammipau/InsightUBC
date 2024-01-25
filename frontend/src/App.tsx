import React, {useState} from 'react';
import './App.css';

function App() {
	let query = {};
	let courseFound = "";

	const [text, setText] = useState<string>('');
	const [datasetList, setDatasetList] = useState<string[]>(["pair.zip","campus.zip"]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
	const [selectedColumns, setSelectedColumns] = useState<{ [key: string]: string[] }>({});
	const [filterData, setFilterData] = useState<string>('');
	const [applyRule, setApplyRule] = useState<string>('');
	const [columnApply, setColumnApply] = useState<string>('');
	const [apply, setApply] = useState<{ APPLY: Array<{ [key: string]: { [key: string]: string } }> }>({ APPLY: [] });
	const [where, setWhere] = useState<{ WHERE: { [key: string]: { [key: string]: any } } }>({ WHERE: {} });

	const handleDatasetClick = (dataset: string) => {
		console.log('Clicked on dataset:', dataset);

		setSelectedColumns((prevSelectedColumns) => ({
			...prevSelectedColumns,
			[selectedDataset || '']: [],
		}));

		setSelectedDataset(dataset);
	};

	const handleApplyRuleChange = (rule: string) => {
		setApplyRule(rule);
	};

	const handleColumnApplyChange = (rule: string) => {
		setColumnApply(rule);
	};

	const performQuery = () => {
		generateJson();
		setApply(apply);
		const apiUrl = "http://localhost:4321/query";

		const requestOptions = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(query)
		};

		return fetch(apiUrl, requestOptions)
			.then((response) => response.json() )
			.then((data) => {
				const textBox = document.getElementById('text-box');
				if (textBox) {
					if (courseFound !== "") {
						textBox.innerText = courseFound;
					} else {
						textBox.innerText = JSON.stringify(data, null, 2);
					}
				}
			})
			.catch((error) => {
				// Handle errors here
				console.error("Error:", error);
			});
	};

	const getComparator = (): string => {
		let comp: string = "IS";
		if (filterData.indexOf("greater") !== -1 || filterData.indexOf("over") !== -1 ||
			filterData.indexOf("bigger") !== -1 || filterData.indexOf("larger") !== -1) {
				comp = "GT";
		}
		if (filterData.indexOf("less") !== -1 || filterData.indexOf("smaller") !== -1 ||
			filterData.indexOf("little") !== -1 || filterData.indexOf("fewer") !== -1) {
				comp = "LT";
		}
		if (filterData.indexOf("euqal to") !== -1 || filterData.indexOf("same") !== -1 ||
			filterData.indexOf("identical") !== -1) {
				comp = "EQ";
		}

		return comp;
	};

	const getColumnSections = (): string => {
		let comp: string = "";

		if (filterData.indexOf("average") !== -1 || filterData.indexOf("avg") !== -1 || filterData.indexOf("mean") !== -1) {
			comp = "sections_avg";
		}
		else if (filterData.indexOf("pass") !== -1) {
			comp = "sections_pass";
		}
		else if (filterData.indexOf("fail") !== -1) {
			comp = "sections_fail";
		}
		else if (filterData.indexOf("audit") !== -1) {
			comp = "sections_audit";
		}
		else if (filterData.indexOf("year") !== -1) {
			comp = "sections_year";
		}
		else if (filterData.indexOf("department") !== -1 || filterData.indexOf("dept") !== -1 || filterData.indexOf("subject") !== -1) {
			comp = "sections_dept";
		}
		else if (filterData.indexOf("Course") !== -1 || filterData.indexOf("course") !== -1) {
			comp = "sections_id";
		}
		else if (filterData.indexOf("instructor") !== -1 || filterData.indexOf("professor") !== -1) {
			comp = "sections_instructor";
		}
		else if (filterData.indexOf("title") !== -1 || filterData.indexOf("Title") !== -1) {
			comp = "sections_title";
		}
		else if (filterData.indexOf("uuid") !== -1 || filterData.indexOf("UUID") !== -1
			|| filterData.indexOf("id") !== -1 || filterData.indexOf("ID") !== -1) {
			comp = "sections_uuid";
		}

		return comp;
	};

	const getColumnRooms = (): string => {
		let comp: string = "";

		if (filterData.indexOf("fullname") !== -1) {
			comp = "rooms_fullname";
		}
		if (filterData.indexOf("shortname") !== -1) {
			comp = "rooms_shortname";
		}
		if (filterData.indexOf("number") !== -1) {
			comp = "rooms_number";
		}
		if (filterData.indexOf("name") !== -1) {
			comp = "rooms_name";
		}
		if (filterData.indexOf("address") !== -1) {
			comp = "rooms_address";
		}
		if (filterData.indexOf("lat") !== -1 || filterData.indexOf("latitude") !== -1) {
			comp = "rooms_lat";
		}
		if (filterData.indexOf("lon") !== -1 || filterData.indexOf("longitude") !== -1) {
			comp = "rooms_id";
		}
		if (filterData.indexOf("seats") !== -1) {
			comp = "rooms_seats";
		}
		if (filterData.indexOf("type") !== -1) {
			comp = "rooms_type";
		}
		if (filterData.indexOf("furniture") !== -1) {
			comp = "rooms_furniture";
		}

		return comp;
	};

	const getValue = (): any => {
		let val: number;
		const regex = /\d+/;
		const num = filterData.match(regex);
		val = num ? parseInt(num[0]) : -1;

		return val;
	};

	const hasDepartment = (): string => {
		let deptList: string [] = ["CPSC", "EPSE"];
		for (const dept of deptList) {
			if (filterData.indexOf(dept) !== -1) {
				return dept.toLowerCase();
			}
			if (filterData.indexOf("COSC") !== -1) {
				courseFound = "Error. Cannot find course";
			}
		}
		return "";
	};

	const getColumnShortName = (col: string): string => {
		switch (col) {
			case "average":
				col = "avg";
				break;
			case "department":
				col = "dept";
				break;
		}

		return col;
	}

	const generateJson = () => {
		let dataset: string;

		if (selectedDataset=== "pair.zip") {
			dataset = "sections";
		} else {
			dataset = "rooms";
		}

		const selectedColumnsObject = Object.entries(selectedColumns).flatMap(([data, columns]) =>
			columns.map((column) => `${dataset}_${getColumnShortName(column)}`)
		);

		const applyColumns = apply.APPLY.map(entry => Object.keys(entry)[0]);

		const allColumns = [...selectedColumnsObject, ...applyColumns];

		let whereData;
		if (filterData === "") {
			setWhere({ WHERE: {} });
		} else {
			let comp = getComparator();
			let column;
			if (selectedDataset=== "pair.zip") {
				column = getColumnSections();
			} else {
				column = getColumnRooms();
			}
			let value = getValue();

			let dept = hasDepartment();
			if (dept !== "") {
				whereData = {
					AND: [
						{
							[comp]: {
								[column] : value
							}
						},
						{
							IS: {
								"sections_dept": dept
							}
						}
					]
				}
			} else {
				whereData = {
					[comp]: {
						[column] : value
					}
				}
			}
		}

		const wDat = {
			WHERE: whereData
		}

		query = {
			...wDat,
			OPTIONS: {
				COLUMNS: allColumns
			}
		};

		const textBox = document.getElementById('text-box');
		console.log('Generated JSON object:', query);
		if (textBox) {
			textBox.innerText = JSON.stringify(query, null, 2);
		}
	};

	const applyRuleJson = () => {
		// Check if all required values are present
		if (!text || !applyRule || !selectedDataset) {
			alert('Please fill in all the required fields.');
			return;
		}

		// Determine the value from the radio button in the third column
		let radioValue;
		if (selectedDataset === "pair.zip") {
			// Replace "contact" with the actual name of the radio button group
			const radioElement = document.querySelector('input[name="contact"]:checked') as HTMLInputElement;
			radioValue = radioElement?.value;
		} else {
			// Replace "contact1" with the actual name of the radio button group
			const radioElement = document.querySelector('input[name="contact1"]:checked') as HTMLInputElement;
			radioValue = radioElement?.value;
		}

		console.log('radioValue:', radioValue);

		// Build the new APPLY entry
		const newApplyEntry = {
			[text]: {
				[applyRule]: `${selectedDataset}_${columnApply}`
			}
		};

		// Update the APPLY object with the new entry using the functional form
		setApply((prevApply) => ({
			APPLY: [...prevApply.APPLY, newApplyEntry]
		}));

		const textBox = document.getElementById('text-box');
		console.log('Updated APPLY object:', apply);

		if (textBox) {
			textBox.innerText = JSON.stringify({
				APPLY: [...apply.APPLY, newApplyEntry]
			}, null, 2);
		}

		// Clear the input values after adding the entry
		setText('');
		setApplyRule('');
		setColumnApply('');
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!selectedFile) {
			alert('Please choose a file before submitting.');
			return;
		}

		// Use the file name as the dataset name
		const newDataset = selectedFile.name;
		setDatasetList((prevDatasetList) => [...prevDatasetList, newDataset]);
	};

	const handleCheckboxChange = (dataset: string, column: string) => {
		setSelectedColumns((prevSelectedColumns) => {
			const selectedColumnsForDataset = prevSelectedColumns[dataset] || [];
			const updatedColumns = selectedColumnsForDataset.includes(column)
				? selectedColumnsForDataset.filter((selectedColumn) => selectedColumn !== column)
				: [...selectedColumnsForDataset, column];

			return {
				...prevSelectedColumns,
				[dataset]: updatedColumns,
			};
		});
	};
	return (
		<div className="container">
			<header className="header">
				<h1>InsightUBC team 188</h1>
			</header>
			<div className="inputHeaders">
				{/* First Column */}
				<div className="column">
					<h2>Added Datasets</h2>
					<form className="form-inline" onSubmit={handleSubmit}>
						<div className="dataset-container">
							{datasetList.length ? <div className="dataset-list">
								{datasetList.map((dataset, index) => (
									<div
										key={index}
										className={`dataset-item ${
											selectedDataset === dataset ? 'selected' : ''
										}`}
										onClick={() => handleDatasetClick(dataset)}
									>
										{dataset}
									</div>
								))}
							</div> : <p>No Datasets Added</p>}

						</div>
					</form>
				</div>

				{/* Second Column */}
				<div className="column">
					<h2>Choose Columns</h2>
					<div className="HalfWidthHeightDataset-Container">
						{selectedDataset ?
								(selectedDataset=== "pair.zip" ?
										<form className="checkbox-form">
											{['average', 'pass', 'fail', 'audit', 'year', 'department', 'id', 'instructor', 'title', 'uuid'].map((option) => (
												<label key={option} className="checkbox-label">
													<input
														type="checkbox"
														onChange={() => handleCheckboxChange(selectedDataset, option)}
														checked={(selectedColumns[selectedDataset] || []).includes(option)}
													/>
													{option}
												</label>
											))}
										</form>:
										<form className="checkbox-form">
											{['fullname', 'shortname', 'number', 'name', 'address', 'lat', 'lon', 'seats', 'type', 'furniture', 'href'].map((option) => (
												<label key={option} className="checkbox-label">
													<input
														type="checkbox"
														onChange={() => handleCheckboxChange(selectedDataset, option)}
														checked={(selectedColumns[selectedDataset] || []).includes(option)}
													/>
													{option}
												</label>
											))}
										</form>
								)
						 : <p>Please Select a Dataset</p>}
					</div>
					<div className="BigWideContainer">
						<div className="big-textbox-container">
							{selectedDataset?<textarea
								placeholder="How would you like to filter the data?"
								value={filterData}
								onChange={(e) => setFilterData(e.target.value)}
								className="big-textbox"
							/>:<p>Please Select a Dataset</p>}


						</div>
					</div>
				</div>

				{/* Third Column */}
				<div className="column">
					<h2>Data Grouping Options</h2>
					<div className="Doubledataset-container">
						{/* Add content for the half-height container in Column 2 */}

						{/* 3 by 2 Grid */}
							<div className="grid-itemtop">
								Column Name
							</div>
							<div className="grid-itemtop">
								Apply Rule
							</div>
							<div className="grid-itemtop">
								Column to Apply to
							</div>
							<div className="grid-item">
								{selectedDataset?<div>
									<textarea
										placeholder="Name the column."
										value={text}
										onChange={(e) => setText(e.target.value)}
										className="small-textbox"
									/>
									<button
										className={`add-column-button ${selectedDataset ? '' : 'hidden'}`}
										onClick={() => applyRuleJson()}
									>
										Apply Rule
									</button>
								</div>:<p>Please Select a Dataset</p>}
							</div>
							<div className="grid-itemColumnOptions">
								{selectedDataset?
									<form className="radio-form">
										{['MAX', 'MIN', 'AVG', 'COUNT', 'SUM'].map((option) => (
											<div key={option} className="radiobox">
												<input
													type="radio"
													name="apply-rule"
													value={option}
													onChange={() => handleApplyRuleChange(option)}
													checked={applyRule === option}
												/>
												<label>{option}</label>
											</div>
										))}
									</form>:<p>Please Select a Dataset</p>}

							</div>
							<div className="grid-itemColumnOptions">
								{selectedDataset ?
									(selectedDataset=== "pair.zip" ?
										<form className="radio-form">
											{['average', 'pass', 'fail', 'audit', 'year', 'department', 'id','instructor', 'title', 'uuid'].map((option) => (
												<div key={option} className="radiobox">
													<input
														type="radio"
														name="contact1"
														value={option}
														onChange={() => handleColumnApplyChange(option)}
														checked={columnApply === option}
													/>
													<label>{option}</label>
												</div>
											))}
										</form>:
										<form className="radio-form">
											{['fullname', 'shortname', 'number', 'name', 'address', 'lat', 'lon', 'seats', 'type', 'furniture', 'href'].map((option) => (
												<div key={option} className="radiobox">
													<input
														type="radio"
														name="contact1"
														value={option}
														onChange={() => handleColumnApplyChange(option)}
														checked={columnApply === option}
													/>
													<label>{option}</label>
												</div>
											))}
										</form>)
									: <p>Please Select a Dataset</p>}
							</div>

					</div>
					<button className="PerformQuery" type="submit" onClick={performQuery}>
						Perform Query
					</button>
				</div>

			</div>
			{/* Big and wide container underneath columns 2 and 3 */}

			<div id="text-box" className="text-box-centered">
				Results will be displayed after a query is performed.
			</div>
		</div>
	);
}

export default App;

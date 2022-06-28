// box.sidebar from https://github.com/Snarling/bitburner-scripts/tree/main/box
import { createSidebarItem, sidebar } from "/box/box.js"
// numFormat from https://github.com/tyrope/bitburner/blob/master/lib/format.js
import { numFormat } from "/format.js"

/** @param {NS} ns **/
export async function main(ns) {
	let style=`<style></style>`;
	let item=createSidebarItem("CorpManager",`
		<div class=g2>
			<span>
				<center><div id="CM_corpName"></div></center>
				<table><tr>
				<td>Funds: <span class="hm span" style=color:#3ab200><div id="CM_corpFunds"></div></span></td>
				<td>Profits: <span class="hm span" style=color:#3ab200><div id="CM_corpProfits"></div></span></td>
				<td>Revenue: <span class="hm span" style=color:#3ab200><div id="CM_corpRevenue"></div></span></td>
				<td>Expenses: <span class="hm span" style=color:#3ab200><div id="CM_corpExpenses"></div></span></td>
				</tr></table>
			</span>
			</br>
			<span>
				<div id="CM_divisions"></div>
			</span>
		</div>`,"&#xeb7c");
	//&#xe0af
	let cm_running=true;

	let moneyFormat=(money)=> {
		return "$" + numFormat(money);
	}

	async function updateCorp() {
		if (!sidebar.contains(item)) {cm_running=false; return;};
		
		let corporation=ns.corporation.getCorporation();
		document.getElementById('CM_corpName').innerHTML=corporation.name;
		document.getElementById('CM_corpFunds').innerHTML=moneyFormat(corporation.funds);
		document.getElementById('CM_corpProfits').innerHTML=moneyFormat(corporation.revenue-corporation.expenses);
		document.getElementById('CM_corpRevenue').innerHTML=moneyFormat(corporation.revenue);
		document.getElementById('CM_corpExpenses').innerHTML=moneyFormat(corporation.expenses);
		
		let divisions=corporation.divisions;
		let divisionsElem=document.getElementById('CM_divisions');
		// Construct HTML
		divisionsElem.innerHTML=`${divisions.map(division=>`
			- ${division.name}:
			Research: <span class="hm span" style=color:#bc44ff>${numFormat(division.research)}</span></br>
			${division.products.map(product=>`
				${ns.corporation.getProduct(division.name, product).developmentProgress < 100 ? `(${ns.nFormat(ns.corporation.getProduct(division.name, product).developmentProgress, '0.00')}%)` : ns.corporation.getProduct(division.name, product).name}
				`)}
			</br>
			<button id="cm_${division.name}_cycleProduct">Cycle Products</button></br>
			${division.cities.map(office=>`
				::${office[0]}${office[1]}${office[2]}::
				Employees: ${ns.corporation.getOffice(division.name, office).employees.length}/${ns.corporation.getOffice(division.name, office).size} (${getNumUnemployed(division.name, office)})</br>
				<button id="cm_${division.name}_${office}_add15">+15(<span class="hm span" style=color:${moneyColour(ns.corporation.getOfficeSizeUpgradeCost(division.name, office, 15))}>${moneyFormat(ns.corporation.getOfficeSizeUpgradeCost(division.name, office, 15))}</span>)</button>
				<button id="cm_${division.name}_${office}_add150">+150(<span class="hm span" style=color:${moneyColour(ns.corporation.getOfficeSizeUpgradeCost(division.name, office, 150))}>${moneyFormat(ns.corporation.getOfficeSizeUpgradeCost(division.name, office, 150))}</span>)</button>
				${getNumUnemployed(division.name, office) > 0 ? `<button id="cm_${division.name}_${office}_assign">Assign Employees</button>` : ""}
				`).join('</br>')}
			`)
		}`;

		// Attach button methods
		divisions.map(division=>{
			let id_cycleProduct = `cm_${division.name}_cycleProduct`;
			let button_cycleProduct = document.getElementById(id_cycleProduct);
			button_cycleProduct.addEventListener("click", async function() {
				let prodName = ns.corporation.getDivision(division.name).products[0];

				ns.corporation.discontinueProduct(division.name, prodName);
				ns.corporation.makeProduct(division.name, "Aevum", prodName, corporation.funds * 0.05, corporation.funds * 0.05);
				
				if(ns.corporation.hasResearched(division.name, "Market-TA.II")) {
					ns.corporation.sellProduct(division.name, "Aevum", prodName, "MAX", "MP", true);
					ns.corporation.setProductMarketTA2(division.name, prodName, true);
				}else if(ns.corporation.hasResearched(division.name, "Market-TA.I")) {
					ns.corporation.sellProduct(division.name, "Aevum", prodName, "MAX", "MP", true);
					ns.corporation.setProductMarketTA1(division.name, prodName, true);
				}

				updateCorp();
			});

			division.cities.map(office=>{
				let id_add15 = `cm_${division.name}_${office}_add15`;
				let button_add15 = document.getElementById(id_add15);
				button_add15.addEventListener("click", async function() {
						let numAdd = 15;
						ns.corporation.upgradeOfficeSize(division.name, office, numAdd);
						for(let i=0;i<numAdd;i++) {
							ns.corporation.hireEmployee(division.name, office);
						}
						await assignEmployees(division.name, office);
						updateCorp();
				});
				
				let id_add150 = `cm_${division.name}_${office}_add150`;
				let button_add150 = document.getElementById(id_add150);
				button_add150.addEventListener("click", async function() {
						let numAdd = 150;
						ns.corporation.upgradeOfficeSize(division.name, office, numAdd);
						for(let i=0;i<numAdd;i++) {
							ns.corporation.hireEmployee(division.name, office);
						}
						await assignEmployees(division.name, office);
						updateCorp();
				});
				
				if(getNumUnemployed(division.name, office) > 0) {
					let id_assign = `cm_${division.name}_${office}_assign`;
					let button_assign = document.getElementById(id_assign);
					button_assign.addEventListener("click", async function() {
						await assignEmployees(division.name, office);
						updateCorp();
					});
				}
			});
		});
		return 1000;
	}

	function getNumUnemployed(divisionName, office) {
		let numUnemployed = 0;

		ns.corporation.getOffice(divisionName, office).employees.forEach(employee => {
			let job = ns.corporation.getEmployee(divisionName, office, employee).pos;
			
			if(job == "Unassigned") { numUnemployed++; }
		})

		return numUnemployed;
	}

	async function assignEmployees(divisionName, office) {
		let numPerJob = ns.corporation.getOffice(divisionName, office).size/5;
		try{
			await ns.corporation.setAutoJobAssignment(divisionName, office, "Operations", numPerJob);
			await ns.corporation.setAutoJobAssignment(divisionName, office, "Engineer", numPerJob);
			await ns.corporation.setAutoJobAssignment(divisionName, office, "Business", numPerJob);
			await ns.corporation.setAutoJobAssignment(divisionName, office, "Management", numPerJob);
			await ns.corporation.setAutoJobAssignment(divisionName, office, "Research & Development", numPerJob);
		}catch(error){ ns.print(error); }
	}

	function moneyColour(ammount){
		return (ns.corporation.getCorporation().funds<ammount)?"red":"#3ab200";
	}
	
	while(cm_running) {
		updateCorp();
		await ns.asleep(1000);
	}

}
import {createSidebarItem} from "/box/box.js"
import {numFormat} from "/format.js"

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL"); 
	ns.tail(); ns.clearLog();

	let tempAF = ns.stanek.activeFragments();
	let aF = []; let j = 0;
	for(let i = 0; i < tempAF.length; i++)
		if(tempAF[i].id < 100)
			aF[j++] = tempAF[i];


	// start of my dynamic HTML implementation
	const ssc = `<span class="hm span"style=color:`;
	let obj = (label = 'value') => ({label: label});
	// variable for dynamic HTML
	let fragDef = [];

	let fragDisp = `${ssc}green><center><div id="HM_money"></div></center>`;
	for(let i = 0; i < aF.length; i++){
		fragDef[i] = obj(("HM_frag" + i));
		fragDisp += `<div id="${fragDef[i].label}"></div>`;
	}
	fragDisp += "</span>";

	let item = createSidebarItem(`${ssc}#60d>Fragments</span>`, fragDisp, "\ueb29");
	// for(let i = 0; i < aF.length; i++)
	// 	item.querySelector(`#${fragDef[i].label}`).innerHTML = `${Math.floor(aF[i].numCharge)}`;

	while(true){
		item.querySelector(`#HM_money`).innerHTML = `$${numFormat(ns.getServerMoneyAvailable("home"))}`;

		j = 0;
		tempAF = ns.stanek.activeFragments();
		for(let i = 0; i < tempAF.length; i++)
			if(tempAF[i].id < 100)
				aF[j++] = tempAF[i];

		for(let i = 0; i < aF.length; i++){
			await ns.stanek.chargeFragment(aF[i].x,aF[i].y);
			item.querySelector(`#${fragDef[i].label}`).innerHTML = 
				`
					${ssc}#60d>id: 
						${ssc}red> ${aF[i].id}
							${ssc}purple>
								${Math.floor(aF[i].numCharge)}
							</span>
						</span>
					</span>
				`;
		}
		await ns.sleep(1000);
	}
}
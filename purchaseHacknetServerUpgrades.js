/** @param {NS} ns **/

let svObj = (location = 0, name = 'level', value = 0, price = 0) => (
	{ location: location, name: name, value: value, price: price });

let ns;
let node = {};
let hacknetServer;
let mult;
let hackMult;
let hacknetNode = [];
let time;
let nodeStats;

export async function main(ns2) {
	ns = ns2;
	ns.disableLog("ALL"); ns.tail();
	let index = 0;
	hacknetServer = ns.formulas.hacknetServers;
	nodeStats = ns.hacknet.getNodeStats;
	mult = ns.getPlayer().hacknet_node_money_mult;
	hackMult = ns.getHacknetMultipliers();

	// purchases first hacknet server
	// assumes you can afford it
	if (ns.hacknet.numNodes() == 0) 
		ns.hacknet.purchaseNode();

	await ns.sleep(1);
	for(index = 0; index < ns.hacknet.numNodes(); index++)
		hacknetNode.push(value(index));
	await ns.sleep(1);

	// inefficient implimentation of finding best hash/dollar value
	// to purchase by sorting
	hacknetNode.sort(function (a, b) { return a.value - b.value });
	
	ns.print(hacknetNode);

	while(true){
		ns.clearLog();
		time = 1000;
		
		// purchases cache upgrade if it costs less than 1% of available money
		for(index = 0; index < ns.hacknet.numNodes(); index++)
			if(ns.getServerMoneyAvailable("home") * .01 >= ns.hacknet.getCacheUpgradeCost(index,1))
				ns.hacknet.upgradeCache(index, 1);

		// 
		if(ns.getServerMoneyAvailable("home") * .5 > ns.hacknet.getPurchaseNodeCost()){
			ns.hacknet.purchaseNode();
			await ns.sleep(1);
			hacknetNode.push(value(ns.hacknet.numNodes()-1));
			await ns.sleep(1);
			hacknetNode.sort(function (a, b) { return a.value - b.value });
			time = 1;
		}else if(ns.getServerMoneyAvailable("home") * .25 > hacknetNode[0].price){
			purchase();
			time = 1;
		}

		for(index = 0; index < ns.hacknet.numNodes(); index++){
			node = nodeStats(index);
			ns.print(index, printNodes());
		}
		await ns.sleep(time);
	}

	// ns.print(hacknetServer.constants().MaxRam);
}


function purchase(){
	if(		hacknetNode[0].name === "level")ns.hacknet.upgradeLevel(hacknetNode[0].location, 1);
	else if(hacknetNode[0].name === "ram")	ns.hacknet.upgradeRam(	hacknetNode[0].location, 1);
	else if(hacknetNode[0].name === "cores")ns.hacknet.upgradeCore(	hacknetNode[0].location, 1);

	hacknetNode[0] = value(hacknetNode[0].location);
	hacknetNode.sort(function (a, b) { return a.value - b.value });
}
function value(index){
	let nodeIndex = ns.hacknet.getNodeStats(index);
	let nodeLevel = lvl( nodeIndex.level,nodeIndex.ram,nodeIndex.cores);
	let nodeRam   = ram( nodeIndex.level,nodeIndex.ram,nodeIndex.cores);
	let nodeCores = core(nodeIndex.level,nodeIndex.ram,nodeIndex.cores);

	return (nodeLevel < nodeRam && nodeLevel < nodeCores)?
			svObj(index,"level",nodeLevel, hacknetServer.levelUpgradeCost(nodeIndex.level,	1, hackMult.levelCost)):
			(nodeRam < nodeCores)?
			svObj(index,"ram",	nodeRam,	hacknetServer.ramUpgradeCost( nodeIndex.ram,	1, hackMult.ramCost)):
			svObj(index,"cores",nodeCores,	hacknetServer.coreUpgradeCost(nodeIndex.cores,	1, hackMult.coreCost));
}
function printNodes(){ 
	return (
		"	l:" + money(lvl( node.level,node.ram,node.cores)) +
		"	r:" + money(ram( node.level,node.ram,node.cores)) +
		"	c:" + money(core(node.level,node.ram,node.cores))
		);
}

function money(value){ return ns.nFormat(value, "$0.000a"); }

// calculations to find hash increase after
// incrementing the respective upgrade
function lvl(level, ram, cores){
	return hacknetServer.levelUpgradeCost(level, 1, hackMult.levelCost)
		/ (
			prod(level+1,ram,cores) -
			prod(level,ram,cores)
		);
}
function ram(level, ram, cores){
	return hacknetServer.ramUpgradeCost(ram, 1, hackMult.ramCost)
		/ (
			prod(level,ram*2,cores) -
			prod(level,ram,cores)
		);
}
function core(level, ram, cores){
	return hacknetServer.coreUpgradeCost(cores, 1, hackMult.coreCost)
		/ (
			prod(level,ram,cores+1) -
			prod(level,ram,cores)
		);
}
// the actual function that returns the
// ammount of hashes a server produces
// written to keep the functions readable
function prod(level,ram,cores){ return hacknetServer.hashGainRate(level,0,ram,cores,hackMult.production); }
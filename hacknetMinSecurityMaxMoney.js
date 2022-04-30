/** @param {NS} ns **/
let target; let ns;
export async function main(ns2) {
	ns = ns2;
	ns.disableLog("ALL"); ns.clearLog();
	target = (ns.args[0]) ? ns.args[0] : "n00dles";
	while(true) await ns.sleep(spend());
}

function spend(){
	ns.clearLog();
	ns.print(ns.getServerMinSecurityLevel(target));
	if(ns.getServerMinSecurityLevel(target) > 1)
		ns.hacknet.spendHashes(ns.hacknet.getHashUpgrades()[2], target);
	ns.hacknet.spendHashes(ns.hacknet.getHashUpgrades()[3], target);
	return 1000;
}
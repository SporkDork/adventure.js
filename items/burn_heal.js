function burn_heal_func() {
	if (Math.abs(player.actor.status) != 1) return;
	player.actor.status = 0;
	player.actor.status_str = "Normal";
};

var BurnHeal = {
	'item_name': "Burn Heal",
	'desc': "Heals you from feeling the bern!",
	'use_func': burn_heal_func
};

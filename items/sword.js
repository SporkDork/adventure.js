var Sword = {
	'item_name': "Sword",
	'desc': "The classic killstick of doom!",
	'durable': true,
	'use_func': function() {
		var l = player.location;
		if (!rooms[l].enemy || !rooms[l].enemy.actor) {
			return "Woosh! Your sword slices through the air!<br/>";
		}
		if (Math.random() >= 0.95) {
			return "Swing and a miss!<br/>";
		}
		rooms[l].enemy.actor.hp -= damageCalc(8, 13, rooms[l].enemy.actor.defence, player.actor.attack);
		return "";
	}
};

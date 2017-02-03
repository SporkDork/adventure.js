var Gablin = {
	'actor': new Actor(20, 1, 1.5, "Gablin"),
	'desc': "Like a goblin, but with more scales and a spikey tail.",
	'intro': "Say your prayersssssss!",
	'death': "Curssssssssssssse you!",
	'dialog': [
		"Take thisssssss!",
		"I'm the besssssssst! Deal with it!",
		"It'sss time for my ssssssspecial attack!",
		"You won't get away from me thisssssss time!",
		"Damn it! I misssssssssed!"
	],
	'item': TomatoSauce,
	'move_func': function() {
		var rng = Math.random();
		var phrase = Math.floor(Math.random() * 4);
		if (phrase == 2 && rng < 0.8) { // special attack
			player.actor.status = 1;
			player.actor.status_str = "Burned";
		}
		else if (phrase != 2 && rng > 0.1) {
			player.actor.hp -= damageCalc(9, 14, player.actor.defence, this.actor.attack);
		}
		else {
			phrase = 4;
		}
		return this.dialog[phrase];
	}
};

var MagicChips = {
	'item_name': "Magic Chips",
	'desc': "Steam and sparkles flow from this mysterious snack.",
	'use_func': function() {
		burn_heal_func();
		player.actor.hp += 40;
	}
};

combs[0] = {
	'pair_item': "Burn Heal",
	'result': MagicChips,
	'creation_text': "The unlikely powers of medicine and sauce unite to form a true work of art!"
};

var TomatoSauce = {
	'item_name': "Tomato Sauce",
	'desc': "Gives you some dank HP.",
	'combinations': [combs[0]],
	'use_func': function() {
		player.actor.hp += 20;
	}
};

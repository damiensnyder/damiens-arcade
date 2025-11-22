const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["arena.png","base/body_A1.png","base/body_F1.png","base/body_M1.png","base/face_1.png","base/face_2.png","base/hair_A1.png","base/hair_A2.png","base/hair_A3.png","base/hair_A4.png","base/hair_F1.png","base/hair_F2.png","base/hair_F3.png","base/hair_F4.png","base/hair_M1.png","base/hair_M2.png","base/hair_M3.png","base/hair_M4.png","base/shirt_A1.png","base/shirt_A2.png","base/shirt_F1.png","base/shirt_F2.png","base/shirt_M1.png","base/shirt_M2.png","base/shoes_A1.png","base/shoes_F1.png","base/shoes_M1.png","base/shorts_A1.png","base/shorts_F1.png","base/shorts_M1.png","base/socks_A1.png","base/socks_F1.png","base/socks_M1.png","charge.png","damage.png","equipment/battle-axe.png","equipment/bow.png","equipment/censored-bar.png","equipment/chainsaw-headband.png","equipment/claws-for-alarm.png","equipment/corn-dog.png","equipment/devil-horns.png","equipment/diamond-sword.png","equipment/eyepatch.png","equipment/fairy-hat.png","equipment/flamingo-floaty.png","equipment/flower-of-power.png","equipment/foam-finger.png","equipment/frilly-skirt.png","equipment/full-suit-of-armor.png","equipment/halo.png","equipment/headbutters-delight.png","equipment/headwings.png","equipment/horrible-pants.png","equipment/house-arrest-ankle-bracelet.png","equipment/jellyhat.png","equipment/jorts-of-power.png","equipment/knife-shoes.png","equipment/laser-blaster.png","equipment/novelty-arrow-hat.png","equipment/rhinoceros-beetle-horn.png","equipment/roller-blades.png","equipment/scary-mask.png","equipment/shield.png","equipment/shirt-of-many-belts.png","equipment/shiv.png","equipment/shrapnel.png","equipment/snowman-head.png","equipment/speedo.png","equipment/sports-jersey.png","equipment/steel-toed-boots.png","equipment/t-shirt-of-the-future.png","equipment/the-ratio-inator.png","equipment/viking-helmet.png","equipment/wand-of-flames.png","equipment/zap-helmet.png","favicon.ico","projectiles/arrow.png","projectiles/bullet.png","projectiles/fireball.png","projectiles/laser.png","projectiles/snowball.png","sounds/yourturn.wav","watchtowerexpand.woff2","watchtowergradital.woff2","zoomed/equipment/battle-axe.png","zoomed/equipment/bow.png","zoomed/equipment/censored-bar.png","zoomed/equipment/chainsaw-headband.png","zoomed/equipment/claws-for-alarm.png","zoomed/equipment/corn-dog.png","zoomed/equipment/devil-horns.png","zoomed/equipment/diamond-sword.png","zoomed/equipment/eyepatch.png","zoomed/equipment/fairy-hat.png","zoomed/equipment/flamingo-floaty.png","zoomed/equipment/flower-of-power.png","zoomed/equipment/foam-finger.png","zoomed/equipment/frilly-skirt.png","zoomed/equipment/full-suit-of-armor.png","zoomed/equipment/halo.png","zoomed/equipment/headbutters-delight.png","zoomed/equipment/headwings.png","zoomed/equipment/horrible-pants.png","zoomed/equipment/house-arrest-ankle-bracelet.png","zoomed/equipment/jellyhat.png","zoomed/equipment/jorts-of-power.png","zoomed/equipment/knife-shoes.png","zoomed/equipment/laser-blaster.png","zoomed/equipment/novelty-arrow-hat.png","zoomed/equipment/rhinoceros-beetle-horn.png","zoomed/equipment/roller-blades.png","zoomed/equipment/scary-mask.png","zoomed/equipment/shield.png","zoomed/equipment/shirt-of-many-belts.png","zoomed/equipment/shiv.png","zoomed/equipment/shrapnel.png","zoomed/equipment/snowman-head.png","zoomed/equipment/speedo.png","zoomed/equipment/sports-jersey.png","zoomed/equipment/steel-toed-boots.png","zoomed/equipment/t-shirt-of-the-future.png","zoomed/equipment/the-ratio-inator.png","zoomed/equipment/viking-helmet.png","zoomed/equipment/wand-of-flames.png","zoomed/equipment/zap-helmet.png"]),
	mimeTypes: {".png":"image/png",".wav":"audio/wav",".woff2":"font/woff2"},
	_: {
		client: {start:"_app/immutable/entry/start.B9d1UQgn.js",app:"_app/immutable/entry/app.bXYY6uYa.js",imports:["_app/immutable/entry/start.B9d1UQgn.js","_app/immutable/chunks/CjKtfhWQ.js","_app/immutable/chunks/DfFwswwW.js","_app/immutable/chunks/DOqcjq3e.js","_app/immutable/entry/app.bXYY6uYa.js","_app/immutable/chunks/DfFwswwW.js","_app/immutable/chunks/BRn3e2qh.js","_app/immutable/chunks/BMcGth1X.js","_app/immutable/chunks/DOqcjq3e.js","_app/immutable/chunks/DlwCMHKs.js","_app/immutable/chunks/BpJTh4_1.js","_app/immutable/chunks/BGbmyu5m.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CF3Z6WrL.js')),
			__memo(() => import('./chunks/1-CBAFIz3P.js')),
			__memo(() => import('./chunks/2-Bk9N6fS7.js')),
			__memo(() => import('./chunks/3-DuuiWqgl.js')),
			__memo(() => import('./chunks/4-BBPRTcYq.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/auction-ttt",
				pattern: /^\/auction-ttt\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/auction-ttt/game/[roomCode]",
				pattern: /^\/auction-ttt\/game\/([^/]+?)\/?$/,
				params: [{"name":"roomCode","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map

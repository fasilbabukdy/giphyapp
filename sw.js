// SW Version
const version = '1.2';
const appAssets = [
	'/index.html',
	'/main.js',
	'/images/flame.png',
	'/images/logo.png',
	'/images/sync.png',
	'/vendor/bootstrap.min.css',
	'/vendor/jquery.min.js'
];

// SW Install
self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(`static-${version}`).then((cache) => cache.addAll(appAssets)));
});

// SW Activate
self.addEventListener('activate', (event) => {
	// clean static cache
	let cleaned = caches.keys().then((keys) => {
		keys.forEach((key) => {
			if (key !== `static-${version}` && key.match('static-')) {
				return caches.delete(key);
			}
		});
	});
	event.waitUntil(cleaned);
});

const staticCache = (req, cacheName = `static-${version}`) => {
	return caches.match(req).then((cachedRes) => {
		if (cachedRes) return cachedRes;

		return fetch(req).then((networkRes) => {
			caches.open(cacheName).then((cache) => cache.put(req, networkRes));

			return networkRes.clone();
		});
	});
};

// Network with Cache fallback
const fallbackCache = (req) => {
	return fetch(req)
		.then((networkRes) => {
			// check res is ok, esle to cache
			if (!networkRes.ok) throw 'Fetch Error';

			// Update cache
			caches.open(`static-${version}`).then((cache) => cache.put(req, networkRes));

			//Return Clone of Netwokr response
			return networkRes.clone();

			// Try cache
		})
		.catch((err) => caches.match(req));
};

// Clean old Giphy from giphy cache

const cleanGiphyCache = (giphy) => {
	caches.open('giphys').then((cache) => {
		cache.keys().then((keys) => {
			// Loop entries
			keys.forEach((key) => {
				if (!giphy.includes(key.url)) cache.delete(key);
			});
		});
	});
};

// SW fetch
self.addEventListener('fetch', (event) => {
	// App Shell
	if (event.request.url.match(location.origin)) {
		event.respondWith(staticCache(event.request));

		// Giphy API
	} else if (event.request.url.match('api.giphy.com/v1/gifs/trending')) {
		event.respondWith(fallbackCache(event.request));
	} else if (event.request.url.match('giphy.com/media')) {
		event.respondWith(staticCache(event.request, 'giphys'));
	}
});

// Listen for message form client
self.addEventListener('message', (event) => {
	if (event.data.action === 'cleanGiphyCache') cleanGiphyCache(event.data.giphys);
});

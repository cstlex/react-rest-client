export default class ReactRestClient {
	constructor (baseUrl = '', prepare = undefined, urlencode = false) {
		if (!baseUrl) throw new Error('missing baseUrl');
		this.headers = {
			'Accept': 'application/json'
		};
		this.baseUrl = baseUrl;
		try {
			if (!this.baseUrl.endsWith('/')){
				this.baseUrl += '/';
			}
		} catch(err) { console.error(err); }
		this.prepared = true;
		this.urlencode = urlencode;
		if (prepare){
			this.prepared = false;
			prepare().then((headers) => {
				this.prepared = true;
				Object.assign(this.headers, headers);
				if (this.onInternalReady){
					this.onInternalReady();
				}
			});
		}
	}

	updateHeaders(headers){
		Object.assign(this.headers, headers);
	}

	onReady() {
		return new Promise((resolve) => {
            if (this.prepared){
                resolve();
            } else {
                this.onInternalReady = () => {
                    resolve();
                }
            }
        });
	}

	internalFetch(route, method, body = {}, paramToQuery = false){
		return this.onReady().then(() => {
			if (!route){
				throw new Error('missing route');
			}

			route = `${this.baseUrl}${route}`;

			var options = {
				method: method,
				headers: this.headers
			};

			if (paramToQuery){
				route += "?" + Object.keys(body).map(key => {
					return `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`
				}).join("&");
				body = undefined;
			}

			options.headers['Content-Type'] = 'application/json';
			if (body){
				if (this.urlencode){
					options.body = JSON.stringify(body);
				} else if (Object.keys(body).length > 0) {
					let data = new FormData();
					body = Object.keys(body).forEach(key => {
						data.append(key, body[key]);
					});
					options.body = data;
					options.headers['Content-Type'] = 'multipart/form-data';
				}
			}

			return fetch(route, options).then(response => response.json());
		});
	}

	GET(route, query) {
		return this.internalFetch(route, 'GET', query, true);
	}

	DELETE(route, query) {
		return this.internalFetch(route, 'DELETE', query, true);
	}

	POST(route, body) {
		return this.internalFetch(route, 'POST', body);
	}

	PUT(route, body) {
		return this.internalFetch(route, 'PUT', body);
	}
}
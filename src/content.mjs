import { parseDomain } from "parse-domain";

chrome.storage.local.get(["rules"]).then(({ rules }) => {
	function replaceUrl(h) {
		if (!URL.canParse(h)) return;
		let url = new URL(h);

		const parsed = parseDomain(url.hostname);
		if (parsed.type == "INVALID") return;
		const key = parsed.domain + "." + parsed.topLevelDomains.join(".");

		const rule = rules[key];
		if (rule == undefined) return;

		top: for (const r of rule) {
			if (r.subdomains.length > 0) {
				for (let i = parsed.subDomains.length; i > 0; i--) {
					if (r.subdomains[i] != parsed.subDomains[i]) continue top;
				}
			}
			if (r.pathname && !url.pathname.startsWith(r.pathname)) continue;

			let u = decodeURIComponent(url.searchParams.get(r.param));
			if (u == "undefined") continue;
			if (!u) continue;
			if (!URL.canParse(u)) continue;

			return u;
		}
	}

	function replaceEle(ele) {
		const h = ele.href;
		if (typeof h === "undefined" || h?.length == 0) return;
		if (h[0] == "#" || h[0] == "/") return;
		let url = replaceUrl(h);
		if (url == undefined) return;
		while (true) {
			let a = replaceUrl(url);
			if (a == undefined) break;
			url = a;
		}

		ele.href = url;
		links.add(ele);
	}

	const links = new Set();

	function observeLinks() {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				switch (mutation.type) {
					case "childList":
						mutation.addedNodes.forEach((node) => {
							replaceEle(node);
						});
						break;
					case "attributes":
						if (mutation.attributeName == "href" && !links.has(mutation.target)) {
							replaceEle(mutation.target);
						}
						break;
				}
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributeFilter: ["href"],
			attributes: true,
		});
	}

	document.addEventListener("mouseover", (e) => {
		if (e.target.tagName == "A" && !links.has(e.target)) {
			replaceEle(e.target);
		}
	});

	observeLinks();
});

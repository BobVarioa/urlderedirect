import { parseDomain } from "parse-domain";

chrome.runtime.onInstalled.addListener(() => {
	// TODO: fetch from somewhere
	const linkMatchers = `
	target.georiot.com?GR_URL
	click.linksynergy.com?murl
	onemore.pxf.io?u
	www.anrdoezrs.net?url
	www.awin1.com?p
	goto.walmart.com?u
	shop-links.co?url
	www.dpbolvw.net?url
	goto.target.com?u
	bestbuy.7tiv.net?u
	youtube.com/redirect?q
	go.redirectingat.com?url
	out.reddit.com?url
	click.redditmail.com?url
	pixel.everesttech.net?url
	www.ojrq.net?return
	facebook.com/l.php?u
	steamcommunity.com/linkfilter?url
	l.instagram.com?u
	t.umblr.com/redirect?z
	google.com/url?q
	google.com/url?url
	google.com?adurl
	googleadservices.com/?adurl
	t.mailpgn.com/l/?fl
	us18.mailchimp.com/mctx/clicks?url
	medium.com/m/global-identity?redirectUrl
	jsv3.recruitics.com/redirect?rx_url
	links.govdelivery.com/track?url
	site.com?r
	site3.com?r
	linksynergy.com?murl
	gate.sc?url
	vk.com/away.php?to
	curseforge.com/linkout?remoteUrl
	l.messenger.com/l.php?u
	smartredirect.de?url
	exactag.com?url
	disq.us?url
	alabout.com?url
	tradedoubler.com?url
	tradedoubler.com?_td_deeplinkq
	srvtrck.com?url
	mysku.ru?r
	admitad.com?ulp
	digidip.net?url
	dpbolvw.net?url
	mailpanion.com?destination
	signtr.website?redirect
	mailtrack.io?url
	effiliation.com?url
	hlserve.com?dest
	flexlinkspro.com?url
	idealo-partner.com?trg
	webgains.com?wgtarget
	getpocket.com?url
	tokopedia.com/promo?r
	app.adjust.com?redirect
	duckduckgo.com/l?uddg
	partner-ads.com?htmlurl
	4chan.org/derefer?url
	`;

	const rules = {};

	for (const matcher of linkMatchers.split("\n")) {
		const [m, param] = matcher.trim().split("?");

		if (m.length == 0) continue;

		const sections = [];
		const paths = [];

		let current = "";
		let place = "url";

		for (let i = 0; i < m.length; i++) {
			const char = m[i];

			switch (char) {
				case "/":
					if (place == "url") {
						sections.push(current);
						current = "";
						place = "path";
					} else {
						paths.push(current +"/");
						current = "";
					}
					break;

				case ".":
					if (place == "url") {
						sections.push(current);
						current = "";
						break;
					}

				default:
					current += char;
					break;
			}
		}

		if (current != "") {
			if (place == "url") {
				sections.push(current);
			} else {
				paths.push(current);
			}
			current = "";
		}

		const full = sections.join(".");
		let parsed = parseDomain(full);
		if (parsed.type == "INVALID") continue;
		const key = parsed.domain + "." + parsed.topLevelDomains.join(".");
		const r = {
			pathname: "/" + paths.join(""),
			param,
			subdomains: parsed.subDomains,
		};

		if (rules[key]) {
			rules[key].push(r);
		} else {
			rules[key] = [r];
		}
	}

	chrome.storage.local.set({ rules });
});
